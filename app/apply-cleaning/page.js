// app/apply-cleaning/page.js
// 이 파일 자체는 서버 컴포넌트가 될 수 있습니다 (상단에 'use client' 불필요).
import React, { Suspense } from 'react';
import styles from './ApplyCleaning.module.css'; // 로딩 fallback 스타일 등을 위해 필요
import ApplyCleaningForm from './ApplyCleaningForm'; // 방금 만든 클라이언트 컴포넌트

export default function ApplyCleaningPage() {
  return (
    <div className={styles.pageContainer}>
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
      <header className={styles.header}> {/* 헤더 레이아웃 유지 */}
        <button className={styles.backButton} disabled>‹</button>
        <h1 className={styles.pageTitle}>청소신청</h1>
        <span className={styles.stepIndicator}></span>
      </header>
      <main className={styles.contentArea}>
        <p className={styles.loadingText}>신청 양식을 불러오는 중입니다...</p>
      </main>
    </div>
  );
}