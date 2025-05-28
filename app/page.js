'use client';

import ImageSlider from '@/components/ImageSlider';
import CustomizableCard from '@/components/CustomizableCard';

export default function Home() {
  const sliderImages = [
    { src: '/images/sample/1.jpg', alt: '샘플 이미지 1' },
    { src: '/images/sample/2.jpg', alt: '샘플 이미지 2' },
    { src: '/images/sample/3.jpg', alt: '샘플 이미지 3' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', margin: '0.5rem 0' }}>
        <ImageSlider images={sliderImages} sliderHeight="150px" autoPlayDefault={true} />
      </div>

      <div className="container" style={{ width: '95%', height: '300px', margin: '0.5rem auto', border: '1px solid black', padding: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
        <CustomizableCard
          title="신축 입주 청소"
          description="설명이 들어갑니다"
          imageUrl="/images/Icons-3.png"
          imageAlt="Card image"
          backgroundColor="#2D61E3"
        />
        <CustomizableCard
          title="이사 청소"
          description="설명이 들어갑니다"
          imageUrl="/images/Icons-4.png"
          imageAlt="Card image"
          backgroundColor="#2DA3E3"
        />
        <CustomizableCard
          title="준공 리모델링 청소"
          description="설명이 들어갑니다"
          imageUrl="/images/Icons-1.png"
          imageAlt="Card image"
          backgroundColor="#65D69F"
        />
        <CustomizableCard
          title="상가&사무실 청소"
          description="설명이 들어갑니다"
          imageUrl="/images/Icons-2.png"
          imageAlt="Card image"
          backgroundColor="#8957E1"
        />
      </div>
    </div>
  );
}
