// /app/reviews/write/[requestId]/page.js (오류 수정 및 로직 개선)
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header2 from '@/components/Header2';
import styles from './WriteReviewPage.module.css';
import Image from 'next/image';
import { useModal } from '@/contexts/ModalContext';

import { ScrollMenu } from 'react-horizontal-scrolling-menu';
import 'react-horizontal-scrolling-menu/dist/styles.css'; // 라이브러리 기본 CSS

// Firestore 및 Storage 모듈 임포트
import { db, storage } from '@/lib/firebase/clientApp';
import { doc, getDoc, addDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 별점 컴포넌트 (기존과 동일)
const StarRating = ({ maxRating = 5, rating, onRatingChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const starContainerRef = useRef(null);

  const calculateRatingFromEvent = useCallback((event) => {
    if (!starContainerRef.current) return rating;
    const rect = starContainerRef.current.getBoundingClientRect();
    let clientX;

    if (event.touches && event.touches.length > 0) clientX = event.touches[0].clientX;
    else if (event.changedTouches && event.changedTouches.length > 0) clientX = event.changedTouches[0].clientX;
    else if (typeof event.clientX !== 'undefined') clientX = event.clientX;
    else return rating;

    const offsetX = clientX - rect.left;
    const containerWidth = rect.width;
    const effectiveStarWidth = containerWidth / maxRating;

    let calculatedRating = Math.ceil(offsetX / effectiveStarWidth);
    calculatedRating = Math.max(1, Math.min(calculatedRating, maxRating));
    return calculatedRating;
  }, [maxRating, rating]);

  const handleInteractionStart = (event) => {
    setIsDragging(true);
    const newRating = calculateRatingFromEvent(event);
    onRatingChange(newRating);
  };

  const handleInteractionMove = (event) => {
    if (isDragging) {
      const newRating = calculateRatingFromEvent(event);
      onRatingChange(newRating);
    }
  };

  const handleInteractionEnd = () => {
    if (isDragging) setIsDragging(false);
  };

  useEffect(() => {
    const endDragGlobal = () => { if (isDragging) setIsDragging(false); };
    window.addEventListener('mouseup', endDragGlobal);
    window.addEventListener('touchend', endDragGlobal);
    return () => {
      window.removeEventListener('mouseup', endDragGlobal);
      window.removeEventListener('touchend', endDragGlobal);
    };
  }, [isDragging]);

  const starsToRender = Array.from({ length: maxRating }, (_, i) => (
    <div key={i + 1} className={styles.starImageWrapper}>
      <Image
        src={rating >= i + 1 ? '/images/Star-full.png' : '/images/Star-empty.png'}
        alt={`${i + 1}번째 별`}
        width={36} height={36}
        className={styles.starImage}
        priority={i + 1 <= rating}
      />
    </div>
  ));

  return (
    <div
      ref={starContainerRef}
      className={styles.starRatingContainer}
      onMouseDown={handleInteractionStart} onMouseMove={handleInteractionMove} onMouseUp={handleInteractionEnd} onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart} onTouchMove={handleInteractionMove} onTouchEnd={handleInteractionEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {starsToRender}
    </div>
  );
};


export default function WriteReviewPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params?.requestId;
  const { showAlert } = useModal();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState([]); // string(URL) 또는 File 객체 저장
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [existingReviewId, setExistingReviewId] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const MAX_TEXT_LENGTH = 1000;
  const MAX_PHOTOS = 5;

  const fileInputRef = useRef(null);

  // 데이터 로딩 로직
  useEffect(() => {
    if (!requestId) {
      setError('잘못된 접근입니다.');
      setLoading(false);
      return;
    }
    const storedAuth = sessionStorage.getItem('identityVerifiedUser');
    if (!storedAuth) {
        showAlert('본인인증이 필요합니다.');
        router.replace('/');
        return;
    }
    const authData = JSON.parse(storedAuth);

    const loadData = async () => {
      setLoading(true);
      try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, where("requestId", "==", requestId));
        const reviewSnapshot = await getDocs(q);

        if (!reviewSnapshot.empty) {
          const reviewDoc = reviewSnapshot.docs[0];
          const reviewData = reviewDoc.data();
          setExistingReviewId(reviewDoc.id);
          setRating(reviewData.rating || 0);
          setReviewText(reviewData.content || '');
          setPhotos(reviewData.imageUrls || []);
          setRequestDetails(reviewData);
        } else {
          const requestRef = doc(db, 'requests', requestId);
          const requestSnap = await getDoc(requestRef);
          if (requestSnap.exists() && requestSnap.data().applicantName === authData.name) {
            setRequestDetails(requestSnap.data());
          } else {
            throw new Error("리뷰를 작성할 신청 내역을 찾을 수 없거나 권한이 없습니다.");
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [requestId, router, showAlert]);
  
  // photos 상태가 변경될 때마다 미리보기 URL을 생성/해제하는 useEffect
  useEffect(() => {
    const newPreviews = photos.map(photo => {
      if (typeof photo === 'string') {
        return photo; // 기존 URL은 그대로 사용
      }
      return URL.createObjectURL(photo); // File 객체는 blob URL 생성
    });
    setPhotoPreviews(newPreviews);

    // 컴포넌트가 언마운트되거나 photos가 변경되기 전에 기존 blob URL 해제
    return () => {
      newPreviews.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photos]);

  const handleRatingChange = (newRating) => setRating(newRating);
  const handleTextChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_TEXT_LENGTH) setReviewText(text);
  };

  // [수정] 사진 추가 핸들러
  const handlePhotoAdd = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // 현재 사진 개수와 새로 추가될 사진 개수의 합이 최대치를 넘지 않도록 제한
    const remainingSlots = MAX_PHOTOS - photos.length;
    if (files.length > remainingSlots) {
      showAlert(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있습니다. ${remainingSlots}장 더 추가할 수 있습니다.`);
    }
    const filesToAdd = files.slice(0, remainingSlots);
    setPhotos(prevPhotos => [...prevPhotos, ...filesToAdd]);

    // input 값 초기화하여 동일한 파일 다시 선택 가능하게 함
    event.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // [수정] 특정 슬롯의 사진을 변경/추가하는 함수
  const handlePhotoChange = (event, index) => {
    const file = event.target.files[0];
    if (!file) return;

    const newPhotos = [...photos];
    newPhotos[index] = file;
    setPhotos(newPhotos.slice(0, 5)); // 최대 5개 사진으로 제한
  };

  // [추가] 특정 슬롯의 사진을 제거하는 함수
  const handleRemovePhoto = (indexToRemove) => {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmitReview = async () => {
    if (rating === 0 || reviewText.trim() === '') {
      showAlert("별점과 리뷰 내용을 모두 입력해주세요.");
      return;
    }
    if (!requestDetails) {
      showAlert("리뷰를 작성할 대상 정보가 없습니다. 페이지를 새로고침 해주세요.");
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const uploadPromises = photos
        .filter(p => p instanceof File)
        .map(file => {
          const storageRef = ref(storage, `reviews/${requestId}/${Date.now()}_${file.name}`);
          return uploadBytes(storageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
        });
      const newImageUrls = await Promise.all(uploadPromises);

      const existingImageUrls = photos.filter(p => typeof p === 'string');
      const finalImageUrls = [...existingImageUrls, ...newImageUrls];

      const reviewData = {
        requestId,
        rating,
        content: reviewText,
        imageUrls: finalImageUrls,
        userName: requestDetails.applicantName || requestDetails.userName,
        userPhone: requestDetails.applicantContact || requestDetails.userPhone,
        serviceType: requestDetails.field || requestDetails.serviceType,
        blind: false, // 기본값은 false로 설정
        updatedAt: serverTimestamp(),
      };
      
      if (existingReviewId) {
        const reviewRef = doc(db, 'reviews', existingReviewId);
        await updateDoc(reviewRef, reviewData);
      } else {
        await addDoc(collection(db, 'reviews'), {
          ...reviewData,
          createdAt: serverTimestamp(),
        });
      }

      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, { reviewWritten: true });

      showAlert("후기가 성공적으로 저장되었습니다!");
      router.push(`/requests`);

    } catch (err) {
      console.error("Error submitting review:", err);
      setError("후기 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) return <div className={styles.pageContainer}><p>로딩 중...</p></div>;
  if (error) return <div className={styles.pageContainer}><p>{error}</p></div>;

  return (
    <div className={styles.pageContainer}>
      <Header2 title="후기작성" onBack={() => router.back()} />
      <main className={styles.formContainer}>
        <div className={styles.ratingSection}>
          <StarRating rating={rating} onRatingChange={handleRatingChange} />
        </div>
        {/* ==================== [수정] 사진 업로드 섹션 ==================== */}
        <div className={styles.photoUploadSection}>
          <ScrollMenu>
            {/* 기존에 추가된 사진들을 렌더링 */}
            {photoPreviews.map((previewUrl, index) => (
              <div key={`photo-${index}`} className={styles.photoUploadBoxContainer}>
                <div className={styles.photoUploadBox}>
                  <Image src={previewUrl} alt={`preview ${index + 1}`} layout="fill" objectFit="cover" className={styles.photoPreview} />
                  <button 
                    type="button" 
                    className={styles.removePhotoButton} 
                    onClick={(e) => {
                      e.preventDefault(); 
                      handleRemovePhoto(index);
                    }}
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
            
            {/* 사진 추가 버튼 (최대 개수에 도달하지 않았을 경우에만 보임) */}
            {photos.length < MAX_PHOTOS && (
              <div key="add-photo" className={styles.photoUploadBoxContainer}>
                <button type="button" className={styles.photoUploadBox} onClick={triggerFileInput}>
                  <span>+</span>
                </button>
              </div>
            )}
          </ScrollMenu>
          {/* 실제 파일 업로드를 담당하는 숨겨진 input */}
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            multiple // 여러 파일 선택 가능하도록
            onChange={handlePhotoAdd} 
            style={{ display: 'none' }} 
          />
        </div>
        {/* ============================================================= */}
        <div className={styles.textReviewSection}>
          <textarea
            className={styles.textArea}
            value={reviewText}
            onChange={handleTextChange}
            placeholder="솔직한 리뷰를 입력해주세요."
            rows="8"
          />
          <div className={styles.charCount}>{reviewText.length} / {MAX_TEXT_LENGTH}</div>
        </div>
        <div className={styles.guidelines}>
          <p>• 주문 상품과 무관한 사진 / 동영상을 올리면 삭제되거나 블라인드 처리될 수 있음</p>
          <p>• 사진이 포함된 리뷰가 더 효과적.</p>
        </div>
      </main>
      <footer className={styles.footer}>
        <button className={styles.saveButton} onClick={handleSubmitReview} disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
      </footer>
    </div>
  );
}
