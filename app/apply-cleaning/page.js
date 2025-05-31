// app/apply-cleaning/page.js
// 이 파일 자체는 서버 컴포넌트가 될 수 있습니다 (상단에 'use client' 불필요).
import React, { Suspense } from 'react';
import styles from './ApplyCleaning.module.css'; // 로딩 fallback 스타일 등을 위해 필요
import ApplyCleaningForm from './ApplyCleaningForm'; // 방금 만든 클라이언트 컴포넌트
import Header2 from '@/components/Header2'; // 헤더 컴포넌트

export default function ApplyCleaningPage() {
  return (
    <div >
      <Suspense fallback={<LoadingFallback />}>
        <ApplyCleaningForm />
      </Suspense>
    </div>
  );
}

// 간단한 로딩 fallback UI
function LoadingFallback() {
  return (
    <div className={styles.loadingContainer}>
      <Header2 title="청소신청" style={{ display: 'flex', justifyContent: 'center' }} />
      <main className={styles.contentArea}>
        <p className={styles.loadingText}>신청 양식을 불러오는 중입니다...</p>
      </main>
    </div>
  );
}