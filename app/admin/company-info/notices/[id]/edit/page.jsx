// /app/admin/company-info/notices/[id]/edit/page.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react'; // useRef 추가
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Storage 관련 import 추가
import { db, auth, storage } from '@/lib/firebase/clientApp'; // Firebase 경로 확인 및 storage import
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

  // [추가] 이미지 업로드 관련 상태
  const [descriptionImageFile, setDescriptionImageFile] = useState(null); // 설명 필드 내 삽입될 이미지 파일
  const [descriptionImagePreview, setDescriptionImagePreview] = useState(''); // 설명 필드 내 이미지 미리보기
  const [isUploadingDescriptionImage, setIsUploadingDescriptionImage] = useState(false); // 설명 이미지 업로드 중 상태
  const [successMessage, setSuccessMessage] = useState(''); // 이미지 업로드 성공 메시지

  const descriptionImageInputRef = useRef(null); // 이미지 파일 input 참조

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

  // [추가] 설명 필드 내 이미지 업로드 및 URL 삽입 핸들러
  const handleDescriptionImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setDescriptionImageFile(file);
    setDescriptionImagePreview(URL.createObjectURL(file));
    setIsUploadingDescriptionImage(true);
    setError('');
    setSuccessMessage(''); // 이전 메시지 초기화

    try {
      // 이미지를 Firebase Storage에 업로드
      const imageRef = ref(storage, `notices/description_images/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(snapshot.ref);

      // 업로드된 이미지 URL을 content 텍스트의 끝에 마크다운 형식으로 삽입
      // 실제 구현에서는 커서 위치에 삽입하는 로직이 더 좋을 수 있지만,
      // textarea의 한계와 복잡성을 고려하여 간단히 끝에 추가합니다.
      setContent(prev => `${prev}\n\n![Image](${imageUrl})\n\n`); // 마크다운 형식으로 삽입
      setSuccessMessage("이미지가 성공적으로 업로드되어 내용에 삽입되었습니다.");

    } catch (err) {
      console.error("Error uploading description image: ", err);
      setError(`이미지 업로드 중 오류 발생: ${err.message}`);
    } finally {
      setIsUploadingDescriptionImage(false);
      // 업로드 완료 후 input을 초기화하여 같은 파일을 다시 선택할 수 있게 함
      e.target.value = '';
      setDescriptionImageFile(null);
      setDescriptionImagePreview('');
    }
  };

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
            disabled={isLoading || isUploadingDescriptionImage} // 이미지 업로드 중에도 비활성화
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content" className={styles.label}>내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.textarea}
            disabled={isLoading || isUploadingDescriptionImage} // 이미지 업로드 중 또는 저장 중 비활성화
            rows="10" // textarea 높이 조절
          />
          {/* [추가] 설명 필드 내 이미지 추가 버튼 및 미리보기 */}
          <div style={{ marginTop: '10px' }}>
            <label htmlFor="descriptionImage" className={styles.label} style={{display: 'block', marginBottom: '5px'}}>
              설명에 이미지 삽입:
            </label>
            <input
              type="file"
              id="descriptionImage"
              ref={descriptionImageInputRef} // ref 연결
              onChange={handleDescriptionImageUpload}
              accept="image/*"
              disabled={isUploadingDescriptionImage || isLoading} // 이미지 업로드 중 또는 저장 중 비활성화
              style={{ display: 'none' }} // 숨김 처리
            />
            <button
              type="button"
              onClick={() => descriptionImageInputRef.current?.click()} // 버튼 클릭 시 input 트리거
              className={styles.secondaryButton} // 적절한 스타일 적용
              disabled={isUploadingDescriptionImage || isLoading}
              style={{ padding: '8px 15px', cursor: 'pointer' }}
            >
              이미지 선택
            </button>
            {descriptionImagePreview &&
              <img
                src={descriptionImagePreview}
                alt="삽입할 이미지 미리보기"
                style={{maxWidth: '150px', marginTop: '10px', display: 'block', border: '1px dashed #ccc', padding: '5px'}}
              />
            }
            {isUploadingDescriptionImage &&
              <p style={{color: '#007bff', marginTop: '5px'}}>이미지 업로드 중... 잠시만 기다려 주세요.</p>
            }
            {successMessage &&
              <p style={{color: '#28a745', marginTop: '5px'}}>{successMessage}</p>
            }
          </div>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.buttonContainer}>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.secondaryButton}
            disabled={isLoading || isUploadingDescriptionImage}
          >
            취소
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={isLoading || isUploadingDescriptionImage}
          >
            {isLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
