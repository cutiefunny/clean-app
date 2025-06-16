// /app/page.js (Firestore 연동)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/clientApp'; // Firebase 설정 임포트
import { collection, getDocs, doc, getDoc, query, where, Timestamp, orderBy, limit } from 'firebase/firestore'; // doc, getDoc 추가

import ImageSlider from '@/components/ImageSlider';
import CustomizableCard from '@/components/CustomizableCard';
import ReviewSlider from '@/components/ReviewSlider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css';
import Accordion from '@/components/Accordion';

export default function Home() {
  const router = useRouter();

  // Firestore에서 가져올 데이터에 대한 상태 변수 선언
  const [sliderImages, setSliderImages] = useState([]);
  const [eventImages, setEventImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [faqData, setFaqData] = useState([]);
  // [추가] 청소 서비스 설명 데이터 상태
  const [cleaningDescriptions, setCleaningDescriptions] = useState({}); 
  const [loading, setLoading] = useState(true);

  // Firestore에서 모든 홈 페이지 데이터를 가져오는 useEffect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const now = Timestamp.now();

      try {
        // Promise.all을 사용하여 여러 데이터를 병렬로 가져옵니다.
        const [introsSnapshot, adsSnapshot, faqSnapshot, reviewsSnapshot, cleaningOptionsDoc] = await Promise.all([
          // 업체소개 (메인 슬라이더)
          getDocs(query(
            collection(db, "companyIntroductions"),
            where("isVisible", "==", true),
            where("startDate", "<=", now)
          )),
          // 광고 (이벤트 슬라이더)
          getDocs(query(
            collection(db, "advertisements"),
            where("isVisible", "==", true),
            where("startDate", "<=", now)
          )),
          // FAQ (고객 지원)
          getDocs(query(collection(db, "companyNotices"), orderBy("createdAt", "desc"))),
          // 리뷰 데이터: 최신순으로 5개만 가져오기
          getDocs(query(collection(db, "reviews"), where("blind", "!=", true), orderBy("createdAt", "desc"), limit(5))),
          // [추가] 청소 옵션 데이터 가져오기
          getDoc(doc(db, "settings", "cleaningOptions")) 
        ]);

        // 메인 슬라이더 데이터 처리
        const introImages = introsSnapshot.docs
          .filter(doc => doc.data().endDate >= now)
          .map(doc => ({
            src: doc.data().imageUrl,
            alt: doc.data().name || '소개 이미지',
          }));
        setSliderImages(introImages);

        // 이벤트 슬라이더 데이터 처리
        const adImages = adsSnapshot.docs
          .filter(doc => doc.data().endDate >= now)
          .map(doc => ({
            src: doc.data().imageUrl,
            alt: doc.data().name || '이벤트 이미지',
          }));
        setEventImages(adImages);
        
        // 리뷰 데이터 처리
        const fetchedReviews = reviewsSnapshot.docs.map(doc => {
          const data = doc.data();
          const validImages = (data.imageUrls || []).filter(url => typeof url === 'string' && url.startsWith('https'));
          
          return {
            id: doc.id,
            location: data.userName,
            serviceType: data.serviceType,
            rating: data.rating || 0,
            text: data.content,
            images: validImages 
          }
        });
        setReviews(fetchedReviews);

        // FAQ 데이터 처리
        const faqs = faqSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || '제목 없음',
          content: doc.data().content || '내용 없음'
        }));
        setFaqData(faqs);

        // [추가] 청소 옵션 설명 데이터 처리
        if (cleaningOptionsDoc.exists()) {
          setCleaningDescriptions(cleaningOptionsDoc.data().descriptions || {});
        } else {
          console.log("Cleaning options document does not exist.");
        }

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

  // [수정] 서비스 카드 데이터를 동적으로 생성
  const cardData = [
    { key: 'newConstruction', title: "신축 입주 청소", imageUrl: "/images/Icons-3.png", imageAlt: "신축 입주 청소", backgroundColor: "#2D61E3" },
    { key: 'moveIn', title: "이사 청소", imageUrl: "/images/Icons-4.png", imageAlt: "이사 청소", backgroundColor: "#2DA3E3" },
    { key: 'remodeling', title: "준공 리모델링 청소", imageUrl: "/images/Icons-1.png", imageAlt: "준공 리모델링 청소", backgroundColor: "#65D69F" },
    { key: 'commercial', title: "상가&사무실 청소", imageUrl: "/images/Icons-2.png", imageAlt: "상가&사무실 청소", backgroundColor: "#8957E1" },
  ].map(card => ({
      ...card,
      description: cleaningDescriptions[card.key] || '설명을 불러오는 중입니다...' // Firestore에서 가져온 설명으로 교체
  }));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', padding: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <Header />
      <div style={{ width: '100%', margin: '0.5rem 0' }}>
        {loading ? <p>로딩 중...</p> : <ImageSlider images={sliderImages} sliderHeight="150px" autoPlayDefault={true} />}
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
        {loading ? <p>로딩 중...</p> : <ImageSlider images={eventImages} sliderHeight="150px" autoPlayDefault={true} />}
      </div>

      <div style={{ width: '100%', marginTop: '2rem', paddingBottom: '1rem' }}>
        <div className='container' style={{ width: '95%', margin: '0.3rem auto', paddingLeft: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.title}>리뷰</h2>
          <span 
            onClick={() => router.push('/reviews')} 
            className={styles.viewAllLink}
          >
            전체보기 ›
          </span>
        </div>
        {loading ? <p>리뷰 로딩 중...</p> : <ReviewSlider reviews={reviews}/>}
      </div>

      <div style={{ width: '100%', paddingBottom: '1rem' }}>
        <div className='container' style={{ width: '95%', margin: '0.3rem auto', paddingLeft: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.title}>고객 지원</h2>
        </div>
        {loading ? <p>로딩 중...</p> : <Accordion items={faqData} sectionTitle="고객 지원" />}
      </div>

      <footer style={{ width: '100%', marginTop: 'auto', padding: '0.5rem'}}>
        <Footer />
      </footer>
    </div>
  );
}
