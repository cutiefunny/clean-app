// /app/admin/company-info/notices/[id]/edit/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/clientApp'; // Firebase 경로 확인! (7단계 상위)
import styles from '../../new/NewNoticePage.module.css'; // 새 공지사항 작성 페이지의 CSS Module 재활용 (또는 EditNoticePage.module.css 생성 후 경로 변경)

export default function EditNoticePage() {
  const router = useRouter();
  const params = useParams(); // URL 파라미터(id)를 가져오기 위함
  const noticeId = params.id; // [id] 값

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [originalNotice, setOriginalNotice] = useState(null); // 원본 데이터 저장용
  const [isLoading, setIsLoading] = useState(true); // 페이지 로딩 및 저장 로딩 상태
  const [error, setError] = useState('');

  // 공지사항 데이터 불러오기
  const fetchNotice = useCallback(async () => {
    if (!noticeId) {
      setError('잘못된 접근입니다. 공지사항 ID가 없습니다.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const noticeRef = doc(db, 'companyNotices', noticeId);
      const docSnap = await getDoc(noticeRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setOriginalNotice(data);
        setTitle(data.title || '');
        setContent(data.content || '');
      } else {
        setError('해당 공지사항을 찾을 수 없습니다.');
        setOriginalNotice(null); // 데이터 없음 명시
      }
    } catch (err) {
      console.error('Error fetching notice: ', err);
      setError('공지사항을 불러오는 중 오류가 발생했습니다.');
      setOriginalNotice(null);
    } finally {
      setIsLoading(false);
    }
  }, [noticeId]);

  useEffect(() => {
    fetchNotice();
  }, [fetchNotice]);

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

    // 변경 사항이 있는지 확인 (선택 사항)
    if (originalNotice && title.trim() === originalNotice.title && content.trim() === originalNotice.content) {
        setError('변경 사항이 없습니다.');
        // router.push('/admin/company-info/notices'); // 바로 목록으로 이동하거나 메시지만 표시
        return;
    }


    setIsLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
        setIsLoading(false);
        return;
      }

      // Firestore 문서 업데이트
      const noticeRef = doc(db, 'companyNotices', noticeId);
      await updateDoc(noticeRef, {
        title: title.trim(),
        content: content.trim(),
        updatedAt: serverTimestamp(),
        // 필요하다면 수정한 사람의 정보도 기록할 수 있습니다.
        // lastUpdatedBy: currentUser.uid,
      });

      console.log('Notice updated successfully');
      // 성공 후 목록 페이지로 리디렉션
      router.push('/admin/company-info/notices');

    } catch (err) {
      console.error('Error updating notice: ', err);
      setError('공지사항을 수정하는 중 오류가 발생했습니다. Firestore 보안 규칙을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/company-info/notices'); // 목록 페이지로 이동
  };

  if (isLoading && !originalNotice) { // 초기 데이터 로딩 중
    return <div className={styles.pageContainer}><p>공지사항 정보를 불러오는 중...</p></div>;
  }

  if (!originalNotice && !isLoading) { // 데이터가 없거나 로딩 후에도 없는 경우 (오류 메시지는 error 상태로 표시)
     return (
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>공지사항 수정</h1>
        <p className={styles.errorText}>{error || '공지사항 정보를 불러올 수 없습니다.'}</p>
        <button type="button" onClick={handleCancel} className={styles.secondaryButton}>
            목록으로 돌아가기
        </button>
      </div>
    );
  }


  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>공지사항 수정</h1>
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