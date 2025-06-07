// /app/admin/staff/list/[id]/edit/page.jsx (변경내역 기록 기능 추가)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
// addDoc, collection, serverTimestamp 추가
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import styles from '../../../../board.module.css';
import { useAuth } from '../../../../../context/AuthContext';
import { isEqual } from 'lodash'; // 객체 비교를 위해 lodash 임포트

// npm install lodash
// 위 명령어로 lodash 라이브러리를 설치해주세요.

const COLLECTION_NAME = "staffMembers";
const HISTORY_COLLECTION_NAME = "staffAuditHistory";
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

  const { user, permissions, isSuperAdmin, loadingAuth } = useAuth();

  const [formData, setFormData] = useState(null);
  const [initialData, setInitialData] = useState(null); // 변경 감지를 위한 원본 데이터 저장
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const canEdit = !loadingAuth && (isSuperAdmin || permissions?.staff === 'edit');

  useEffect(() => {
    if (!loadingAuth && !canEdit) {
      alert("이 페이지에 접근할 권한이 없습니다.");
      router.replace('/admin/staff/list');
    }
  }, [loadingAuth, canEdit, router]);

  const fetchStaffData = useCallback(async () => {
    if (!staffUid) return;
    setLoading(true);
    try {
      const docRef = doc(db, COLLECTION_NAME, staffUid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const fullData = {
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : '',
        };
        setFormData(fullData);
        setInitialData(fullData); // 원본 데이터 저장
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
    if(canEdit) {
        fetchStaffData();
    }
  }, [canEdit, fetchStaffData]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (category, type, isChecked) => {
    const currentPermission = formData.permissions?.[category] || 'none';
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
    
    setFormData(prev => ({
        ...prev,
        permissions: { ...prev.permissions, [category]: newPermission }
    }));
  };

  // 1. handleSaveChanges 함수 수정
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError('');

    if (!canEdit) {
      setError("저장 권한이 없습니다.");
      setIsSaving(false);
      return;
    }
    if (!initialData || !formData) {
        setError("데이터가 올바르게 로드되지 않았습니다.");
        setIsSaving(false);
        return;
    }

    // 변경사항 감지
    const infoChanged = initialData.staffName !== formData.staffName || initialData.phone !== formData.phone || initialData.email !== formData.email;
    const permissionsChanged = !isEqual(initialData.permissions, formData.permissions);

    if (!infoChanged && !permissionsChanged) {
        alert("변경된 내용이 없습니다.");
        setIsSaving(false);
        return;
    }

    try {
      // 2. 이벤트 유형 결정
      let eventType = '';
      if (infoChanged && permissionsChanged) {
        eventType = '정보 및 권한 변경';
      } else if (infoChanged) {
        eventType = '정보 수정';
      } else if (permissionsChanged) {
        eventType = '권한 변경';
      }

      // 3. 직원 정보 업데이트
      const docRef = doc(db, COLLECTION_NAME, staffUid);
      const { staffId, staffName, phone, email, permissions } = formData;
      await updateDoc(docRef, { staffId, staffName, phone, email, permissions });

      // 4. 변경 내역 로그 저장
      const historyCollectionRef = collection(db, HISTORY_COLLECTION_NAME);
      await addDoc(historyCollectionRef, {
        createdAt: serverTimestamp(),
        // 현재 로그인한 관리자 정보
        operatorId: user.uid,
        operatorName: user.displayName || user.email, // displayName이 없을 경우 email 사용
        // 변경된 직원 정보
        targetStaffId: formData.staffId,
        targetStaffName: formData.staffName,
        // 이벤트 정보
        eventType: eventType,
        notes: '' // 비고는 내역 페이지에서 직접 입력
      });
      
      alert("직원 정보가 성공적으로 수정되었고, 변경 내역이 기록되었습니다.");
      router.push('/admin/staff/list');

    } catch(err) {
      console.error("Error saving changes or logging history:", err);
      setError(`저장 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => { /* 삭제 로직 (필요시 변경내역 기록 추가) */ };
  const handleGoToList = () => router.push('/admin/staff/list');

  if (loadingAuth || loading) return <div className={styles.pageContainer}><p>로딩 중...</p></div>;
  if (error) return <div className={styles.pageContainer}><p className={styles.errorText}>{error}</p></div>;
  if (!formData) return null; // 데이터가 아직 없으면 렌더링하지 않음

  return (
    <div className={styles.detailPageContainer}>
        <div style={{display: 'flex', gap: '30px'}}>
            {/* 왼쪽: 직원 정보 */}
            <div style={{flex: 1}}>
                <h2 className={styles.pageTitle} style={{textAlign:'left', borderBottom: 'none'}}>직원 정보</h2>
                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>직원명</label>
                        <input type="text" name="staffName" value={formData.staffName || ''} onChange={handleInputChange} className={styles.input} disabled={!canEdit} />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>이메일</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className={styles.input} disabled={!canEdit}/>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>휴대폰번호</label>
                        <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className={styles.input} disabled={!canEdit}/>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>회원가입일시</label>
                        <input type="text" value={formData.createdAt || ''} className={styles.input} readOnly />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>ID(회원번호)</label>
                        <input type="text" name="staffId" value={formData.staffId || ''} className={styles.input} readOnly />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>PASSWORD</label>
                        <input type="password" placeholder="비밀번호 변경은 별도 기능으로 처리" className={styles.input} disabled={true} />
                    </div>
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
                                        <input type="checkbox" disabled={!canEdit} checked={currentPerm === 'view' || currentPerm === 'edit'} onChange={(e) => handlePermissionChange(cat.key, 'view', e.target.checked)}/>
                                    </td>
                                    <td className={styles.centerTd}>
                                        <input type="checkbox" disabled={!canEdit} checked={currentPerm === 'edit'} onChange={(e) => handlePermissionChange(cat.key, 'edit', e.target.checked)}/>
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
            <div className={styles.actionTdInnerDiv}></div>
                <button onClick={handleSaveChanges} className={`${styles.button}`} style={{backgroundColor: '#5cb85c', color: 'white'}} disabled={!canEdit || isSaving}>{isSaving ? '저장 중...' : '저장'}</button>
                <button onClick={handleDelete} className={`${styles.button}`} style={{backgroundColor: '#d9534f', color: 'white'}} disabled={!canEdit || isSaving}>삭제</button>
                <button onClick={handleGoToList} className={styles.secondaryButton}>목록</button>
            </div>
        </div>
  );
}