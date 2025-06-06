// /app/admin/staff/list/new/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFunctions, httpsCallable } from "firebase/functions"; // Cloud Functions 호출을 위한 import
import { getApp } from 'firebase/app'; // Firebase 앱 인스턴스를 가져오기 위해
import styles from '../../../board.module.css'; // 공통 CSS Module

const PERMISSION_CATEGORIES = [
    { key: 'cleaners', label: '청소업체 관리' },
    { key: 'reviews', label: '리뷰 관리' },
    { key: 'requests', label: '청소신청 관리' },
    { key: 'points', label: '포인트 관리' },
    { key: 'staff', label: '직원 관리' },
];

const initialPermissions = PERMISSION_CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = 'none'; // 기본 권한 '없음'으로 설정
    return acc;
}, {});

export default function NewStaffPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    staffName: '',
    email: '',
    phone: '',
    staffId: '',
    password: '',
    permissions: initialPermissions
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (category, type, isChecked) => {
    const currentPermission = formData.permissions[category];
    let newPermission;
    if (type === 'edit') {
      newPermission = isChecked ? 'edit' : 'view';
    } else {
      if (currentPermission === 'edit') {
        newPermission = isChecked ? 'edit' : 'none';
      } else {
        newPermission = isChecked ? 'view' : 'none';
      }
    }
    setFormData(prev => ({ ...prev, permissions: { ...prev.permissions, [category]: newPermission }}));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    if (!formData.email || !formData.password || !formData.staffId || !formData.staffName) {
      setError("이메일, 비밀번호, 아이디, 직원명은 필수 항목입니다.");
      setIsSaving(false);
      return;
    }
    
    try {
      const functions = getFunctions(getApp());
      const createStaffUser = httpsCallable(functions, 'createStaffUser'); // 배포한 Cloud Function 이름
      const result = await createStaffUser(formData);

      if (result.data.success) {
        setSuccessMessage(result.data.message);
        setTimeout(() => router.push('/admin/staff/list'), 2000);
      }
    } catch (err) {
      console.error("Error calling createStaffUser function: ", err);
      setError(err.message || "직원 생성에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.detailPageContainer}>
      <div style={{display: 'flex', gap: '30px'}}>
        <div style={{flex: 1}}>
          <h2 className={styles.pageTitle} style={{textAlign:'left', borderBottom: 'none'}}>신규 직원 정보</h2>
          <form onSubmit={handleCreate} className={styles.form}>
            <div className={styles.formGroup}><label className={styles.label}>직원명</label><input type="text" name="staffName" value={formData.staffName} onChange={handleInputChange} className={styles.input} /></div>
            <div className={styles.formGroup}><label className={styles.label}>이메일</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} className={styles.input} /></div>
            <div className={styles.formGroup}><label className={styles.label}>휴대폰번호</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className={styles.input} /></div>
            <div className={styles.formGroup}><label className={styles.label}>ID (로그인용)</label><input type="text" name="staffId" value={formData.staffId} onChange={handleInputChange} className={styles.input} /></div>
            <div className={styles.formGroup}><label className={styles.label}>초기 PASSWORD</label><input type="password" name="password" value={formData.password} onChange={handleInputChange} className={styles.input} /></div>
          </form>
        </div>

        <div style={{flex: 1}}>
          <h2 className={styles.pageTitle} style={{textAlign:'left', borderBottom: 'none'}}>권한설정</h2>
          <table className={styles.table}>
            <thead><tr><th className={styles.thLeft}></th><th className={styles.th}>조회권한</th><th className={styles.th}>수정권한</th></tr></thead>
            <tbody>
              {PERMISSION_CATEGORIES.map(cat => {
                const currentPerm = formData.permissions[cat.key];
                return (
                  <tr key={cat.key}>
                    <td className={styles.tdLeft} style={{fontWeight: 500}}>{cat.label}</td>
                    <td className={styles.centerTd}><input type="checkbox" checked={currentPerm === 'view' || currentPerm === 'edit'} onChange={(e) => handlePermissionChange(cat.key, 'view', e.target.checked)}/></td>
                    <td className={styles.centerTd}><input type="checkbox" checked={currentPerm === 'edit'} onChange={(e) => handlePermissionChange(cat.key, 'edit', e.target.checked)}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className={styles.errorText} style={{marginTop: '20px'}}>{error}</p>}
      {successMessage && <p className={styles.successText} style={{marginTop: '20px'}}>{successMessage}</p>}

      <div className={styles.buttonContainer} style={{justifyContent: 'center'}}>
        <button onClick={handleCreate} className={styles.primaryButton} disabled={isSaving}>{isSaving ? '생성 중...' : '신규 직원 생성'}</button>
        <button type="button" onClick={() => router.push('/admin/staff/list')} className={styles.secondaryButton}>목록</button>
      </div>
    </div>
  );
}