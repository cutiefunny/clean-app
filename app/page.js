// /app/page.js (Firestore 연동)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/clientApp'; // Firebase 설정 임포트
import { collection, getDocs, query, where, Timestamp, orderBy, limit } from 'firebase/firestore'; // limit 추가

import ImageSlider from '@/components/ImageSlider';
import CustomizableCard from '@/components/CustomizableCard';
import ReviewSlider from '@/components/ReviewSlider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css';
import Accordion from '@/components/Accordion';

export default function Home() {
  const router = useRouter();

  // 1. Firestore에서 가져올 데이터에 대한 상태 변수 선언
  const [sliderImages, setSliderImages] = useState([]);
  const [eventImages, setEventImages] = useState([]);
  const [reviews, setReviews] = useState([]); // 리뷰 데이터 상태 추가
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Firestore에서 모든 홈 페이지 데이터를 가져오는 useEffect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const now = Timestamp.now();

      try {
        // Promise.all을 사용하여 여러 데이터를 병렬로 가져옵니다.
        const [introsSnapshot, adsSnapshot, faqSnapshot, reviewsSnapshot] = await Promise.all([
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
          getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(5)))
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
            // [수정] blob: URL을 필터링하여 유효한 URL만 전달합니다.
            const validImages = (data.imageUrls || []).filter(url => typeof url === 'string' && url.startsWith('https'));
            
            return {
                id: doc.id,
                location: data.userName,
                serviceType: data.serviceType,
                rating: data.rating || 0,
                text: data.content,
                images: validImages // 유효한 이미지 URL 배열만 전달
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

  //#region 정적 데이터 (서비스 카드)
  const cardData = [
    { title: "신축 입주 청소", description: "설명이 들어갑니다", imageUrl: "/images/Icons-3.png", imageAlt: "신축 입주 청소", backgroundColor: "#2D61E3" },
    { title: "이사 청소", description: "설명이 들어갑니다", imageUrl: "/images/Icons-4.png", imageAlt: "이사 청소", backgroundColor: "#2DA3E3" },
    { title: "준공 리모델링 청소", description: "설명이 들어갑니다", imageUrl: "/images/Icons-1.png", imageAlt: "준공 리모델링 청소", backgroundColor: "#65D69F" },
    { title: "상가&사무실 청소", description: "설명이 들어갑니다", imageUrl: "/images/Icons-2.png", imageAlt: "상가&사무실 청소", backgroundColor: "#8957E1" },
  ];
  //#endregion

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

      {/* [수정] 리뷰 섹션 */}
      <div style={{ width: '100%', marginTop: '2rem', paddingBottom: '1rem' }}>
        <div className='container' style={{ width: '95%', margin: '0.3rem auto', paddingLeft: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.title}>리뷰</h2>
          {/* [추가] 전체보기 버튼 */}
          <span 
            onClick={() => router.push('/reviews')} 
            className={styles.viewAllLink}
          >
            전체보기 ›
          </span>
        </div>
        {/* ReviewSlider에 동적 데이터 전달 */}
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
