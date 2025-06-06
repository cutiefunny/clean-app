// /app/admin/cleaners/members/[id]/edit/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/clientApp'; // Firebase 경로
import styles from '../../../../board.module.css'; // 공통 CSS Module

const COLLECTION_NAME = "cleaners";

// 예시 옵션들 (신규 페이지와 동일하게 사용)
const fieldOptions = ["입주청소", "이사청소", "사무실청소", "특수청소"];
const registrationStatusOptions = ["신청대기", "신청완료", "신청거부"];
const operationalStatusOptions = ["운영중", "휴업", "정지", "계약해지"];

export default function EditCleanerMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id;

  const [formData, setFormData] = useState({
    field: fieldOptions[0],
    businessName: '',
    representativeName: '',
    contactPhone: '',
    registrationApplicationDate: '',
    registrationStatus: registrationStatusOptions[0],
    operationalStatus: operationalStatusOptions[0],
  });
  const [initialData, setInitialData] = useState({});
  const [isLoading, setIsLoading] = useState(true); // 데이터 로딩 상태
  const [isSaving, setIsSaving] = useState(false); // 저장 중 상태
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const formatDateForInput = (date) => {
    if (!date) return '';
    // Firestore Timestamp 객체인 경우 toDate() 호출
    const d = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };


  const fetchMemberData = useCallback(async () => {
    if (!memberId) {
      setError("잘못된 접근입니다. 업체 ID가 없습니다.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const docRef = doc(db, COLLECTION_NAME, memberId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          field: data.field || fieldOptions[0],
          businessName: data.businessName || '',
          representativeName: data.representativeName || '',
          contactPhone: data.contactPhone || '',
          registrationApplicationDate: data.registrationApplicationDate ? formatDateForInput(data.registrationApplicationDate) : '',
          registrationStatus: data.registrationStatus || registrationStatusOptions[0],
          operationalStatus: data.operationalStatus || operationalStatusOptions[0],
          // 기타 필드
        });
        setInitialData(data); // 원본 데이터 저장
      } else {
        setError("해당 업체 정보를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("Error fetching cleaner member: ", err);
      setError(`정보 조회 중 오류 발생: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData]);

  // 성공 메시지 자동 숨김 처리
  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => {
        setSuccessMessage('');
      }, 2000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [successMessage]);


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
    setIsSaving(true);

    if (!formData.businessName.trim() || !formData.representativeName.trim() || !formData.contactPhone.trim()) {
      setError('상호명, 대표자명, 연락처는 필수 입력 항목입니다.');
      return;
    }

    // 변경사항 확인
    const hasChanges = Object.keys(formData).some(key => {
        if (key === 'registrationApplicationDate') { // 날짜 필드는 포맷팅된 값과 원본 Timestamp를 직접 비교하기 어려우므로, 필요시 다른 방식 고려
            return formatDateForInput(initialData[key]) !== formData[key];
        }
        return formData[key] !== initialData[key];
    });

    if (!hasChanges) {
        setSuccessMessage("변경된 내용이 없습니다.");
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

      const docRef = doc(db, COLLECTION_NAME, memberId);
      await updateDoc(docRef, {
        ...formData,
        contactPhone: formData.contactPhone.replace(/-/g, ''),
        registrationApplicationDate: Timestamp.fromDate(new Date(formData.registrationApplicationDate)),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      });

      setSuccessMessage('업체 정보가 성공적으로 수정되었습니다.');
      setInitialData(formData); // 수정 후 현재 데이터를 원본으로
      setTimeout(() => { // 성공 메시지 확인 후 목록으로 이동
        // router.push('/admin/cleaners/members');
      }, 1500);


    } catch (err) {
      console.error("Error updating cleaner member: ", err);
      setError(`수정 중 오류 발생: ${err.message}. Firestore 보안 규칙을 확인하세요.`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className={styles.formPageContainer}><p>업체 정보를 불러오는 중...</p></div>;
  }
  if (error && !initialData.businessName) { // 데이터 로드 실패 시
     return (
      <div className={styles.formPageContainer}>
        <h1 className={styles.pageTitle}>업체 정보 수정</h1>
        <p className={styles.errorText}>{error}</p>
        <button type="button" onClick={() => router.push('/admin/cleaners/members')} className={styles.secondaryButton}>
            목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className={styles.formPageContainer}>
      <h1 className={styles.pageTitle}>청소업체 정보 수정</h1>
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
          <input type="tel" id="contactPhone" name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="01012345678" className={styles.input} disabled={isSaving} />
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
          <button type="button" onClick={() => router.push('/admin/cleaners/members')} className={styles.secondaryButton} disabled={isSaving || isLoading}>
            목록
          </button>
          <button type="submit" className={styles.primaryButton} disabled={isSaving || isLoading}>
            {isSaving ? '수정 중...' : '수정'}
          </button>
        </div>
      </form>
    </div>
  );
}