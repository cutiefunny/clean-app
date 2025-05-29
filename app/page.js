'use client';

import ImageSlider from '@/components/ImageSlider';
import CustomizableCard from '@/components/CustomizableCard';
import ReviewSlider from '@/components/ReviewSlider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css'; // CSS 모듈을 사용하여 스타일링

export default function Home() {
  const sliderImages = [
    { src: '/images/sample/1.jpg', alt: '샘플 이미지 1' },
    { src: '/images/sample/2.jpg', alt: '샘플 이미지 2' },
    { src: '/images/sample/3.jpg', alt: '샘플 이미지 3' },
    { src: '/images/sample/4.jpg', alt: '샘플 이미지 1' },
    { src: '/images/sample/5.jpg', alt: '샘플 이미지 2' },
    { src: '/images/sample/6.jpg', alt: '샘플 이미지 3' },
  ];

  const eventImages = [
    { src: '/images/sample/event1.jpg', alt: '이벤트 이미지 1' },
    { src: '/images/sample/event2.jpg', alt: '이벤트 이미지 2' },
    { src: '/images/sample/event3.jpg', alt: '이벤트 이미지 3' },
    { src: '/images/sample/event4.jpg', alt: '이벤트 이미지 4' },
    { src: '/images/sample/event5.jpg', alt: '이벤트 이미지 5' },
    { src: '/images/sample/event6.jpg', alt: '이벤트 이미지 6' },
  ];

  const cardData = [
    { title: "신축 입주 청소", description: "설명이 들어갑니다", imageUrl: "/images/Icons-3.png", imageAlt: "신축 입주 청소", backgroundColor: "#2D61E3" },
    { title: "이사 청소", description: "설명이 들어갑니다", imageUrl: "/images/Icons-4.png", imageAlt: "이사 청소", backgroundColor: "#2DA3E3" },
    { title: "준공 리모델링 청소", description: "설명이 들어갑니다", imageUrl: "/images/Icons-1.png", imageAlt: "준공 리모델링 청소", backgroundColor: "#65D69F" },
    { title: "상가&사무실 청소", description: "설명이 들어갑니다", imageUrl: "/images/Icons-2.png", imageAlt: "상가&사무실 청소", backgroundColor: "#8957E1" },
  ];

  const sampleReviews = [
    {
      id: 1,
      location: "홍길동",
      serviceType: "오피스텔 9평",
      rating: 4.9,
      text: "정말 더러웠어요. 제가 청소할 엄두가 도저히 나지 않아 맡겼는데 진작 맡길껄 그랬어요. 깨끗해요",
      images: [
        "/images/sample/review1.jpg",
        "/images/sample/review2.jpg",
      ]
    },
    {
      id: 2,
      location: "김철수",
      serviceType: "아파트 24평",
      rating: 5.0,
      text: "새 집처럼 만들어주셨어요! 특히 주방 기름때가 심했는데, 전문가의 손길은 다르네요. 감사합니다!",
      images: [
        "/images/sample/review3.jpg",
        "/images/sample/review4.jpg",
      ]
    }
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

      <div style={{ width: '100%'}}>
        <div className='container' style={{ width: '95%', margin: '0.3rem auto', paddingLeft: '0.5rem', paddingBottom: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.title}>이벤트</h2>
        </div>
        <ImageSlider images={eventImages} sliderHeight="150px" autoPlayDefault={true} />
      </div>

      <div style={{ width: '100%'}}>
        <div className='container' style={{ width: '95%', margin: '0.3rem auto', paddingLeft: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.title}>리뷰</h2>
        </div>
        <ReviewSlider reviews={sampleReviews} />
      </div>

      <footer style={{ width: '100%', marginTop: 'auto', padding: '0.5rem'}}>
        <Footer />
      </footer>
    </div>
  );
}
