// /app/admin/company-Info/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/clientApp';

const DOCUMENT_ID = "mainDetails";
const COLLECTION_NAME = "companyInfo";

export default function CompanyInfoPage() {
  const [formData, setFormData] = useState({
    introduce: '',
    history: '',
    goal: '',
    media: '',
    service: '',
    footerContent: '',
    customerServicePhone: '',
    customerServiceHours: '',
  });

  const [initialData, setInitialData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCompanyInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedData = {
          introduce: data.introduce || '',
          history: data.history || '',
          goal: data.goal || '',
          media: data.media || '',
          service: data.service || '',
          footerContent: data.footerContent || '',
          customerServicePhone: data.customerServicePhone || '',
          customerServiceHours: data.customerServiceHours || '',
        };
        setFormData(loadedData);
        setInitialData(loadedData);
      } else {
        console.log(`Document ${DOCUMENT_ID} does not exist. Using initial default values.`);
        setInitialData(formData);
      }
    } catch (err) {
      console.error("Error fetching company info: ", err);
      setError("회사 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyInfo();
  }, [fetchCompanyInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("저장하려면 로그인이 필요합니다.");
      }

      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      await setDoc(docRef, {
        ...formData,
        lastUpdatedAt: serverTimestamp(),
        lastUpdatedBy: currentUser.uid,
      }, { merge: true });

      setSuccessMessage("회사 정보가 성공적으로 저장되었습니다.");
      setInitialData(formData);
    } catch (err) {
      console.error("Error saving company info: ", err);
      setError("정보 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [formData, initialData, isSaving]);
  
  // 단축키 저장, 성공 메시지 자동 숨김 useEffect 등...
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (!isSaving && !isLoading) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave, isLoading, isSaving]);

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


  // 스타일 정의
  const sectionStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' };
  const h2Style = { fontSize: '18px', fontWeight: '600', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' };
  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px' };
  const smallInputStyle = { ...inputStyle, maxWidth: '300px' };
  const textareaStyle = { ...inputStyle, minHeight: '100px', resize: 'vertical', marginBottom: '10px' };
  const saveButtonStyle = { display: 'block', marginLeft: 'auto', padding: '10px 25px', backgroundColor: '#4A5568', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px' };
  const messageStyle = { marginTop: '15px', padding: '10px', borderRadius: '4px', textAlign: 'center' };
  const successMessageStyle = { ...messageStyle, backgroundColor: '#d4edda', color: '#155724' };
  const errorMessageStyle = { ...messageStyle, backgroundColor: '#f8d7da', color: '#721c24' };
  // [추가] 가로 정렬을 위한 스타일
  const horizontalGroupStyle = { display: 'flex', gap: '20px', alignItems: 'flex-start' };
  const inputGroupStyle = { display: 'flex', flexDirection: 'column', flex: 1 };
  const labelStyle = { marginBottom: '8px', fontSize: '14px', color: '#333', fontWeight: '500' };

  if (isLoading) {
    return <div style={sectionStyle}><p>회사 정보를 불러오는 중...</p></div>;
  }

  return (
    <div>
      <div style={sectionStyle}>
        <h2 style={h2Style}>회사 소개 멘트</h2>
        <textarea name="introduce" style={textareaStyle} value={formData.introduce} onChange={handleChange} disabled={isSaving} />
      </div>
      <div style={sectionStyle}>
        <h2 style={h2Style}>회사연혁</h2>
        <textarea name="history" style={textareaStyle} value={formData.history} onChange={handleChange} disabled={isSaving} />
      </div>
      <div style={sectionStyle}>
        <h2 style={h2Style}>지향</h2>
        <textarea name="goal" style={textareaStyle} value={formData.goal} onChange={handleChange} disabled={isSaving} />
      </div>
      <div style={sectionStyle}>
        <h2 style={h2Style}>언론소개</h2>
        <textarea name="media" style={textareaStyle} value={formData.media} onChange={handleChange} disabled={isSaving} />
      </div>
      <div style={sectionStyle}>
        <h2 style={h2Style}>서비스</h2>
        <textarea name="service" style={textareaStyle} value={formData.service} onChange={handleChange} disabled={isSaving} />
      </div>
      <div style={sectionStyle}>
        <h2 style={h2Style}>Footer 내용</h2>
        <textarea name="footerContent" style={textareaStyle} value={formData.footerContent} onChange={handleChange} disabled={isSaving} />
      </div>

      {/* ================== [수정된 섹션] ================== */}
      <div style={sectionStyle}>
        <h2 style={h2Style}>고객센터 정보</h2>
        <div style={horizontalGroupStyle}>
          <div style={inputGroupStyle}>
            <label htmlFor="customerServicePhone" style={labelStyle}>고객센터 전화번호</label>
            <input 
              id="customerServicePhone"
              name="customerServicePhone"
              type="text" 
              maxLength="20"
              placeholder="예: 02-123-4567"
              style={smallInputStyle} 
              value={formData.customerServicePhone} 
              onChange={handleChange} 
              disabled={isSaving} 
            />
          </div>
          <div style={inputGroupStyle}>
            <label htmlFor="customerServiceHours" style={labelStyle}>고객센터 상담시간</label>
            <input 
              id="customerServiceHours"
              name="customerServiceHours"
              type="text" 
              maxLength="20"
              placeholder="예: 09:00~20:00"
              style={smallInputStyle} 
              value={formData.customerServiceHours} 
              onChange={handleChange} 
              disabled={isSaving} 
            />
          </div>
        </div>
      </div>
      {/* ================================================= */}
      
      {successMessage && <div style={successMessageStyle}>{successMessage}</div>}
      {error && <div style={errorMessageStyle}>{error}</div>}

      <button onClick={handleSave} style={saveButtonStyle} disabled={isSaving || isLoading}>
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  );
}
