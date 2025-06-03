// /app/admin/company-Info/page.jsx (성공 메시지 자동 사라짐 기능 추가)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/clientApp';

const DOCUMENT_ID = "mainDetails";
const COLLECTION_NAME = "companyInfo";

export default function CompanyInfoPage() {
  const [formData, setFormData] = useState({
    introduce: "*똑똑한 선택, 빠른 견적 - 픽큐",
    history: "연혁에 대한 내용입니다. 연혁에 대한 내용입니다.",
    goal: "회사의 지향점에 대한 내용입니다.",
    media: "언론 소개에 대한 내용입니다. 소개 내용입니다.",
    service: "청소 매칭을 전문으로 합니다."
  });
  const [initialData, setInitialData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCompanyInfo = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
            introduce: data.introduce || formData.introduce,
            history: data.history || formData.history,
            goal: data.goal || formData.goal,
            media: data.media || formData.media,
            service: data.service || formData.service,
        });
        setInitialData(data);
      } else {
        console.log(`Document ${DOCUMENT_ID} does not exist in ${COLLECTION_NAME}. Using initial default values for form and saving them as initialData.`);
        setInitialData(formData);
      }
    } catch (err) {
      console.error("Error fetching company info: ", err);
      setError("회사 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // 입력이 변경되면 성공/오류 메시지를 즉시 지울 수 있습니다.
    // setSuccessMessage(''); // 이미 타이머로 처리되므로 필수 아님
    // setError('');
  };

  const handleSave = useCallback(async () => {
    if (isSaving || isLoading) return;

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    const hasChanges = Object.keys(formData).some(key => formData[key] !== initialData[key]);
    if (!hasChanges && Object.keys(initialData).length > 0 && initialData.introduce !== undefined) {
        setSuccessMessage("변경된 내용이 없습니다."); // 이 메시지도 자동으로 사라지게 됩니다.
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
      setError("정보 저장 중 오류가 발생했습니다. Firestore 보안 규칙 및 연결을 확인해주세요.");
    } finally {
      setIsSaving(false);
    }
  }, [formData, initialData, isSaving, isLoading]); // auth 객체 의존성 제거 가능

  // Ctrl+S 또는 Cmd+S 저장 기능
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

  // 성공 메시지 자동 숨김 처리
  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => {
        setSuccessMessage('');
      }, 2000); // 2초 후에 메시지 숨김
    }
    // 컴포넌트 언마운트 또는 successMessage가 변경되기 전에 타이머 클리어
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [successMessage]); // successMessage가 변경될 때마다 이 effect 실행


  // 스타일 정의 (이전과 동일)
  const sectionStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' };
  const h2Style = { fontSize: '18px', fontWeight: '600', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' };
  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '10px', fontSize: '14px' };
  const textareaStyle = { ...inputStyle, minHeight: '100px', resize: 'vertical' };
  const saveButtonStyle = { display: 'block', marginLeft: 'auto', padding: '10px 25px', backgroundColor: '#4A5568', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px' };
  const messageStyle = { marginTop: '15px', padding: '10px', borderRadius: '4px', textAlign: 'center', transition: 'opacity 0.5s ease-in-out' }; // 부드러운 효과를 위한 transition 추가
  const successMessageStyle = { ...messageStyle, backgroundColor: '#d4edda', color: '#155724', opacity: 1 };
  const errorMessageStyle = { ...messageStyle, backgroundColor: '#f8d7da', color: '#721c24' };


  if (isLoading && !Object.keys(initialData).length) {
    return <div style={sectionStyle}><p>회사 정보를 불러오는 중...</p></div>;
  }

  return (
    <div>
      {/* ... (textarea 폼 부분은 이전과 동일) ... */}
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
      
      {/* 메시지 표시 부분: successMessage가 있을 때만 렌더링 */}
      {successMessage && 
        <div style={{...successMessageStyle, opacity: successMessage ? 1 : 0}}> 
          {successMessage}
        </div>
      }
      {error && <div style={errorMessageStyle}>{error}</div>} {/* 에러 메시지는 계속 표시될 수 있음 */}

      <button onClick={handleSave} style={saveButtonStyle} disabled={isSaving || isLoading}>
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  );
}