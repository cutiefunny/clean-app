// app/reviews/write/[requestId]/page.js
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link'; // 뒤로가기 등에 사용 가능
import Header2 from '@/components/Header2'; // 기존 헤더 컴포넌트 사용 또는 새 헤더
import styles from './WriteReviewPage.module.css';
import Image from 'next/image'; // next/image 임포트

// 간단한 별점 컴포넌트
const StarRating = ({ maxRating = 5, rating, onRatingChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const starContainerRef = useRef(null);

  const calculateRatingFromEvent = useCallback((event) => {
    if (!starContainerRef.current) return rating;
    const rect = starContainerRef.current.getBoundingClientRect();
    let clientX;

    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX;
    } else if (typeof event.clientX !== 'undefined') {
      clientX = event.clientX;
    } else {
      return rating;
    }

    const offsetX = clientX - rect.left;
    const containerWidth = rect.width; // 전체 컨테이너 너비
    // 각 별 이미지를 감싸는 요소가 있다면 그 요소의 너비를 사용하거나,
    // 컨테이너 너비를 별의 개수로 나누어 각 별이 차지하는 영역을 추정합니다.
    // 여기서는 컨테이너 너비를 별 개수로 나눕니다.
    const effectiveStarWidth = containerWidth / maxRating;

    let calculatedRating = Math.ceil(offsetX / effectiveStarWidth);
    calculatedRating = Math.max(1, Math.min(calculatedRating, maxRating));
    return calculatedRating;
  }, [maxRating, rating]);

  const handleInteractionStart = (event) => {
    // event.preventDefault(); // 기본 동작 방지 (필요시)
    setIsDragging(true);
    const newRating = calculateRatingFromEvent(event);
    onRatingChange(newRating);
  };

  const handleInteractionMove = (event) => {
    if (isDragging) {
      // event.preventDefault();
      const newRating = calculateRatingFromEvent(event);
      onRatingChange(newRating);
    }
  };

  const handleInteractionEnd = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  useEffect(() => {
    const endDragGlobal = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    window.addEventListener('mouseup', endDragGlobal);
    window.addEventListener('touchend', endDragGlobal);
    document.addEventListener('mouseleave', endDragGlobal); // 마우스가 창 밖으로 나갈 때

    return () => {
      window.removeEventListener('mouseup', endDragGlobal);
      window.removeEventListener('touchend', endDragGlobal);
      document.removeEventListener('mouseleave', endDragGlobal);
    };
  }, [isDragging]);

  const starsToRender = [];
  for (let i = 1; i <= maxRating; i++) {
    starsToRender.push(
      // 각 이미지를 감싸는 div를 추가하여 클릭/터치 영역을 명확히 하고 스타일링 용이하게 함
      <div key={i} className={styles.starImageWrapper}>
        <Image
          src={rating >= i ? '/images/Star-full.png' : '/images/Star-empty.png'}
          alt={rating >= i ? `${i}번째 채워진 별` : `${i}번째 빈 별`}
          width={36} // 원하는 별 이미지의 너비 (픽셀 단위)
          height={36} // 원하는 별 이미지의 높이 (픽셀 단위)
          className={styles.starImage} // 이미지 자체에 대한 스타일 (필요시)
          priority={i <= rating} // 초기 렌더링 시 채워진 별은 우선 로드 (선택적)
        />
      </div>
    );
  }

  return (
    <div
      ref={starContainerRef}
      className={styles.starRatingContainer} // 새 클래스 또는 기존 .starRating 사용
      onMouseDown={handleInteractionStart}
      onMouseMove={handleInteractionMove}
      onMouseLeave={handleInteractionEnd} // 컨테이너 벗어날 때 드래그 종료
      onTouchStart={handleInteractionStart}
      onTouchMove={handleInteractionMove}
      style={{ touchAction: 'pan-y' }}
    >
      {starsToRender}
    </div>
  );
};

