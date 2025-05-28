'use client';

import ImageSlider from '@/components/ImageSlider';
import CustomizableCard from '@/components/CustomizableCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  const sliderImages = [
    { src: '/images/sample/1.jpg', alt: '샘플 이미지 1' },
    { src: '/images/sample/2.jpg', alt: '샘플 이미지 2' },
    { src: '/images/sample/3.jpg', alt: '샘플 이미지 3' },
  ];

  const cardData = [
    { title: "신축 입주 청소", description: "설명이 들어갑니다", imageUrl: "/images/Icons-3.png", imageAlt: "신축 입주 청소", backgroundColor: "#2D61E3" },
    { title: "이사 청소", description: "설명이 들어갑니다", imageUrl: "/images/Icons-4.png", imageAlt: "이사 청소", backgroundColor: "#2DA3E3" },
    { title: "준공 리모델링 청소", description: "설명이 들어갑니다", imageUrl: "/images/Icons-1.png", imageAlt: "준공 리모델링 청소", backgroundColor: "#65D69F" },
    { title: "상가&사무실 청소", description: "설명이 들어갑니다", imageUrl: "/images/Icons-2.png", imageAlt: "상가&사무실 청소", backgroundColor: "#8957E1" },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', padding: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Header />
      <div style={{ width: '100%', margin: '0.5rem 0' }}>
        <ImageSlider images={sliderImages} sliderHeight="150px" autoPlayDefault={true} />
      </div>

      <div className="container" style={{ width: '95%', height: '320px', margin: '0.5rem auto', border: '1px solid black', padding: '0.5rem', paddingTop: '0.8rem', paddingBottom: '0.8rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
        {cardData.map((card, index) => (
          <CustomizableCard
            key={index}
            title={card.title}
            description={card.description}
            imageUrl={card.imageUrl}
            imageAlt={card.imageAlt}
            backgroundColor={card.backgroundColor}
          />
        ))}
      </div>
      <footer style={{ width: '100%', marginTop: 'auto', padding: '0.5rem'}}>
        <Footer />
      </footer>
    </div>
  );
}
