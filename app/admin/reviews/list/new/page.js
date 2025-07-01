// /app/admin/reviews/list/new/page.js
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header2 from '@/components/Header2';
import styles from '@/app/reviews/write/[requestId]/WriteReviewPage.module.css';
import Image from 'next/image';
import { useModal } from '@/contexts/ModalContext';

import { ScrollMenu } from 'react-horizontal-scrolling-menu';
import 'react-horizontal-scrolling-menu/dist/styles.css';

// Firestore 및 Storage 모듈 임포트
import { db, storage } from '@/lib/firebase/clientApp';
import { doc, getDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
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

// --- 메인 페이지 컴포넌트 ---
export default function NewReviewPage() {
  const router = useRouter();
  const { showAlert } = useModal();

  const [buildingType, setBuildingType] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [usageDate, setUsageDate] = useState('');
  const [userName, setUserName] = useState('');
  const [serviceType, setServiceType] = useState(''); // [추가] serviceType 상태

  // 건물형태 및 평수 옵션 로딩을 위한 상태
  const [buildingTypeOptions, setBuildingTypeOptions] = useState([]);
  const [flatSizesOptions, setFlatSizesOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const MAX_TEXT_LENGTH = 1000;
  const MAX_PHOTOS = 5;

  const fileInputRef = useRef(null);

  // 서비스 타입 옵션 (Step1Service.js 참조)
  const serviceOptions = [
    "신축 입주 청소", "이사 청소", "준공 리모델링 청소", "상가&사무실 청소", "기타 청소"
  ];

  // Firestore에서 건물 형태 및 평수 옵션을 불러오는 useEffect
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const docRef = doc(db, 'settings', 'cleaningOptions');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setBuildingTypeOptions(data.buildingTypes || []);
          setFlatSizesOptions(data.flatSizes || []);
        } else {
          console.error("Cleaning options document not found!");
          setBuildingTypeOptions([]);
          setFlatSizesOptions([]);
        }
      } catch (error) {
        console.error("Error fetching cleaning options:", error);
        setError("옵션을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    // photos 상태가 변경될 때마다 미리보기 URL을 생성/해제하는 useEffect
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

  // 사진 추가 핸들러
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

  // 특정 슬롯의 사진을 제거하는 함수
  const handleRemovePhoto = (indexToRemove) => {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  // 제출 핸들러
  const handleSubmitReview = async () => {
    // 유효성 검사 - serviceType 필드 추가
    if (rating === 0 || reviewText.trim() === '' || !buildingType.trim() || !areaSize.trim() || !usageDate.trim() || !userName.trim() || !serviceType.trim()) {
      showAlert("별점, 리뷰 내용, 건물 형태, 평수, 이용 날짜, 작성자 이름, 서비스 타입을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const uploadPromises = photos
        .filter(p => p instanceof File)
        .map(file => {
          // 리뷰 사진 경로에 'virtual' 폴더 추가
          const storageRef = ref(storage, `reviews/virtual/${Date.now()}_${file.name}`);
          return uploadBytes(storageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
        });
      const newImageUrls = await Promise.all(uploadPromises);

      const existingImageUrls = photos.filter(p => typeof p === 'string');
      const finalImageUrls = [...existingImageUrls, ...newImageUrls];

      // 리뷰 데이터에 새로운 필드 포함
      const reviewData = {
        rating,
        content: reviewText,
        imageUrls: finalImageUrls,
        buildingType,
        areaSize,
        usageDate: Timestamp.fromDate(new Date(usageDate)), // Convert date string to Timestamp
        userName,
        serviceType, // [추가] serviceType 저장
        blind: false,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'reviews'), reviewData);
      
      showAlert("가상 후기가 성공적으로 저장되었습니다!");
      router.push('/admin/reviews/list'); // 저장 후 관리자 리뷰 목록으로 이동

    } catch (err) {
      console.error("Error submitting review:", err);
      setError("후기 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loadingOptions) return <div className={styles.pageContainer}><p>옵션 로딩 중...</p></div>;
  if (error) return <div className={styles.pageContainer}><p>{error}</p></div>;

  return (
    <div className={styles.pageContainer}>
      <main className={styles.formContainer}>
        {/* ==================== 가상 리뷰 정보 입력 섹션 ==================== */}
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '15px' }}>가상 리뷰 정보 입력</h2>
          <div style={{ marginBottom: '10px' }}>
            <label style={{display: 'block', marginBottom: '5px'}}>작성자 이름</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="작성자 이름 입력"
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{display: 'block', marginBottom: '5px'}}>서비스 타입</label>
            <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            >
                <option value="">서비스 타입을 선택해주세요.</option>
                {serviceOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{display: 'block', marginBottom: '5px'}}>건물 형태</label>
            <select
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value)}
                style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            >
                <option value="">형태를 선택해주세요.</option>
                {buildingTypeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{display: 'block', marginBottom: '5px'}}>평수</label>
            <select
                value={areaSize}
                onChange={(e) => setAreaSize(e.target.value)}
                style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            >
                <option value="">평형을 선택해주세요.</option>
                {flatSizesOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{display: 'block', marginBottom: '5px'}}>이용 날짜</label>
            <input
              type="date"
              value={usageDate}
              onChange={(e) => setUsageDate(e.target.value)}
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>
        {/* ============================================================= */}
        <div className={styles.ratingSection}>
          <StarRating rating={rating} onRatingChange={handleRatingChange} />
        </div>
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
            multiple
            onChange={handlePhotoAdd} 
            style={{ display: 'none' }} 
          />
        </div>
        <div className={styles.textReviewSection}>
          <textarea
            className={styles.textArea}
            value={reviewText}
            onChange={handleTextChange}
            placeholder=""
            rows="8"
          />
          <div className={styles.charCount}>{reviewText.length} / {MAX_TEXT_LENGTH}</div>
        </div>
        <button className={styles.saveButton} onClick={handleSubmitReview} disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
      </main>
    </div>
  );
}
