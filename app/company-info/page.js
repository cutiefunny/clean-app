// /app/company-info/page.js (Firestore 연동)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore'; // Firestore 모듈 추가
import { db } from '@/lib/firebase/clientApp'; // Firebase 설정 임포트

import Header2 from '@/components/Header2';
import styles from './CompanyInfoPage.module.css';

const COLLECTION_NAME = "companyInfo";
const DOCUMENT_ID = "mainDetails";

export default function CompanyInfoPage() {
  const router = useRouter();
  const [companyInfoSections, setCompanyInfoSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Firestore 필드를 페이지에 표시할 형식으로 매핑
          const sections = [
            {
              id: 1,
              title: '회사연혁',
              content: data.history || '내용이 없습니다.'
            },
            {
              id: 2,
              title: '지향',
              content: data.goal || '내용이 없습니다.'
            },
            {
              id: 3,
              title: '언론소개',
              content: data.media || '내용이 없습니다.'
            },
            {
              id: 4,
              title: '서비스',
              content: data.service || '내용이 없습니다.'
            },
          ];
          setCompanyInfoSections(sections);
        } else {
          setError("회사 정보를 찾을 수 없습니다.");
          console.log(`Document '${DOCUMENT_ID}' does not exist in collection '${COLLECTION_NAME}'.`);
        }
      } catch (err) {
        console.error("Error fetching company info: ", err);
        setError("정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, []); // 페이지가 처음 렌더링될 때 한 번만 실행

  return (
    <div className={styles.pageContainer}>
      <Header2 title="회사정보" onBack={() => router.back()} />
      <main className={styles.contentArea}>
        {loading ? (
          <p>회사 정보를 불러오는 중...</p>
        ) : error ? (
          <p className={styles.errorText}>{error}</p>
        ) : (
          companyInfoSections.map((section) => (
            <div key={section.id} className={styles.infoCard}>
              <h2 className={styles.cardTitle}>{section.title}</h2>
              <p className={styles.cardContent}>{section.content}</p>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
