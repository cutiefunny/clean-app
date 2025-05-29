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
          <p className={styles.serviceType}>{review.serviceType}</p>
        </div>
        <div className={styles.rating}>
          ⭐ {review.rating.toFixed(1)}
        </div>
      </div>
      <p className={styles.reviewText}>{review.text}</p>
      <div className={styles.reviewImages}>
        {review.images.map((imgSrc, index) => (
          <div key={index} className={styles.reviewImageWrapper}>
            <Image
              src={imgSrc}
              alt={`${review.location} 리뷰 이미지 ${index + 1}`}
              width={300} // placeholder 이미지 비율에 맞춤, 실제 이미지 크기에 따라 조절
              height={200}
              className={styles.reviewImage}
              onError={(e) => e.target.src = 'https://via.placeholder.com/300x200?text=Image+Error'} // 이미지 로드 실패 시 대체
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
        // Swiper 모듈 등록
        modules={[Pagination, A11y, Autoplay]} // 자동 재생을 원하면 Autoplay 추가
        spaceBetween={15} // 슬라이드 사이 간격 (px)
        slidesPerView={1}   // 한 번에 보여줄 슬라이드 개수
        pagination={{ clickable: true }} // 하단 점(dots) 클릭으로 이동 가능
        loop={reviews.length > 1} // 리뷰가 1개 초과일 때 무한 루프 (선택 사항)
        // autoplay={{ // 자동 재생 설정 (선택 사항)
        //   delay: 3000, // 3초마다 슬라이드
        //   disableOnInteraction: false, // 사용자 상호작용 후에도 자동 재생 유지
        // }}
        grabCursor={true} // 마우스 오버 시 잡는 커서 모양
        // Swiper의 터치 이벤트가 기본적으로 활성화되어 있습니다.
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