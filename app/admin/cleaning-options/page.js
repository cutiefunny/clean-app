// /app/admin/cleaning-options/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/clientApp';

// Firestore 컬렉션 및 문서 ID 정의
const COLLECTION_NAME = "settings";
const DOCUMENT_ID = "cleaningOptions";

export default function CleaningOptionsPage() {
  // 청소 종류 설명 상태
  const [descriptions, setDescriptions] = useState({
    newConstruction: '',
    moveIn: '',
    remodeling: '',
    commercial: '',
  });

  // 동적 리스트 상태
  const [buildingTypes, setBuildingTypes] = useState(['']);
  const [siteConditions, setSiteConditions] = useState(['']);
  const [flatSizes, setFlatSizes] = useState(['']);

  // 데이터 로딩, 저장, 오류, 성공 메시지 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Firestore에서 데이터 불러오기
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setDescriptions({
          newConstruction: data.descriptions?.newConstruction || '',
          moveIn: data.descriptions?.moveIn || '',
          remodeling: data.descriptions?.remodeling || '',
          commercial: data.descriptions?.commercial || '',
        });
        // DB에 데이터가 없거나 비어있으면 기본값으로 [''] 설정
        setBuildingTypes(data.buildingTypes?.length > 0 ? data.buildingTypes : ['']);
        setSiteConditions(data.siteConditions?.length > 0 ? data.siteConditions : ['']);
        setFlatSizes(data.flatSizes?.length > 0 ? data.flatSizes : ['']);
      } else {
        console.log(`Document ${DOCUMENT_ID} does not exist. Using initial default values.`);
      }
    } catch (err) {
      console.error("Error fetching cleaning options: ", err);
      setError("옵션 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 설명 텍스트 변경 핸들러
  const handleDescriptionChange = (e) => {
    const { name, value } = e.target;
    setDescriptions(prev => ({ ...prev, [name]: value }));
  };

  // 동적 리스트 아이템 변경 핸들러
  const handleListItemChange = (e, index, listSetter) => {
    const { value } = e.target;
    listSetter(prevList => {
      const newList = [...prevList];
      newList[index] = value;
      return newList;
    });
  };
  
  // 동적 리스트 아이템 추가 핸들러
  const addListItem = (listSetter) => {
    listSetter(prevList => [...prevList, '']);
  };

  // 동적 리스트 아이템 삭제 핸들러
  const removeListItem = (index, listSetter) => {
    // 최소 1개의 입력창은 유지
    listSetter(prevList => {
        if(prevList.length > 1) {
            const newList = [...prevList];
            newList.splice(index, 1);
            return newList;
        }
        return prevList;
    });
  };

  // 데이터 저장 핸들러
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
      
      const dataToSave = {
        descriptions,
        // 빈 값은 저장하지 않음
        buildingTypes: buildingTypes.filter(item => item.trim() !== ''),
        siteConditions: siteConditions.filter(item => item.trim() !== ''),
        flatSizes: flatSizes.filter(item => item.trim() !== ''),
        lastUpdatedAt: serverTimestamp(),
        lastUpdatedBy: currentUser.uid,
      };

      await setDoc(docRef, dataToSave, { merge: true });
      setSuccessMessage("청소 옵션이 성공적으로 저장되었습니다.");
      
    } catch (err) {
      console.error("Error saving cleaning options: ", err);
      setError("옵션 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [descriptions, buildingTypes, siteConditions, flatSizes, isSaving]);

  // 단축키 (Ctrl+S / Cmd+S) 저장 기능
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);
  
  // 성공 메시지 자동 숨김
  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => setSuccessMessage(''), 3000);
    }
    return () => clearTimeout(timer);
  }, [successMessage]);


  // --- 스타일 정의 ---
  const sectionStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' };
  const h2Style = { fontSize: '18px', fontWeight: '600', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' };
  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px' };
  const textareaStyle = { ...inputStyle, minHeight: '100px', resize: 'vertical' };
  const labelStyle = { marginBottom: '8px', fontSize: '14px', color: '#333', fontWeight: '500', display: 'block' };
  const saveButtonStyle = { display: 'block', width: '120px', marginLeft: 'auto', padding: '12px 25px', backgroundColor: '#4A5568', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', textAlign: 'center' };
  const messageStyle = { marginTop: '15px', padding: '10px', borderRadius: '4px', textAlign: 'center' };
  const successMessageStyle = { ...messageStyle, backgroundColor: '#d4edda', color: '#155724' };
  const errorMessageStyle = { ...messageStyle, backgroundColor: '#f8d7da', color: '#721c24' };
  const dynamicListContainerStyle = { display: 'flex', flexDirection: 'column', gap: '10px' };
  const dynamicListItemStyle = { display: 'flex', alignItems: 'center', gap: '10px' };
  const addButtonContainerStyle = { marginTop: '15px' };
  const addButtonStyle = { padding: '8px 15px', backgroundColor: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' };
  const removeButtonStyle = { padding: '5px 10px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', color: '#718096' };


  if (isLoading) {
    return <div style={sectionStyle}><h2>청소 옵션 정보를 불러오는 중...</h2></div>;
  }

  // --- 렌더링 함수 ---
  const renderDynamicList = (title, list, listSetter) => (
    <div style={sectionStyle}>
      <h2 style={h2Style}>{title}</h2>
      <div style={dynamicListContainerStyle}>
        {list.map((item, index) => (
          <div key={index} style={dynamicListItemStyle}>
            <input
              type="text"
              value={item}
              onChange={(e) => handleListItemChange(e, index, listSetter)}
              style={{ ...inputStyle, flex: 1 }}
              placeholder={`${title} 항목 입력`}
              disabled={isSaving}
            />
            {list.length > 1 && (
                <button onClick={() => removeListItem(index, listSetter)} style={removeButtonStyle} disabled={isSaving}>
                -
                </button>
            )}
          </div>
        ))}
      </div>
      <div style={addButtonContainerStyle}>
        <button onClick={() => addListItem(listSetter)} style={addButtonStyle} disabled={isSaving}>
          + {title} 추가
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={sectionStyle}>
        <h2 style={h2Style}>청소 종류 설명</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label htmlFor="newConstruction" style={labelStyle}>신축입주청소</label>
            <textarea id="newConstruction" name="newConstruction" value={descriptions.newConstruction} onChange={handleDescriptionChange} style={textareaStyle} disabled={isSaving} />
          </div>
          <div>
            <label htmlFor="moveIn" style={labelStyle}>이사청소</label>
            <textarea id="moveIn" name="moveIn" value={descriptions.moveIn} onChange={handleDescriptionChange} style={textareaStyle} disabled={isSaving} />
          </div>
          <div>
            <label htmlFor="remodeling" style={labelStyle}>준공/리모델링청소</label>
            <textarea id="remodeling" name="remodeling" value={descriptions.remodeling} onChange={handleDescriptionChange} style={textareaStyle} disabled={isSaving} />
          </div>
          <div>
            <label htmlFor="commercial" style={labelStyle}>상가/사무실청소</label>
            <textarea id="commercial" name="commercial" value={descriptions.commercial} onChange={handleDescriptionChange} style={textareaStyle} disabled={isSaving} />
          </div>
        </div>
      </div>

      {renderDynamicList('건물 형태', buildingTypes, setBuildingTypes)}
      {renderDynamicList('당일 현장 상황', siteConditions, setSiteConditions)}
      {renderDynamicList('평형', flatSizes, setFlatSizes)}
      
      {successMessage && <div style={successMessageStyle}>{successMessage}</div>}
      {error && <div style={errorMessageStyle}>{error}</div>}

      <button onClick={handleSave} style={saveButtonStyle} disabled={isSaving || isLoading}>
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  );
}
