'use client';

import ImageSlider from '@/components/ImageSlider';
import CustomizableCard from '@/components/CustomizableCard';
import ReviewSlider from '@/components/ReviewSlider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './page.module.css'; // CSS 모듈을 사용하여 스타일링
import Accordion from '@/components/Accordion';
import FireStarter from '@/components/fireStarter';
import { db, auth } from '../lib/firebase/clientApp';
import {
  collection, getDocs, addDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot,
  serverTimestamp // serverTimestamp 임포트 추가
} from 'firebase/firestore';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export default function Home() {

  //#region 추후 백엔드에서 가져 올 부분
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

  const faqData = [
    {
      id: 'q1',
      title: '홈페이지 이용 관련 자주 묻는 질문입니다.',
      content: 'Q1. 회원가입은 어떻게 하나요?\nA1. 홈페이지 우측 상단의 "회원가입" 버튼을 클릭하여 진행할 수 있습니다.\n\nQ2. 비밀번호를 잊어버렸어요.\nA2. 로그인 페이지 하단의 "비밀번호 찾기" 기능을 이용해주세요.'
    },
    {
      id: 'q2',
      title: '서비스 신청 및 변경 안내입니다.',
      content: '서비스 신청은 "서비스 안내" 페이지에서 원하시는 플랜을 선택 후 진행할 수 있습니다.\n서비스 변경 및 해지는 마이페이지 > "나의 서비스" 메뉴에서 가능합니다.\n문의사항은 1:1 문의 게시판을 이용해주세요.'
    },
    {
      id: 'q3',
      title: '결제 및 환불 규정에 대한 내용입니다.',
      content: '결제는 신용카드, 계좌이체, 휴대폰 소액결제를 지원합니다.\n환불 규정은 서비스 이용 약관 제 X조 Y항을 참고해주시기 바랍니다.\n일반적으로 서비스 개시 전에는 100% 환불 가능하며, 개시 후에는 사용일수에 따라 차감 후 환불됩니다.'
    },
    {
      id: 'q4',
      title: '기타 문의사항입니다.',
      content: '기타 문의사항은 고객센터(1588-XXXX)로 연락 주시거나, 홈페이지의 1:1 문의를 통해 남겨주시면 신속하게 답변드리겠습니다.\n운영시간: 평일 09:00 ~ 18:00 (점심시간 12:00 ~ 13:00, 주말/공휴일 휴무)'
    }
  ];
  //#endregion

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

      <div style={{ width: '100%'}} onClick={() => window.location.href = '/events'}>
        <div className='container' style={{ width: '95%', margin: '0.3rem auto', paddingLeft: '0.5rem', paddingBottom: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.title}>이벤트</h2>
        </div>
        <ImageSlider images={eventImages} sliderHeight="150px" autoPlayDefault={true} />
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

      {/* Uncomment the following line to include the FireStarter component */}
      {/* <div style={{ width: '100%', paddingBottom: '1rem' }}>
        <FireStarter />
      </div> */}

      <footer style={{ width: '100%', marginTop: 'auto', padding: '0.5rem'}}>
        <Footer />
      </footer>
    </div>
  );
}
