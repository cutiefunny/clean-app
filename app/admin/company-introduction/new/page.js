// /app/admin/company-introduction/new/page.js
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/clientApp';
import styles from '../../board.module.css';

const COLLECTION_NAME = "companyIntroductions";

export default function NewIntroductionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    isVisible: true,
    name: '',
    startDate: '',
    endDate: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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
    if (!formData.name || !imageFile || !formData.startDate || !formData.endDate) {
      setError("소개명, 소개이미지, 소개 게시 기간은 필수 항목입니다.");
      return;
    }
    setIsSaving(true);
    setError('');

    try {
      const imageRef = ref(storage, `${COLLECTION_NAME}/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, COLLECTION_NAME), {
        ...formData,
        imageUrl,
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate)),
        createdAt: serverTimestamp(),
      });

      alert("새로운 소개 항목이 등록되었습니다.");
      router.push('/admin/company-introduction');

    } catch (err) {
      console.error("Error creating introduction: ", err);
      setError(`등록 중 오류 발생: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.formPageContainer}>
      <h1 className={styles.pageTitle}>신규 업체소개 등록</h1>
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