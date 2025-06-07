// /app/page.js (Firestore 연동)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/clientApp'; // Firebase 설정 임포트
import { collection, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore'; // 필요한 Firestore 모듈 임포트

import ImageSlider from '@/components/ImageSlider';
import CustomizableCard from '@/components/CustomizableCard';
import ReviewSlider from '@/components/ReviewSlider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css';
import Accordion from '@/components/Accordion';

export default function Home() {
  const router = useRouter();

  // 1. 이미지 데이터를 위한 상태 변수 선언
  const [sliderImages, setSliderImages] = useState([]);
  const [eventImages, setEventImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Firestore에서 데이터를 가져오는 useEffect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const now = Timestamp.now();

      try {
        // Fetch company introductions for the main slider (업체소개 -> 메인 슬라이더)
        const introsQuery = query(
            collection(db, "companyIntroductions"),
            where("isVisible", "==", true),
            where("startDate", "<=", now)
            // endDate 필터는 Firestore에서 다른 필드에 대한 범위 필터와 함께 사용 시 색인이 필요할 수 있어, 클라이언트에서 필터링
        );
        const introsSnapshot = await getDocs(introsQuery);
        const introImages = introsSnapshot.docs
            .filter(doc => doc.data().endDate >= now) // 클라이언트 측에서 endDate 필터링
            .map(doc => ({
                src: doc.data().imageUrl,
                alt: doc.data().name || '소개 이미지',
            }));
        setSliderImages(introImages);

        // Fetch advertisements for the event slider (광고 -> 이벤트 슬라이더)
        const adsQuery = query(
            collection(db, "advertisements"),
            where("isVisible", "==", true),
            where("startDate", "<=", now)
        );
        const adsSnapshot = await getDocs(adsQuery);
        const adImages = adsSnapshot.docs
            .filter(doc => doc.data().endDate >= now)
            .map(doc => ({
                src: doc.data().imageUrl,
                alt: doc.data().name || '이벤트 이미지',
            }));
        setEventImages(adImages);

      } catch (error) {
        console.error("Error fetching homepage data from Firestore: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // 페이지 로드 시 한 번만 실행

  const handleCardClick = (serviceTitle) => {
    router.push(`/apply-cleaning?serviceType=${encodeURIComponent(serviceTitle)}`);
  };

  //#region 추후 백엔드에서 가져 올 부분 (cardData, sampleReviews, faqData는 정적으로 유지)
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
      images: [ "/images/sample/review1.jpg", "/images/sample/review2.jpg" ]
    },
    {
      id: 2,
      location: "김철수",
      serviceType: "아파트 24평",
      rating: 5.0,
      text: "새 집처럼 만들어주셨어요! 특히 주방 기름때가 심했는데, 전문가의 손길은 다르네요. 감사합니다!",
      images: [ "/images/sample/review3.jpg", "/images/sample/review4.jpg" ]
    }
  ];

  const faqData = [
    {
      id: 'q1',
      title: '홈페이지 이용 관련 자주 묻는 질문입니다.',
      content: 'Q1. 회원가입은 어떻게 하나요?\nA1. 홈페이지 우측 상단의 "회원가입" 버튼을 클릭하여 진행할 수 있습니다.\n\nQ2. 비밀번호를 잊어버렸어요.\nA2. 로그인 페이지 하단의 "비밀번호 찾기" 기능을 이용해주세요.'
    },
    // ... 다른 faq 데이터
  ];
  //#endregion

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', padding: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <Header />
      <div style={{ width: '100%', margin: '0.5rem 0' }}>
        {/* 3. 로딩 상태에 따라 로딩 메시지 또는 슬라이더 표시 */}
        {loading ? <p>슬라이더 로딩 중...</p> : <ImageSlider images={sliderImages} sliderHeight="150px" autoPlayDefault={true} />}
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
            onClick={() => handleCardClick(card.title)}
          />
        ))}
      </div>

      <div style={{ width: '100%'}} onClick={() => window.location.href = '/events'}>
        <div className='container' style={{ width: '95%', margin: '0.3rem auto', paddingLeft: '0.5rem', paddingBottom: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.title}>이벤트</h2>
        </div>
        {/* 4. 이벤트 슬라이더에도 로딩 상태 적용 */}
        {loading ? <p>이벤트 로딩 중...</p> : <ImageSlider images={eventImages} sliderHeight="150px" autoPlayDefault={true} />}
      </div>

      <div style={{ width: '100%', marginTop: '2rem', paddingBottom: '1rem' }} onClick={() => window.location.href = '/reviews'}>
        <div className='container' style={{ width: '95%', margin: '0.3rem auto', paddingLeft: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.title}>리뷰</h2>
        </div>
        <ReviewSlider reviews={sampleReviews}/>
      </div>

      <div style={{ width: '100%', paddingBottom: '1rem' }}>
        <div className='container' style={{ width: '95%', margin: '0.3rem auto', paddingLeft: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.title}>고객 지원</h2>
        </div>
        <Accordion items={faqData} sectionTitle="고객 지원" />
      </div>

      <footer style={{ width: '100%', marginTop: 'auto', padding: '0.5rem'}}>
        <Footer />
      </footer>
    </div>
  );
}
