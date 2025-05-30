// components/ReviewDisplayCard.js
'use client';

import React from 'react';
import Image from 'next/image'; // Next.js 이미지 최적화
import styles from './ReviewDisplayCard.module.css';
// import Link from 'next/link'; // 필요하다면 상세 리뷰 페이지로 이동하는 링크 추가 가능

export default function ReviewDisplayCard({ review }) {
  if (!review) {
    return null;
  }

  // 표시할 이미지 (최대 2개)
  const displayImages = review.imageUrls ? review.imageUrls.slice(0, 2) : [];
  const remainingImagesCount = review.imageUrls ? review.imageUrls.length - displayImages.length : 0;

  return (
    <div className={styles.reviewCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <p className={styles.authorName}>{review.authorName}</p>
          <p className={styles.serviceDetails}>
            <span className={styles.serviceTypeClickable}>{review.serviceType}</span> {/* '오피스텔' 부분 */}
            {' '}{review.area} {/* '9평' 부분 */}
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
            <div key={index} className={styles.imageWrapper}>
              <Image 
                src={url} 
                alt={`리뷰 이미지 ${index + 1}`} 
                layout="fill" 
                objectFit="cover" 
                className={styles.reviewImage}
                // 로컬 이미지가 아닌 경우 next.config.js에 도메인 추가 필요
              />
              {/* 두 번째 이미지이고, 추가 이미지가 있을 경우 +N 표시 */}
              {index === 1 && remainingImagesCount > 0 && (
                <div className={styles.moreImagesOverlay}>
                  +{remainingImagesCount}
                </div>
              )}
            </div>
          ))}
          {/* 이미지가 1개만 있고 추가 이미지가 있을 경우 (총 2개 이상) */}
          {displayImages.length === 1 && remainingImagesCount > 0 && (
             <div className={styles.imageWrapper}> {/* 두번째 이미지 자리에 오버레이 표시 */}
                <Image 
                    src={review.imageUrls[0]} // 첫번째 이미지 다시 보여주거나, placeholder
                    alt={`리뷰 이미지 1`} 
                    layout="fill" 
                    objectFit="cover" 
                    className={styles.reviewImage}
                    style={{ filter: 'brightness(70%)' }} // 약간 어둡게 처리
                />
                <div className={styles.moreImagesOverlay}>
                    +{remainingImagesCount}
                </div>
            </div>
          )}
        </div>
      )}
       {/* 각 카드를 클릭해서 상세 리뷰로 이동하게 하려면 Link로 감싸거나 onClick 핸들러 추가 */}
       {/* 예: <Link href={`/reviews/detail/${review.id}`}> ...카드 내용... </Link> */}
    </div>
  );
}