export default function WriteReviewPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params ? params.requestId : null;

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState([]); // 선택된 사진 파일들 (File 객체) 또는 URL
  const MAX_TEXT_LENGTH = 1000;

  // requestId가 있다면, 해당 요청에 대한 정보를 가져와서 보여줄 수도 있습니다 (선택 사항)
  // useEffect(() => {
  //   if (requestId) {
  //     // const requestDetails = await fetchRequestDetails(requestId);
  //     // setRequestDetails(requestDetails);
  //     console.log("Reviewing for request ID:", requestId);
  //   }
  // }, [requestId]);

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_TEXT_LENGTH) {
      setReviewText(text);
    }
  };

  const handlePhotoUpload = (event) => {
    // 여러 파일 업로드 처리 (간단한 예시, 최대 2개)
    const files = Array.from(event.target.files);
    if (photos.length + files.length > 2) {
        alert("사진은 최대 2장까지 업로드할 수 있습니다.");
        // files = files.slice(0, 2 - photos.length); // 잘라내거나 혹은 입력 자체를 막는 방법도 고려
        return;
    }

    // TODO: 실제 파일 업로드 로직 및 미리보기 구현
    // 여기서는 파일 이름만 간단히 저장하거나, File 객체 자체를 저장합니다.
    setPhotos(prevPhotos => [...prevPhotos, ...files.slice(0, 2 - prevPhotos.length)]);
    console.log("Uploaded files:", files);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert("별점을 선택해주세요.");
      return;
    }
    if (reviewText.trim() === '') {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    const reviewData = {
      requestId,
      rating,
      text: reviewText,
      photos: photos.map(file => file.name), // 실제로는 업로드 후 URL 또는 파일 참조 저장
      createdAt: new Date().toISOString(),
    };

    console.log("Submitting review:", reviewData);
    // TODO: 실제 Firebase Firestore 또는 백엔드 API로 리뷰 데이터 전송
    // 예: await saveReviewToFirestore(reviewData);

    alert("후기가 성공적으로 저장되었습니다! (실제 저장 로직은 구현 필요)");
    router.push(`/requests/${requestId}`); // 또는 후기 목록 페이지 등으로 이동
  };

  return (
    <div className={styles.pageContainer}>
      <Header2 title="후기작성" onBack={() => router.back()} /> {/* 이전 페이지로 이동 */}
      
      <main className={styles.formContainer}>
        <div className={styles.ratingSection}>
          <StarRating rating={rating} onRatingChange={handleRatingChange} />
        </div>

        <div className={styles.photoUploadSection}>
          {/* 이미지에 있는 두 개의 '+' 박스를 표현 */}
          {[0, 1].map((index) => (
            <label key={index} className={styles.photoUploadBox}>
              {photos[index] ? (
                <img 
                    src={URL.createObjectURL(photos[index])} 
                    alt={`preview ${index + 1}`} 
                    className={styles.photoPreview} 
                    onLoad={() => URL.revokeObjectURL(photos[index])} // 메모리 누수 방지
                />
              ) : (
                <span>+</span>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
                style={{ display: 'none' }} 
                // multiple // 여러 파일 선택을 허용하려면
              />
            </label>
          ))}
        </div>

        <div className={styles.textReviewSection}>
          <textarea
            className={styles.textArea}
            value={reviewText}
            onChange={handleTextChange}
            placeholder="솔직한 리뷰를 입력해주세요."
            rows="8"
          />
          <div className={styles.charCount}>
            {reviewText.length} / {MAX_TEXT_LENGTH}
          </div>
        </div>

        <div className={styles.guidelines}>
          <p>• 주문 상품과 무관한 사진 / 동영상을 올리면 삭제되거나 블라인드 처리될 수 있음</p>
          <p>• 사진이 포함된 리뷰가 더 효과적.</p>
        </div>
      </main>

      <footer className={styles.footer}>
        <button className={styles.saveButton} onClick={handleSubmitReview}>
          저장
        </button>
      </footer>
    </div>
  );
}