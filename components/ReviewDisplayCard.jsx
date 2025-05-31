// components/ReviewDisplayCard.js
'use client';

import React from 'react';
import Image from 'next/image';
import styles from './ReviewDisplayCard.module.css';

export default function ReviewDisplayCard({ review, onImageClick }) {
  // console.log('ReviewDisplayCard - onImageClick type:', typeof onImageClick, onImageClick); // 디버깅 로그

  if (!review) {
    return null;
  }

  const displayImages = review.imageUrls ? review.imageUrls.slice(0, 2) : [];
  const remainingImagesCount = review.imageUrls ? review.imageUrls.length - displayImages.length : 0;

  const handleImageClick = (imageUrl) => {
    // console.log('handleImageClick called with URL:', imageUrl); // 디버깅 로그
    if (typeof onImageClick === 'function') {
      onImageClick(imageUrl);
    } else {
      console.warn("ReviewDisplayCard: onImageClick prop is not a function or not provided. Clicked URL:", imageUrl);
    }
  };

  return (
    <div className={styles.reviewCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <p className={styles.authorName}>{review.authorName}</p>
          <p className={styles.serviceDetails}>
            <span className={styles.serviceTypeClickable}>{review.serviceType}</span>
            {' '}{review.area}
          </p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.rating}>⭐ {typeof review.rating === 'number' ? review.rating.toFixed(1) : review.rating}</span>
          <p className={styles.usageDate}>이용날짜 {review.usageDate}</p>
        </div>
      </div>

      <p className={styles.reviewText}>{review.text}</p>

      {displayImages && displayImages.length > 0 && (
        <div className={styles.imageGrid}>
          {displayImages.map((url, index) => (
            <div
              key={index}
              className={styles.imageWrapper}
              onClick={() => handleImageClick(url)} // <<--- 여기에 onClick 핸들러 추가!
              style={{ cursor: typeof onImageClick === 'function' ? 'pointer' : 'default' }}
            >
              <Image
                src={url}
                alt={`리뷰 이미지 ${index + 1}`}
                fill
                style={{ objectFit: 'cover' }}
                className={styles.reviewImage}
                sizes="(max-width: 480px) 40vw, (max-width: 768px) 20vw, 150px"
                priority={index < 2}
              />
              {index === 1 && remainingImagesCount > 0 && (
                <div
                  className={styles.moreImagesOverlay}
                  onClick={(e) => { // 오버레이 클릭 시
                    e.stopPropagation(); // 부모 div의 onClick 중복 실행 방지
                    handleImageClick(url); // handleImageClick 호출
                  }}
                >
                  +{remainingImagesCount}
                </div>
              )}
            </div>
          ))}
          {/* 이미지가 1개만 있고 추가 이미지가 있을 경우 (총 2개 이상) */}
          {displayImages.length === 1 && remainingImagesCount > 0 && (
            <div
              className={styles.imageWrapper}
              // 이 경우, 첫 번째 이미지를 클릭하는 것이므로, 첫 번째 이미지의 URL을 사용합니다.
              // 이미 displayImages.map() 바깥에 있으므로, review.imageUrls[0]을 직접 사용합니다.
              onClick={() => handleImageClick(review.imageUrls[0])} // <<--- 여기에 onClick 핸들러 추가!
              style={{ cursor: typeof onImageClick === 'function' ? 'pointer' : 'default' }}
            >
              <Image
                src={review.imageUrls[0]} // 첫 번째 이미지를 어둡게 표시
                alt={`리뷰 이미지 1 (추가 이미지 있음)`}
                fill
                style={{ objectFit: 'cover', filter: 'brightness(70%)' }}
                className={styles.reviewImage}
                sizes="(max-width: 480px) 40vw, (max-width: 768px) 20vw, 150px"
              />
              <div
                className={styles.moreImagesOverlay}
                onClick={(e) => { // 오버레이 클릭 시
                  e.stopPropagation();
                  handleImageClick(review.imageUrls[0]); // handleImageClick 호출
                }}
              >
                +{remainingImagesCount}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}