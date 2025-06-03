// /app/admin/company-info/notices/new/page.jsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/clientApp'; // Firebase 경로 확인 (6단계 상위)
import styles from './NewNoticePage.module.css';

export default function NewNoticePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const currentUser = auth.currentUser;
      console.log('Current User:', currentUser);
      if (!currentUser) {
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
        setIsLoading(false);
        // router.push('/admin'); // 필요시 로그인 페이지로 리디렉션
        return;
      }

      const noticesCollectionRef = collection(db, 'companyNotices'); // Firestore 컬렉션명
      await addDoc(noticesCollectionRef, {
        title: title.trim(),
        content: content.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(), // 생성 시에는 createdAt과 동일
        authorId: currentUser.uid,
        authorEmail: currentUser.email || 'N/A', // 이메일이 없을 경우 대비
      });

      console.log('New notice added successfully');
      // 성공 후 목록 페이지로 리디렉션
      router.push('/admin/company-info/notices');

    } catch (err) {
      console.error('Error adding new notice: ', err);
      setError('공지사항을 추가하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/company-info/notices'); // 목록 페이지로 이동
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>새 공지사항 작성</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>제목</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content" className={styles.label}>내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.textarea}
            disabled={isLoading}
          />
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.buttonContainer}>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.secondaryButton}
            disabled={isLoading}
          >
            취소
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isLoading}
          >
            {isLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}