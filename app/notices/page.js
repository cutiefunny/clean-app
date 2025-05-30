// app/notices/page.js
'use client';

import React from 'react';
import Header2 from '@/components/Header2';
import styles from './NoticesPage.module.css'; // CSS 모듈 생성 필요
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 예시 공지사항 데이터
const mockNotices = [
  { id: 'notice1', title: '서비스 점검 안내 (2025-06-15)', date: '2025-06-10', summary: '보다 안정적인 서비스 제공을 위해 시스템 점검을 실시합니다.' },
  { id: 'notice2', title: '개인정보처리방침 개정 안내', date: '2025-06-01', summary: '개인정보처리방침이 일부 개정되어 안내드립니다.' },
  { id: 'notice3', title: '신규 기능 업데이트 소식!', date: '2025-05-20', summary: '사용자 편의를 위한 새로운 기능들이 추가되었습니다.' },
];


export default function NoticesPage() {
  const router = useRouter();

  return (
    <div className={styles.pageContainer}>
      <Header2 title="공지사항" onBack={() => router.back()} />
      <main className={styles.contentArea}>
        <h2 className={styles.sectionTitle}>새로운 소식</h2>
        <ul className={styles.noticeList}>
          {mockNotices.map(notice => (
            <li key={notice.id} className={styles.noticeItem}>
              {/* 각 공지사항을 클릭하면 상세 페이지로 이동한다고 가정 */}
              <Link href={`/notices/${notice.id}`} className={styles.noticeLink}>
                <h3 className={styles.noticeTitle}>{notice.title}</h3>
                <p className={styles.noticeDate}>{notice.date}</p>
                <p className={styles.noticeSummary}>{notice.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}