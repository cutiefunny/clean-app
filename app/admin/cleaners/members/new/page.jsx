// /app/admin/cleaners/members/new/page.jsx
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase/clientApp';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import styles from '../[id]/edit/edit.module.css';

const COLLECTION_NAME = "cleaners";

// --- 재사용 UI 컴포넌트들 ---
const fieldOptions = ["입주청소", "이사청소", "사무실청소", "특수청소"];

const ImageUpload = ({ label, onFileChange }) => {
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      onFileChange(file);
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <div className={styles.fileInputWrapper}>
        <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.fileSelectButton}>
          파일선택
        </button>
        <span className={styles.fileName}>{preview ? '파일 선택됨' : '선택된 파일 없음'}</span>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
      </div>
      {preview && (
        <div className={styles.imagePreview}>
          <Image src={preview} alt={`${label} 미리보기`} width={100} height={100} style={{ objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
};


// --- 메인 페이지 컴포넌트 ---
export default function NewCleanerMemberPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    businessName: '',
    representativeName: '',
    contactPhone: '',
    registrationDate: new Date().toISOString().split('T')[0],
    operationalStatus: '운영중',
    email: '',
    address: '',
    field: fieldOptions[0], // [수정] field를 formData에 포함하고 기본값 설정
  });
  
  // [제거] 분야 복수선택 상태 제거
  // const [selectedFields, setSelectedFields] = useState([]);
  
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [businessRegistrationFile, setBusinessRegistrationFile] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // [제거] 분야 체크박스 핸들러 제거

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.businessName.trim() || !formData.representativeName.trim() || !formData.contactPhone.trim()) {
      setError('상호명, 대표자명, 연락처는 필수 입력 항목입니다.');
      return;
    }

    setIsSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("로그인이 필요합니다.");
      }

      let businessLicenseUrl = '';
      if (businessLicenseFile) {
        const storageRef = ref(storage, `cleaners/temp_${Date.now()}/business_license`);
        const snapshot = await uploadBytes(storageRef, businessLicenseFile);
        businessLicenseUrl = await getDownloadURL(snapshot.ref);
      }

      let businessRegistrationUrl = '';
      if (businessRegistrationFile) {
        const storageRef = ref(storage, `cleaners/temp_${Date.now()}/business_registration`);
        const snapshot = await uploadBytes(storageRef, businessRegistrationFile);
        businessRegistrationUrl = await getDownloadURL(snapshot.ref);
      }
      
      // [수정] Firestore에 저장할 데이터 객체에서 fields를 formData.field로 변경
      const dataToSave = {
        ...formData,
        // fields: selectedFields, // 배열 대신 단일 값 사용
        currentPoints: 0,
        contactPhone: formData.contactPhone.replace(/-/g, ''),
        registrationDate: Timestamp.fromDate(new Date(formData.registrationDate)),
        businessLicenseUrl: businessLicenseUrl,
        businessRegistrationUrl: businessRegistrationUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.uid,
        registrationStatus: '신청대기'
      };

      await addDoc(collection(db, COLLECTION_NAME), dataToSave);

      alert('새로운 업체 정보가 성공적으로 등록되었습니다.');
      router.push('/admin/cleaners/members');

    } catch (err) {
      console.error("Error adding new cleaner member: ", err);
      setError(`등록 중 오류 발생: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>신규 업체 등록</h1>
      </div>
      <form onSubmit={handleSubmit} className={styles.formGrid}>
        
        {/* [수정] 분야 선택을 드롭다운(select)으로 변경 */}
        <div className={styles.formRow}>
          <label className={styles.label}>분야</label>
          <div className={styles.value}>
            <select
              name="field"
              value={formData.field}
              onChange={handleChange}
              className={styles.input} // select 스타일을 input과 공유하거나 별도 클래스 지정
              disabled={isSaving}
            >
              {fieldOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <label className={styles.label}>상호명(매장명)</label>
          <div className={styles.value}>
            <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className={styles.input} required />
          </div>
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>대표자명</label>
          <div className={styles.value}>
            <input type="text" name="representativeName" value={formData.representativeName} onChange={handleChange} className={styles.input} required />
          </div>
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>담당자 연락처</label>
          <div className={styles.value}>
            <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange} className={styles.input} required />
          </div>
        </div>
        
        <div className={styles.formRow}>
            <label className={styles.label}>등록일</label>
            <div className={styles.value}>
                <input type="date" name="registrationDate" value={formData.registrationDate} onChange={handleChange} className={styles.input} />
            </div>
        </div>

        <div className={styles.formRow}>
          <label className={styles.label}>이메일</label>
          <div className={styles.value}>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className={styles.input} />
          </div>
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>주소</label>
          <div className={styles.value}>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className={styles.input} />
          </div>
        </div>
        <div className={styles.formRow}>
            <label className={styles.label}>영업신고증</label>
            <div className={styles.value}>
                <ImageUpload label="영업신고증" onFileChange={setBusinessLicenseFile} />
            </div>
        </div>
        <div className={styles.formRow}>
            <label className={styles.label}>사업자등록증</label>
            <div className={styles.value}>
                <ImageUpload label="사업자등록증" onFileChange={setBusinessRegistrationFile} />
            </div>
        </div>
        
        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.buttonContainer}>
          <button type="submit" className={styles.primaryButton} disabled={isSaving}>
            {isSaving ? '등록 중...' : '등록'}
          </button>
          <button type="button" onClick={() => router.back()} className={styles.secondaryButton} disabled={isSaving}>
            목록
          </button>
        </div>
      </form>
    </div>
  );
}
