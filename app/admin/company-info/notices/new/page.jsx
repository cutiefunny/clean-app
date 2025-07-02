// /app/admin/company-info/notices/new/page.jsx
"use client";

import { useState, useRef } from 'react'; // useRef 추가
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Storage 관련 import 추가
import { db, auth, storage } from '@/lib/firebase/clientApp'; // Firebase 경로 확인 및 storage import
import styles from './NewNoticePage.module.css';

export default function NewNoticePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // [추가] 이미지 업로드 관련 상태
  const [descriptionImageFile, setDescriptionImageFile] = useState(null); // 설명 필드 내 삽입될 이미지 파일
  const [descriptionImagePreview, setDescriptionImagePreview] = useState(''); // 설명 필드 내 이미지 미리보기
  const [isUploadingDescriptionImage, setIsUploadingDescriptionImage] = useState(false); // 설명 이미지 업로드 중 상태
  const [successMessage, setSuccessMessage] = useState(''); // 이미지 업로드 성공 메시지

  const descriptionImageInputRef = useRef(null); // 이미지 파일 input 참조

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
