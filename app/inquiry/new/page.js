// app/inquiry/new/page.js
'use client';

import React from 'react';
import Header2 from '@/components/Header2';
import styles from './InquiryFormPage.module.css'; // CSS 모듈 생성 필요
import { useRouter } from 'next/navigation';

export default function InquiryFormPage() {
  const router = useRouter();

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: 폼 데이터 처리 및 제출 로직
    alert('문의가 접수되었습니다. (실제 제출 로직 필요)');
    // router.push('/support'); // 제출 후 이동할 페이지
  };

  return (
    <div className={styles.pageContainer}>
      <Header2 title="1:1 문의하기" onBack={() => router.back()} />
      <main className={styles.contentArea}>
        <h2 className={styles.sectionTitle}>문의 내용 작성</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="inquiryType" className={styles.label}>문의 유형</label>
            <select id="inquiryType" className={styles.selectField}>
              <option value="">유형 선택</option>
              <option value="service">서비스 이용</option>
              <option value="payment">결제/환불</option>
              <option value="account">계정 관련</option>
              <option value="etc">기타</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="inquiryTitle" className={styles.label}>제목</label>
            <input type="text" id="inquiryTitle" className={styles.inputField} placeholder="제목을 입력해주세요." />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="inquiryContent" className={styles.label}>문의 내용</label>
            <textarea id="inquiryContent" className={styles.textareaField} rows="8" placeholder="문의하실 내용을 자세히 적어주세요."></textarea>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="inquiryFile" className={styles.label}>첨부파일 (선택)</label>
            <input type="file" id="inquiryFile" className={styles.fileInput} />
          </div>
          <button type="submit" className={styles.submitButton}>문의 접수</button>
        </form>
      </main>
    </div>
  );
}