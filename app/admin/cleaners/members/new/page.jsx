// /app/admin/cleaners/members/new/page.jsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/clientApp'; // Firebase 경로
import styles from '../../../board.module.css'; // 공통 CSS Module

const COLLECTION_NAME = "cleaners";

// 예시 옵션들 (실제로는 DB에서 가져오거나 상수로 관리)
const fieldOptions = ["입주청소", "이사청소", "사무실청소", "특수청소"];
const registrationStatusOptions = ["신청대기", "신청완료", "신청거부"];
const operationalStatusOptions = ["운영중", "휴업", "정지", "계약해지"];


export default function NewCleanerMemberPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    field: fieldOptions[0],
    businessName: '',
    representativeName: '',
    contactPhone: '',
    registrationDate: new Date().toISOString().split('T')[0], // 오늘 날짜 기본값
    registrationStatus: registrationStatusOptions[0],
    operationalStatus: operationalStatusOptions[0],
    // 기타 필요한 필드 초기화
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.businessName.trim() || !formData.representativeName.trim() || !formData.contactPhone.trim()) {
      setError('상호명, 대표자명, 연락처는 필수 입력 항목입니다.');
      return;
    }

    setIsSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('로그인이 필요합니다.');
        setIsSaving(false);
        return;
      }

      await addDoc(collection(db, COLLECTION_NAME), {
        ...formData,
        contactPhone: formData.contactPhone.replace(/-/g, ''),
        // Timestamp.fromDate()를 사용하려면 Timestamp가 import 되어야 합니다.
        registrationApplicationDate: Timestamp.fromDate(new Date(formData.registrationApplicationDate)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid,
        });

      setSuccessMessage('새로운 업체 정보가 성공적으로 등록되었습니다.');
      // 폼 초기화 또는 목록으로 리디렉션
      // setFormData({ ...초기값... }); 
      setTimeout(() => {
        router.push('/admin/cleaners/members');
      }, 1500);


    } catch (err) {
      console.error("Error adding new cleaner member: ", err);
      setError(`등록 중 오류 발생: ${err.message}. Firestore 보안 규칙을 확인하세요.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.formPageContainer}>
      <h1 className={styles.pageTitle}>신규 청소업체 등록</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        
        <div className={styles.formGroup}>
          <label htmlFor="field" className={styles.label}>분야</label>
          <select id="field" name="field" value={formData.field} onChange={handleChange} className={styles.select} disabled={isSaving}>
            {fieldOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="businessName" className={styles.label}>상호명 <span style={{color: 'red'}}>*</span></label>
          <input type="text" id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} className={styles.input} disabled={isSaving} />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="representativeName" className={styles.label}>대표자명 <span style={{color: 'red'}}>*</span></label>
          <input type="text" id="representativeName" name="representativeName" value={formData.representativeName} onChange={handleChange} className={styles.input} disabled={isSaving} />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contactPhone" className={styles.label}>담당자 연락처 <span style={{color: 'red'}}>*</span></label>
          <input type="tel" id="contactPhone" name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="010-1234-5678" className={styles.input} disabled={isSaving} />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="registrationApplicationDate" className={styles.label}>가입신청일</label>
          <input type="date" id="registrationApplicationDate" name="registrationApplicationDate" value={formData.registrationApplicationDate} onChange={handleChange} className={styles.input} disabled={isSaving} />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="registrationStatus" className={styles.label}>가입신청 상태</label>
          <select id="registrationStatus" name="registrationStatus" value={formData.registrationStatus} onChange={handleChange} className={styles.select} disabled={isSaving}>
            {registrationStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="operationalStatus" className={styles.label}>운영 상태</label>
          <select id="operationalStatus" name="operationalStatus" value={formData.operationalStatus} onChange={handleChange} className={styles.select} disabled={isSaving}>
            {operationalStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* 기타 필요한 필드 추가 */}

        {error && <p className={styles.errorText}>{error}</p>}
        {successMessage && <p className={styles.successText}>{successMessage}</p>}

        <div className={styles.buttonContainer}>
          <button type="button" onClick={() => router.push('/admin/cleaners/members')} className={styles.secondaryButton} disabled={isSaving}>
            목록
          </button>
          <button type="submit" className={styles.primaryButton} disabled={isSaving}>
            {isSaving ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}