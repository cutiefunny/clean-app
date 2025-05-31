// components/ImageLightbox.js
'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import styles from './ImageLightbox.module.css';

export default function ImageLightbox({ src, alt = "확대 이미지", onClose }) {
  // Esc 키로 닫기
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

  if (!src) {
    return null;
  }

   return (
    <div className={styles.overlay} onClick={onClose}>
      {/* 클릭 이벤트 전파 중지: 이미지나 버튼 클릭 시 오버레이의 onClick이 실행되지 않도록 */}
      <div className={styles.contentDialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.imageOuterContainer}> {/* 이 컨테이너가 기준점 */}
          <Image
            src={src}
            alt={alt}
            // width와 height prop은 Next.js가 이미지 최적화 및 srcset 생성을 위해 사용합니다.
            // 이미지의 원본 또는 고화질의 종횡비를 나타내는 값을 제공합니다.
            width={1920} // 예시: 고화질 이미지의 일반적인 너비
            height={1080} // 예시: 고화질 이미지의 일반적인 높이
            style={{
              display: 'block', // 이미지 하단 여백 제거
              width: '100%',    // 부모(.imageOuterContainer)의 너비를 100% 채웁니다.
              height: 'auto',     // 너비에 맞춰 높이는 자동으로 조절 (종횡비 유지)
              objectFit: 'contain', // 이미지가 잘리지 않고 비율을 유지하며 주어진 공간에 맞춤
                                    // 만약 'cover'를 사용하면 가로를 꽉 채우면서 세로가 넘치면 잘립니다.
                                    // 'contain'을 유지하면 가로를 꽉 채우되, 세로가 너무 길어 maxHeight를 초과하면 레터박싱이 생길 수 있습니다.
                                    // "가로로 꽉 찬다"는 의미가 "잘려도 된다"면 'cover'를, "전체가 보여야 한다"면 'contain'을 사용합니다.
                                    // 여기서는 "전체가 보여야 한다"는 전제로 'contain'을 유지합니다.
              maxHeight: '90vh',    // 뷰포트 높이의 최대 90%를 넘지 않도록 합니다.
              borderRadius: '4px',
            }}
            priority
          />
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
      </div>
    </div>
  );
}