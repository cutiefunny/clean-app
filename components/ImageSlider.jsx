// components/ImageSlider.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

// 아이콘 정의
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0Zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658Z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0ZM9.25 6.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5Zm2.5 0a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5Z" clipRule="evenodd" />
  </svg>
);


const ImageSlider = ({ images = [], sliderHeight = "256px", autoPlayDefault = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlayDefault); // 자동 재생 상태

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

  // 자동 재생 로직
  useEffect(() => {
    let intervalId = null;
    if (isPlaying && images.length > 1) {
      intervalId = setInterval(() => {
        goToNext();
      }, 3000); // 3초 간격
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, images.length, goToNext]);


  return (
    <div style={{width: '90%', margin: 'auto', position: 'relative'}} className="group">
      <div style={{overflow: 'hidden', height: sliderHeight, borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', position: 'relative'}}>
        <div
          style={{whiteSpace: 'nowrap', height: '100%', transition: 'transform 0.5s ease-in-out', transform: `translateX(-${currentIndex * 100}%)`}}
        >
          {images.map((image, index) => (
            <div style={{display: 'inline-block', width: '100%', height: '100%', position: 'relative'}} key={image.src || index}>
              <Image
                src={image.src}
                alt={image.alt || `Slide ${index + 1}`}
                layout="fill"
                objectFit="cover"
                priority={index === 0}
                style={{borderRadius: '0.5rem'}}
              />
            </div>
          ))}
        </div>

        {/* 이전 버튼 */}
        {images.length > 1 && (
          <button
            onClick={goToPrevious}
            style={{position: 'absolute', top: '50%', left: '0.25rem', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', padding: '0.5rem', borderRadius: '9999px', transition: 'all 0.3s', opacity: 0, zIndex: 10,
            marginLeft: '0.75rem'}}
            className="focus:outline-none group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon />
          </button>
        )}

        {/* 다음 버튼 */}
        {images.length > 1 && (
          <button
            onClick={goToNext}
            style={{position: 'absolute', top: '50%', right: '0.25rem', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', padding: '0.5rem', borderRadius: '9999px', transition: 'all 0.3s', opacity: 0, zIndex: 10,
            marginRight: '0.75rem'}}
            className="focus:outline-none group-hover:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRightIcon />
          </button>
        )}

        {/* 하단 컨트롤 (페이지 번호, 재생/일시정지) */}
        <div style={{position: 'absolute', bottom: '0.75rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10}}>
          <span style={{color: 'white', fontSize: '0.75rem', backgroundColor: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem'}}>
            {currentIndex + 1} / {images.length}
          </span>
          {images.length > 1 && (
            <button
              onClick={togglePlayPause}
              style={{backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.375rem', borderRadius: '9999px', transition: 'background-color 0.3s'}}
              className="focus:outline-none"
              aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
          )}
        </div>

        {/* 하단 중앙 인디케이터 (점) - 옵션 */}
        {images.length > 1 && (
          <div style={{position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem', zIndex: 10}}>
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                style={{width: '0.5rem', height: '0.5rem', borderRadius: '9999px', transition: 'background-color 0.3s',
                backgroundColor: currentIndex === index ? 'white' : 'rgba(255,255,255,0.5)'}}
                className={ currentIndex === index ? 'ring-1 ring-offset-1 ring-offset-black/50 ring-white' : 'hover:bg-white/75'}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSlider;