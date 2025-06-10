// /app/admin/company-introduction/[id]/edit/page.js
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/clientApp';
import styles from '../../../board.module.css';

const COLLECTION_NAME = "companyIntroductions";

export default function EditIntroductionPage() {
  const router = useRouter();
  const params = useParams();
  const introId = params.id;

  const [formData, setFormData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const formatDateForInput = (date) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toISOString().split('T')[0];
  };

  const fetchIntro = useCallback(async () => {
    if (!introId) return;
    setLoading(true);
    try {
      const docRef = doc(db, COLLECTION_NAME, introId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
            ...data,
            startDate: formatDateForInput(data.startDate),
            endDate: formatDateForInput(data.endDate),
        });
        setImagePreview(data.imageUrl);
      } else {
        setError("해당 소개 항목을 찾을 수 없습니다.");
      }
    } catch (err) {
      setError(`데이터 조회 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [introId]);

  useEffect(() => {
    fetchIntro();
  }, [fetchIntro]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const imageRef = ref(storage, `${COLLECTION_NAME}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const docRef = doc(db, COLLECTION_NAME, introId);
    await updateDoc(docRef, {
      ...formData,
      imageUrl,
      startDate: Timestamp.fromDate(new Date(formData.startDate)),
      endDate: Timestamp.fromDate(new Date(`${formData.endDate}T23:59:59`)),
    });

      alert("정보가 성공적으로 수정되었습니다.");
      router.push('/admin/company-introduction');

    } catch (err) {
      console.error("Error updating introduction: ", err);
      setError(`수정 중 오류 발생: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className={styles.formPageContainer}><p>로딩 중...</p></div>;
  if (error) return <div className={styles.formPageContainer}><p className={styles.errorText}>{error}</p></div>;
  if (!formData) return null;

  return (
    <div className={styles.formPageContainer}>
      <h1 className={styles.pageTitle}>업체소개 수정</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup_checkbox}>
          <label className={styles.label_checkbox}>노출여부</label>
          <input type="checkbox" name="isVisible" checked={formData.isVisible} onChange={handleChange} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>소개명</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={styles.input}/>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="image" className={styles.label}>소개이미지</label>
          <input type="file" id="image" onChange={handleImageChange} accept="image/*" />
          {imagePreview && <img src={imagePreview} alt="미리보기" style={{maxWidth: '300px', marginTop: '10px'}}/>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>소개 게시 기간</label>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={styles.input}/>
            <span>~</span>
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={styles.input}/>
          </div>
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.primaryButton} disabled={isSaving}>{isSaving ? '저장 중...' : '저장'}</button>
          <button type="button" onClick={() => router.push('/admin/company-introduction')} className={styles.secondaryButton} disabled={isSaving}>목록</button>
        </div>
      </form>
    </div>
  );
}