// /app/faq/page.js (Firestore 연동)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; // Firestore 모듈 추가
import { db } from '@/lib/firebase/clientApp'; // Firebase 설정 임포트

import Header2 from '@/components/Header2';
import styles from './FaqPage.module.css'; // CSS 모듈 경로 확인
import Accordion from '@/components/Accordion';

const COLLECTION_NAME = "companyNotices";

export default function FaqPage() {
  const router = useRouter();
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        // 'companyNotices' 컬렉션에서 'createdAt' 필드를 기준으로 내림차순 정렬하여 데이터를 가져옵니다.
        // FAQ 항목을 구분하는 별도의 필드(예: type: 'faq')가 있다면 where 조건을 추가할 수 있습니다.
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const faqs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || '제목 없음',
          content: doc.data().content || '내용 없음',
        }));

        setFaqData(faqs);

      } catch (err) {
        console.error("Error fetching FAQs from Firestore: ", err);
        setError("자주 묻는 질문을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []); // 페이지가 처음 렌더링될 때 한 번만 실행

  return (
    <div className={styles.pageContainer}>
      <Header2 title="자주 묻는 질문" onBack={() => router.back()} />
      <main className={styles.contentArea}>
        {loading ? (
          <p>데이터를 불러오는 중...</p>
        ) : error ? (
          <p className={styles.errorText}>{error}</p>
        ) : (
          <Accordion items={faqData} />
        )}
      </main>
    </div>
  );
}
