// /app/admin/points/usage/setting/page.jsx (테이블 레이아웃으로 변경)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/clientApp';
import styles from '../../../board.module.css'; // 공통 CSS Module 사용

const SETTINGS_DOC_ID = "pointSettings";
const COLLECTION_NAME = "settings";

export default function PointSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    deductionTarget: 'selected_stores',
    pointContentType: 'auto_deduct',
    usageType: 'fixed',
    pointsToApply: '',
    status: 'active',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // fetchSettings, handleChange, handleRadioChange 함수는 이전과 동일
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          deductionTarget: data.deductionTarget || 'selected_stores',
          pointContentType: data.pointContentType || 'auto_deduct',
          usageType: data.usageType || 'fixed',
          pointsToApply: data.pointsToApply || '',
          status: data.status || 'active',
        });
      }
    } catch (err) {
      console.error("Error fetching point settings: ", err);
      setError("설정을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMessage('');
  };

  // handleSave 함수에 event 파라미터 추가 및 preventDefault() 호출
  const handleSave = async (e) => {
    e.preventDefault(); // form의 기본 제출 동작 방지
    if (isSaving) return;
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    if (settings.usageType === 'fixed' && (isNaN(settings.pointsToApply) || settings.pointsToApply === '')) {
      setError("고정값 차감 시 '적용 포인트'는 숫자여야 합니다.");
      setIsSaving(false);
      return;
    }
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("저장하려면 로그인이 필요합니다.");
        setIsSaving(false);
        return;
      }

      const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
      await setDoc(docRef, {
        ...settings,
        pointsToApply: Number(settings.pointsToApply),
        lastUpdatedAt: serverTimestamp(),
        lastUpdatedBy: currentUser.uid,
      }, { merge: true });

      setSuccessMessage("포인트 설정이 성공적으로 저장되었습니다.");
    } catch (err) {
      console.error("Error saving point settings: ", err);
      setError(`설정 저장 중 오류 발생: ${err.message}.`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // 성공 메시지 자동 숨김 처리 (이전과 동일)
  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => { setSuccessMessage(''); }, 2000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [successMessage]);

  if (isLoading) {
    return <div className={styles.formPageContainer}><p>설정 정보를 불러오는 중...</p></div>;
  }
  
  return (
    <div className={styles.formPageContainer}>
      <h1 className={styles.pageTitle}>포인트 설정</h1>

      {/* 전체를 form 태그로 감싸고 onSubmit 핸들러 연결 */}
      <form onSubmit={handleSave}>
        <table className={styles.settingsTable}>
          <tbody>
            <tr>
              <td className={styles.settingsLabelCell}>
                <label>차감대상</label>
              </td>
              <td className={styles.settingsValueCell}>
                <div style={{display: 'flex', gap: '20px'}}>
                  <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                    <input type="radio" name="deductionTarget" value="selected_stores" checked={settings.deductionTarget === 'selected_stores'} onChange={handleChange} />
                    <span style={{marginLeft: '5px'}}>선택된 매장</span>
                  </label>
                </div>
              </td>
            </tr>
            
            <tr>
              <td className={styles.settingsLabelCell}>
                <label htmlFor="pointContentType">포인트내용</label>
              </td>
              <td className={styles.settingsValueCell}>
                <select id="pointContentType" name="pointContentType" value={settings.pointContentType} onChange={handleChange} className={styles.select}>
                  <option value="auto_deduct">전송 자동 차감</option>
                  <option value="manual_entry">직접 포인트 입력</option>
                </select>
              </td>
            </tr>

            <tr>
              <td className={styles.settingsLabelCell}>
                <label htmlFor="usageType">사용타입</label>
              </td>
              <td className={styles.settingsValueCell}>
                <select id="usageType" name="usageType" value={settings.usageType} onChange={handleChange} className={styles.select}>
                  <option value="fixed">고정값 차감</option>
                  <option value="manual">수동값 차감</option>
                </select>
              </td>
            </tr>
            
            <tr>
              <td className={styles.settingsLabelCell}>
                <label htmlFor="pointsToApply">적용 포인트</label>
              </td>
              <td className={styles.settingsValueCell}>
                <input 
                  type="number" 
                  id="pointsToApply" 
                  name="pointsToApply" 
                  value={settings.pointsToApply} 
                  onChange={handleChange} 
                  className={styles.input}
                  placeholder="포인트를 입력해주세요"
                  disabled={settings.usageType !== 'fixed'}
                />
              </td>
            </tr>

            <tr>
              <td className={styles.settingsLabelCell}>
                <label htmlFor="status">상태</label>
              </td>
              <td className={styles.settingsValueCell}>
                <select id="status" name="status" value={settings.status} onChange={handleChange} className={styles.select}>
                  <option value="active">사용중</option>
                  <option value="inactive">사용중지</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        {error && <p className={styles.errorText} style={{marginTop: '20px'}}>{error}</p>}
        {successMessage && <p className={styles.successText} style={{marginTop: '20px'}}>{successMessage}</p>}

        <div className={styles.buttonContainer} style={{ justifyContent: 'center' }}>
          <button type="button" onClick={() => router.back()} className={styles.secondaryButton} disabled={isSaving}>
            목록
          </button>
          <button type="submit" className={styles.primaryButton} disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}