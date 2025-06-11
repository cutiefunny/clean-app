// components/ImageLightbox.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './ImageLightbox.module.css';

export default function ImageLightbox({ imageUrls = [], startIndex = 0, alt = "확대 이미지", onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  // 이미지 배열이 비어있으면 렌더링하지 않음
  if (!imageUrls || imageUrls.length === 0) {
    return null;
  }

  // 유효한 index 범위로 조정
  useEffect(() => {
    if (currentIndex < 0) {
      setCurrentIndex(imageUrls.length - 1);
    } else if (currentIndex >= imageUrls.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, imageUrls.length]);

  // [수정] 버튼 클릭 시 인덱스가 배열 범위를 순환하도록 로직 개선
  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1
    );
  }, [imageUrls.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
    );
  }, [imageUrls.length]);

  // Esc 키로 닫기 (기존 로직 유지)
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const currentImageUrl = imageUrls[currentIndex];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.contentDialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.imageOuterContainer}>
          {imageUrls.length > 1 && (
            <button className={`${styles.navButton} ${styles.prevButton}`} onClick={handlePrev}>
              &lt;
            </button>
          )}
          {currentImageUrl && typeof currentImageUrl === 'string' ? (
            <div className={styles.imageWrapper}>
              <Image
                key={currentImageUrl}
                src={currentImageUrl}
                alt={`${alt} ${currentIndex + 1}/${imageUrls.length}`}
                width={1920}
                height={1080}
                style={{
                  objectFit: 'contain',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
  
                  height: 'auto',
                  borderRadius: '4px',
                }}
                priority
              />
              <button className={styles.closeButton} onClick={onClose}>&times;</button>
            </div>
          ) : null}
          {imageUrls.length > 1 && (
            <button className={`${styles.navButton} ${styles.nextButton}`} onClick={handleNext}>
              &gt;
            </button>
          )}
          {/* <button className={styles.closeButton} onClick={onClose}>&times;</button> */}
        </div>
      </div>
    </div>
  );
}