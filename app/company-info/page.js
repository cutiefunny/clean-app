// /app/company-info/page.js (Firestore 연동)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy // orderBy를 추가합니다.
} from 'firebase/firestore'; // Firestore 모듈을 추가합니다.
import { db } from '@/lib/firebase/clientApp'; // Firebase 설정을 임포트합니다.

import Header2 from '@/components/Header2';
import styles from './CompanyInfoPage.module.css';

const COLLECTION_NAME = "companyInfo";
// 이제 'mainDetails' 문서 하나만 가져오는 것이 아니므로 DOCUMENT_ID는 직접 사용하지 않습니다.
const EXCLUDED_DOCS = ['default', 'mainDetails']; // 가져오기에서 제외할 문서 ID 목록

export default function CompanyInfoPage() {
    const router = useRouter();
    const [companyInfoSections, setCompanyInfoSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCompanyInfo = async () => {
            setLoading(true); // 데이터 로딩 시작 시 로딩 상태를 true로 설정합니다.
            try {
                // companyInfo 컬렉션에서 'default'와 'mainDetails' 문서를 제외하고
                // 'order' 필드를 기준으로 오름차순 정렬하여 모든 동적 문서를 가져옵니다.
                const q = query(
                    collection(db, COLLECTION_NAME),
                    where('__name__', 'not-in', EXCLUDED_DOCS), // 문서 ID로 필터링합니다.
                    orderBy('order', 'asc') // 'order' 필드를 기준으로 오름차순 정렬합니다.
                );
                const querySnapshot = await getDocs(q);

                const loadedSections = [];
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    loadedSections.push({
                        id: docSnap.id,
                        title: data.title || '제목 없음', // Firestore 문서의 title 필드 사용
                        content: data.content || '내용이 없습니다.', // Firestore 문서의 content 필드 사용
                        order: data.order !== undefined ? data.order : 9999, // 정렬을 위해 order 필드를 가져옵니다. 없으면 기본값 9999
                    });
                });

                setCompanyInfoSections(loadedSections);
            } catch (err) {
                console.error("Error fetching company info: ", err);
                setError("정보를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false); // 데이터 로딩 완료 후 로딩 상태를 false로 설정합니다.
            }
        };

        fetchCompanyInfo();
    }, []); // 페이지가 처음 렌더링될 때 한 번만 실행되도록 빈 의존성 배열을 유지합니다.

    return (
        <div className={styles.pageContainer}>
            <Header2 title="회사정보" onBack={() => router.back()} />
            <main className={styles.contentArea}>
                {loading ? (
                    <p>회사 정보를 불러오는 중...</p>
                ) : error ? (
                    <p className={styles.errorText}>{error}</p>
                ) : (
                    // 가져온 동적 섹션들을 순서에 따라 렌더링합니다.
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