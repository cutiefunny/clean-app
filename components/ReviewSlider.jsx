// components/ReviewSlider.js
'use client';

import React, { useState }
from 'react';
import Image from 'next/image'; // Next.js 이미지 최적화를 위해 사용
import styles from './ReviewSlider.module.css';

// Swiper React 컴포넌트 및 모듈 import
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, A11y, Autoplay } from 'swiper/modules'; // 페이지네이션, 접근성, 자동재생 모듈

// Swiper 기본 스타일 및 페이지네이션 스타일 import
import 'swiper/css';
import 'swiper/css/pagination';
// import 'swiper/css/autoplay'; // 자동 재생 사용 시


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
        {review.images.map((imgSrc, index) => (
          <div key={index} className={styles.reviewImageWrapper}>
            <Image
              src={imgSrc}
              alt={`${review.location} 리뷰 이미지 ${index + 1}`}
              width={200} // placeholder 이미지 비율에 맞춤, 실제 이미지 크기에 따라 조절
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
        modules={[Pagination, A11y, Autoplay]}
        slidesPerView={'auto'}
        centeredSlides={false}
        loop={reviews.length > 1} // 리뷰가 1개 초과일 때만 루프
        grabCursor={true}
        spaceBetween={1} // <<--- 이 값을 조절하세요 (예: 10, 15, 20 등, 단위는 px)
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