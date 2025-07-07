// components/ImageSlider.jsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react'; // useRef 추가
import Image from 'next/image';

// 아이콘 정의 (동일하게 유지)

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{width: '20px', height: '20px'}}>
    <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0Zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658Z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{width: '20px', height: '20px'}}>
    <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0ZM9.25 6.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5Z" clipRule="evenodd" />
  </svg>
);


const ImageSlider = ({ images = [], sliderHeight = "256px", autoPlayDefault = true, isMobile = false }) => { // isMobile prop 추가
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlayDefault);

  // 드래그 상태 관리를 위한 state 추가
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const sliderRef = useRef(null); // 슬라이더 요소 참조

  const DRAG_THRESHOLD = 50; // 최소 드래그 거리 (px)

  if (!images || images.length === 0) {
    return <div style={{width: '90%', margin: 'auto', textAlign: 'center', padding: '40px 0'}}>이미지가 없습니다.</div>;
  }

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  }, [images.length]);

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    let intervalId = null;
    if (isPlaying && images.length > 1 && !isDragging) { // 드래그 중에는 자동 재생 중지
      intervalId = setInterval(goToNext, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, images.length, goToNext, isDragging]); // isDragging 의존성 추가

  // 포인터 이벤트 핸들러
  const handlePointerDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX - currentTranslateX); // 현재 이동된 위치에서 시작 X좌표 계산
    // e.target.setPointerCapture(e.pointerId); // 포인터 캡처 (필요에 따라)
    if (sliderRef.current) {
      sliderRef.current.style.cursor = 'grabbing';
      sliderRef.current.style.userSelect = 'none'; // 드래그 중 텍스트 선택 방지
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const newTranslateX = currentX - startX;
    setCurrentTranslateX(newTranslateX);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    // e.target.releasePointerCapture(e.pointerId); // 포인터 캡처 해제

    if (sliderRef.current) {
      sliderRef.current.style.cursor = 'grab';
      sliderRef.current.style.userSelect = 'auto';
    }

    const dragDistance = currentTranslateX; // 최종 드래그된 거리

    if (Math.abs(dragDistance) > DRAG_THRESHOLD) {
      if (dragDistance < -DRAG_THRESHOLD) { // 왼쪽으로 스와이프 (다음 이미지)
        goToNext();
      } else if (dragDistance > DRAG_THRESHOLD) { // 오른쪽으로 스와이프 (이전 이미지)
        goToPrevious();
      }
    }
    // 스냅백을 위해 currentTranslateX를 0으로 리셋 (transition이 적용됨)
    setCurrentTranslateX(0);
  };

  const handlePointerLeave = (e) => {
    if (isDragging) {
      // 포인터가 영역을 벗어나면 드래그 종료 처리 (handlePointerUp과 유사하게)
      handlePointerUp(e);
    }
  };

  // 이미지 스트립의 동적 스타일
  const imageStripStyle = {
    whiteSpace: 'nowrap',
    height: '100%',
    transition: isDragging ? 'none' : 'transform 0.5s ease-in-out', // 드래그 중에는 transition 없음
    transform: `translateX(calc(-${currentIndex * 100}% + ${currentTranslateX}px))`,
  };

  // PC 모드일 때 가로세로 비율 유지를 위한 스타일
  const sliderContainerStyle = {
    overflow: 'hidden',
    borderRadius: '15px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    position: 'relative',
    cursor: 'grab', // 기본 커서 grab
    touchAction: 'pan-y', // 수직 스크롤은 허용, 수평은 제어
    ...(isMobile ? { height: sliderHeight } : { aspectRatio: '360 / 150' }), // 모바일 뷰포트 비율 (가로:360px, 세로:150px)
  };

  return (
    <div style={{width: '90%', margin: 'auto', position: 'relative'}}> {/* group className은 Tailwind용이므로 제거하거나 유지 */}
      <div
        ref={sliderRef} // ref 할당
        style={sliderContainerStyle} // 동적 스타일 적용
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave} // 포인터가 영역을 벗어날 때 처리
      >
        <div style={imageStripStyle}>
          {images.map((image, index) => (
            <div 
              style={{display: 'inline-block', width: '100%', height: '100%', position: 'relative'}} 
              key={image.src || index}
              // 이미지 자체의 드래그 방지 (선택 사항)
              onDragStart={(e) => e.preventDefault()} 
            >
              <Image
                src={image.src}
                alt={image.alt || `Slide ${index + 1}`}
                fill
                style={{ objectFit: 'cover', borderRadius: '0.5rem' }}
                priority={index === 0}
                size ="100vw" // 이미지 크기를 뷰포트에 맞춤
                // 이미지 드래그 방지 (선택 사항)
                draggable="false" 
              />
            </div>
          ))}
        </div>

        {/* 하단 컨트롤 (페이지 번호, 재생/일시정지) - zIndex를 버튼보다 낮게 설정 가능 */}
        <div style={{position: 'absolute', bottom: '0.75rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10}}>
          <span style={{color: 'white', fontSize: '0.75rem', backgroundColor: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem'}}>
            <strong>{currentIndex + 1}</strong> / {images.length}
          </span>
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} // 이벤트 버블링 방지
              style={{backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '9999px', transition: 'background-color 0.3s'}}
              aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageSlider;