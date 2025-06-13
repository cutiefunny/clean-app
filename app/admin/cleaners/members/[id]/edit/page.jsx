// /app/admin/cleaners/members/[id]/edit/page.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase/clientApp';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import styles from './edit.module.css';

// --- 재사용 UI 컴포넌트들 ---
const ToggleSwitch = ({ label, enabled, onChange }) => {
  return (
    <div className={styles.toggleContainer}>
      <span className={enabled ? styles.toggleLabelOn : styles.toggleLabelOff}>
        {enabled ? 'ON' : 'OFF'}
      </span>
      <label className={styles.switch}>
        <input type="checkbox" checked={enabled} onChange={onChange} />
        <span className={styles.slider}></span>
      </label>
    </div>
  );
};

const ImageUpload = ({ label, currentImageUrl, onFileChange }) => {
  const [preview, setPreview] = useState(currentImageUrl || '');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(currentImageUrl);
  }, [currentImageUrl]);

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
        <span className={styles.fileName}>{preview ? (typeof preview === 'string' && preview.startsWith('http') ? '기존 파일' : '새 파일 선택됨') : '선택된 파일 없음'}</span>
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
// [추가] 가입신청 상태 옵션
const registrationStatusOptions = ["신청대기", "신청완료", "신청거부"];

export default function EditCleanerMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id;

  const [formData, setFormData] = useState({
    operationalStatus: false,
    email: '',
    businessName: '',
    field: '',
    address: '',
    membershipDate: '',
    representativeName: '',
    contactPhone: '',
    businessLicenseUrl: '',
    businessRegistrationUrl: '',
    registrationStatus: registrationStatusOptions[0], // [추가] 상태 초기화
  });
  const [initialData, setInitialData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [businessRegistrationFile, setBusinessRegistrationFile] = useState(null);

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  // 데이터 로딩 로직
  const fetchMemberData = useCallback(async () => {
    if (!memberId) {
      setError("잘못된 접근입니다.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const docRef = doc(db, "cleaners", memberId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const initialFormState = {
          operationalStatus: data.operationalStatus === '운영중',
          email: data.email || '',
          businessName: data.businessName || '',
          field: data.field || '',
          address: data.address || '',
          membershipDate: formatDateForInput(data.membershipDate),
          representativeName: data.representativeName || '',
          contactPhone: data.contactPhone || '',
          businessLicenseUrl: data.businessLicenseUrl || '',
          businessRegistrationUrl: data.businessRegistrationUrl || '',
          registrationStatus: data.registrationStatus || registrationStatusOptions[0], // [추가] 데이터 로드
        };
        setFormData(initialFormState);
        setInitialData(initialFormState);
      } else {
        setError("해당 업체 정보를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("정보 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData]);

  // 입력 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 저장 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("로그인이 필요합니다.");
      }
      
      let businessLicenseUrl = formData.businessLicenseUrl;
      if (businessLicenseFile) {
        const storageRef = ref(storage, `cleaners/${memberId}/business_license_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, businessLicenseFile);
        businessLicenseUrl = await getDownloadURL(snapshot.ref);
      }

      let businessRegistrationUrl = formData.businessRegistrationUrl;
      if (businessRegistrationFile) {
        const storageRef = ref(storage, `cleaners/${memberId}/business_registration_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, businessRegistrationFile);
        businessRegistrationUrl = await getDownloadURL(snapshot.ref);
      }

      const docRef = doc(db, "cleaners", memberId);
      await updateDoc(docRef, {
        operationalStatus: formData.operationalStatus ? '운영중' : '휴업',
        registrationStatus: formData.registrationStatus, // [추가] 저장할 데이터에 포함
        email: formData.email,
        address: formData.address,
        representativeName: formData.representativeName,
        contactPhone: formData.contactPhone,
        businessLicenseUrl: businessLicenseUrl,
        businessRegistrationUrl: businessRegistrationUrl,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid,
      });

      alert("업체 정보가 성공적으로 수정되었습니다.");
      router.push('/admin/cleaners/members');

    } catch (err) {
      console.error("Error updating document:", err);
      setError(`수정 중 오류 발생: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className={styles.pageContainer}><p>로딩 중...</p></div>;
  if (error) return <div className={styles.pageContainer}><p className={styles.errorText}>{error}</p></div>;
  
  return (
    <div className={styles.pageContainer}>
        <div className={styles.header}>
            <h1 className={styles.pageTitle}>기본정보</h1>
        </div>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
            <div className={styles.formRow}>
                <label className={styles.label}>운영</label>
                <div className={styles.value}>
                    <ToggleSwitch 
                        enabled={formData.operationalStatus} 
                        onChange={(e) => handleChange({ target: { name: 'operationalStatus', value: e.target.checked, type: 'checkbox' }})} 
                    />
                </div>
            </div>

            {/* ======================= [추가된 부분 시작] ======================= */}
            <div className={styles.formRow}>
                <label className={styles.label}>가입신청 상태</label>
                <div className={styles.value}>
                    <select
                        name="registrationStatus"
                        value={formData.registrationStatus}
                        onChange={handleChange}
                        className={styles.input}
                        disabled={isSaving}
                    >
                        {registrationStatusOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            </div>
            {/* ======================= [추가된 부분 끝] ========================= */}

            <div className={styles.formRow}>
                <label className={styles.label}>이메일</label>
                <div className={styles.value}>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={styles.input} />
                </div>
            </div>
            <div className={styles.formRow}>
                <label className={styles.label}>상호명(매장명)</label>
                <div className={styles.value}>{formData.businessName}</div>
            </div>
            <div className={styles.formRow}>
                <label className={styles.label}>분야</label>
                <div className={styles.value}>{formData.field}</div>
            </div>
            <div className={styles.formRow}>
                <label className={styles.label}>주소</label>
                <div className={styles.value}>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className={styles.input} />
                </div>
            </div>
            <div className={styles.formRow}>
                <label className={styles.label}>회원가입일</label>
                <div className={styles.value}>{formData.membershipDate}</div>
            </div>
            <div className={styles.formRow}>
                <label className={styles.label}>대표자명</label>
                <div className={styles.value}>
                    <input type="text" name="representativeName" value={formData.representativeName} onChange={handleChange} className={styles.input} />
                </div>
            </div>
            <div className={styles.formRow}>
                <label className={styles.label}>담당자 연락처</label>
                <div className={styles.value}>
                    <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange} className={styles.input} />
                </div>
            </div>
            <div className={styles.formRow}>
                <label className={styles.label}>영업신고증</label>
                <div className={styles.value}>
                    <ImageUpload label="영업신고증" currentImageUrl={formData.businessLicenseUrl} onFileChange={setBusinessLicenseFile} />
                </div>
            </div>
            <div className={styles.formRow}>
                <label className={styles.label}>사업자등록증</label>
                <div className={styles.value}>
                    <ImageUpload label="사업자등록증" currentImageUrl={formData.businessRegistrationUrl} onFileChange={setBusinessRegistrationFile} />
                </div>
            </div>
            
            <div className={styles.buttonContainer}>
                <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                    {isSaving ? '저장 중...' : '저장'}
                </button>
                 <button type="button" onClick={() => router.back()} className={styles.secondaryButton} disabled={isSaving}>
                    목록
                </button>
            </div>
        </form>
    </div>
  );
}
