// /app/admin/staff/list/[id]/edit/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/clientApp';
import styles from '../../../../board.module.css';

const COLLECTION_NAME = "staffMembers";
const PERMISSION_CATEGORIES = [
    { key: 'cleaners', label: '청소업체 관리' },
    { key: 'reviews', label: '리뷰 관리' },
    { key: 'requests', label: '청소신청 관리' },
    { key: 'points', label: '포인트 관리' },
    { key: 'staff', label: '직원 관리' },
];

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffUid = params.id;

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); // 최종 관리자 여부

  // 현재 로그인한 사용자가 최종 관리자인지 확인
  useEffect(() => {
    const checkAdminStatus = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idTokenResult = await currentUser.getIdTokenResult();
        // 'superAdmin' 커스텀 클레임 확인
        setIsSuperAdmin(idTokenResult.claims.superAdmin === true);
      }
    };
    checkAdminStatus();
  }, []);

  const fetchStaffData = useCallback(async () => {
    if (!staffUid) return;
    setLoading(true);
    try {
      const docRef = doc(db, COLLECTION_NAME, staffUid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
            ...data,
            // Firestore Timestamp를 YYYY-MM-DD로 변환
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : '',
        });
      } else {
        setError("해당 직원 정보를 찾을 수 없습니다.");
      }
    } catch (err) {
      setError(`정보 조회 중 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [staffUid]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (category, type, isChecked) => {
    const currentPermission = formData.permissions?.[category] || 'none';
    let newPermission;

    if (type === 'edit') {
      newPermission = isChecked ? 'edit' : 'view'; // 수정 체크 해제 시 조회로 변경
    } else { // type === 'view'
      if (currentPermission === 'edit') {
        newPermission = isChecked ? 'edit' : 'none'; // 수정 권한이 있는 상태에서 조회 체크 해제 시 권한 없음
      } else {
        newPermission = isChecked ? 'view' : 'none'; // 조회 권한만 있는 상태에서 체크 해제 시 권한 없음
      }
    }
    
    setFormData(prev => ({
        ...prev,
        permissions: {
            ...prev.permissions,
            [category]: newPermission
        }
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      if (!isSuperAdmin) throw new Error("권한 설정 및 저장은 최종 관리자만 가능합니다.");
      
      const docRef = doc(db, COLLECTION_NAME, staffUid);
      const { staffId, staffName, phone, email, permissions } = formData;
      await updateDoc(docRef, { staffId, staffName, phone, email, permissions });
      
      alert("직원 정보가 성공적으로 수정되었습니다.");
      router.push('/admin/staff/list');
    } catch(err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 삭제 및 목록 이동 핸들러
  const handleDelete = () => { /* ... */ };
  const handleGoToList = () => router.push('/admin/staff/list');

  if (loading) return <div className={styles.pageContainer}><p>로딩 중...</p></div>;
  if (error) return <div className={styles.pageContainer}><p className={styles.errorText}>{error}</p></div>;
  if (!formData) return null;

  return (
    <div className={styles.detailPageContainer}>
        <div style={{display: 'flex', gap: '30px'}}>
            {/* 왼쪽: 직원 정보 */}
            <div style={{flex: 1}}>
                <h2 className={styles.pageTitle} style={{textAlign:'left', borderBottom: 'none'}}>직원 정보</h2>
                <div className={styles.form}>
                    <div className={styles.formGroup}><label className={styles.label}>직원명</label><input type="text" name="staffName" value={formData.staffName || ''} onChange={handleInputChange} className={styles.input} /></div>
                    <div className={styles.formGroup}><label className={styles.label}>이메일</label><input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className={styles.input} /></div>
                    <div className={styles.formGroup}><label className={styles.label}>휴대폰번호</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className={styles.input} /></div>
                    <div className={styles.formGroup}><label className={styles.label}>회원가입일시</label><input type="text" value={formData.createdAt || ''} className={styles.input} readOnly /></div>
                    <div className={styles.formGroup}><label className={styles.label}>ID(회원번호?)</label><input type="text" name="staffId" value={formData.staffId || ''} onChange={handleInputChange} className={styles.input} disabled={!isSuperAdmin} /></div>
                    <div className={styles.formGroup}><label className={styles.label}>PASSWORD</label><input type="password" placeholder="변경 시에만 입력" className={styles.input} disabled={!isSuperAdmin} /></div>
                </div>
            </div>

            {/* 오른쪽: 권한 설정 */}
            <div style={{flex: 1}}>
                <h2 className={styles.pageTitle} style={{textAlign:'left', borderBottom: 'none'}}>권한설정</h2>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.thLeft}></th>
                            <th className={styles.th}>조회권한</th>
                            <th className={styles.th}>수정권한</th>
                        </tr>
                    </thead>
                    <tbody>
                        {PERMISSION_CATEGORIES.map(cat => {
                            const currentPerm = formData.permissions?.[cat.key] || 'none';
                            return (
                                <tr key={cat.key}>
                                    <td className={styles.tdLeft} style={{fontWeight: 500}}>{cat.label}</td>
                                    <td className={styles.centerTd}>
                                        <input type="checkbox" disabled={!isSuperAdmin} checked={currentPerm === 'view' || currentPerm === 'edit'} onChange={(e) => handlePermissionChange(cat.key, 'view', e.target.checked)}/>
                                    </td>
                                    <td className={styles.centerTd}>
                                        <input type="checkbox" disabled={!isSuperAdmin} checked={currentPerm === 'edit'} onChange={(e) => handlePermissionChange(cat.key, 'edit', e.target.checked)}/>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {error && <p className={styles.errorText} style={{marginTop: '20px'}}>{error}</p>}

        <div className={styles.buttonContainer} style={{justifyContent: 'center'}}>
            <button onClick={handleSaveChanges} className={styles.primaryButton} disabled={!isSuperAdmin || isSaving}>{isSaving ? '저장 중...' : '저장'}</button>
            <button onClick={handleDelete} className={styles.deleteButton} disabled={!isSuperAdmin || isSaving}>삭제</button>
            <button onClick={handleGoToList} className={styles.secondaryButton}>목록</button>
        </div>
    </div>
  );
}