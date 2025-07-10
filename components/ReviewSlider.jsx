// /components/ReviewSlider.js
'use client';

import React from 'react';
import Image from 'next/image';
import styles from './ReviewSlider.module.css';

// Swiper React 컴포넌트 및 모듈 import
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, A11y, Autoplay } from 'swiper/modules';

// Swiper 기본 스타일 및 페이지네이션 스타일 import
import 'swiper/css';
import 'swiper/css/pagination';

// 개별 리뷰 카드 컴포넌트
const ReviewCard = ({ review }) => {
  if (!review) return null;

  return (
    <div className={styles.reviewCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.location}>{review.location}</h3>
          <span className={styles.serviceType}>{review.serviceType}</span>
          <span className={styles.rating}>
            ⭐ {review.rating.toFixed(1)}
          </span>
        </div>
      </div>
      <p className={styles.reviewText}>{review.text}</p>
      <div className={styles.reviewImages}>
        {review.images.slice(0, 2).map((imgSrc, index) => ( // 이미지를 2개까지만 보여주도록 수정
          <div key={index} className={styles.reviewImageWrapper}>
            <Image
              src={imgSrc}
              alt={`${review.location} 리뷰 이미지 ${index + 1}`}
              width={200}
              height={200}
              className={styles.reviewImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/600x400/EEE/31343C?text=Image+Error';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// 리뷰 슬라이더 메인 컴포넌트 (Swiper 적용)
const ReviewSlider = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return <p>표시할 리뷰가 없습니다.</p>;
  }

  return (
    <div className={styles.sliderContainer}>
      <Swiper
        modules={[A11y]} // Pagination, Autoplay는 제거하여 심플하게 구성
        // [수정] 한 번에 1.5개의 슬라이드를 보여주도록 설정
        slidesPerView={1.5}
        // [수정] 슬라이드 간의 간격 설정
        spaceBetween={15}
        loop={reviews.length > 2} // 루프는 슬라이드가 충분히 많을 때만 작동
        grabCursor={true}
      >
        {reviews.map((review) => (
          <SwiperSlide key={review.id} className={styles.swiperSlide}>
            <ReviewCard review={review} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ReviewSlider;