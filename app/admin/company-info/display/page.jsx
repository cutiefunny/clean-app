// /app/admin/company-Info/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    collection,
    getDocs,
    deleteDoc,
    query,
    where,
    orderBy // 정렬을 위해 추가
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/clientApp';

const MAIN_DOCUMENT_ID = "mainDetails"; // 기존 고정 문서 ID
const COLLECTION_NAME = "companyInfo";
const EXCLUDED_DOCS = ['default', MAIN_DOCUMENT_ID]; // 가져오기에서 제외할 문서 ID 목록

export default function CompanyInfoPage() {
    // 고정 섹션 (푸터, 고객센터) 데이터
    const [mainFormData, setMainFormData] = useState({
        footerContent: '',
        customerServicePhone: '',
        customerServiceHours: '',
    });

    // 동적 섹션 데이터 (배열 형태)
    // 각 섹션에 'order' 필드를 추가합니다.
    const [dynamicSections, setDynamicSections] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Firestore에서 회사 정보 불러오기
    const fetchCompanyInfo = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. 고정 섹션 (mainDetails) 불러오기
            const mainDocRef = doc(db, COLLECTION_NAME, MAIN_DOCUMENT_ID);
            const mainDocSnap = await getDoc(mainDocRef);

            if (mainDocSnap.exists()) {
                const data = mainDocSnap.data();
                setMainFormData({
                    footerContent: data.footerContent || '',
                    customerServicePhone: data.customerServicePhone || '',
                    customerServiceHours: data.customerServiceHours || '',
                });
            } else {
                console.log(`Document ${MAIN_DOCUMENT_ID} does not exist. Using initial default values.`);
            }

            // 2. 동적 섹션 불러오기 (mainDetails와 default 제외)
            // 'order' 필드를 기준으로 오름차순 정렬하여 가져옵니다.
            const q = query(
                collection(db, COLLECTION_NAME),
                where('__name__', 'not-in', EXCLUDED_DOCS),
                orderBy('order', 'asc') // 'order' 필드를 기준으로 오름차순 정렬
            );
            const querySnapshot = await getDocs(q);
            const loadedDynamicSections = [];
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                loadedDynamicSections.push({
                    id: docSnap.id,
                    title: data.title || '',
                    content: data.content || '',
                    order: data.order !== undefined ? data.order : 9999, // order 필드가 없으면 기본값 설정
                });
            });
            setDynamicSections(loadedDynamicSections);

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

    // 고정 섹션 데이터 변경 핸들러
    const handleMainFormChange = (e) => {
        const { name, value } = e.target;
        setMainFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // 동적 섹션 데이터 변경 핸들러
    const handleDynamicSectionChange = (id, field, value) => {
        setDynamicSections(prevSections =>
            prevSections.map(section =>
                section.id === id ? { ...section, [field]: value } : section
            )
        );
    };

    // 새로운 동적 섹션 추가
    const handleAddSection = () => {
        const newId = `section-${Date.now()}`; // 고유한 ID 생성
        // 새로운 섹션에 기본 order 값을 부여합니다 (기존 섹션들 다음 순서).
        const maxOrder = dynamicSections.reduce((max, section) => Math.max(max, section.order || 0), 0);
        setDynamicSections(prevSections => [
            ...prevSections,
            { id: newId, title: '', content: '', order: maxOrder + 1 }
        ]);
        setSuccessMessage('새로운 섹션이 추가되었습니다. 내용을 입력 후 저장하세요.');
    };

    // 동적 섹션 삭제
    const handleDeleteSection = async (idToDelete) => {
        if (!confirm('정말로 이 섹션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        setIsSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            await deleteDoc(doc(db, COLLECTION_NAME, idToDelete));
            setDynamicSections(prevSections => prevSections.filter(section => section.id !== idToDelete));
            setSuccessMessage(`섹션 '${idToDelete}'이(가) 성공적으로 삭제되었습니다.`);
        } catch (err) {
            console.error("Error deleting section: ", err);
            setError("섹션 삭제 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };


    // 모든 정보 저장
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

            // 1. 고정 섹션 (mainDetails) 저장
            const mainDocRef = doc(db, COLLECTION_NAME, MAIN_DOCUMENT_ID);
            await setDoc(mainDocRef, {
                ...mainFormData,
                lastUpdatedAt: serverTimestamp(),
                lastUpdatedBy: currentUser.uid,
            }, { merge: true });

            // 2. 동적 섹션 저장 (각 섹션별로 문서 생성/업데이트)
            for (const section of dynamicSections) {
                const sectionDocRef = doc(db, COLLECTION_NAME, section.id);
                await setDoc(sectionDocRef, {
                    title: section.title,
                    content: section.content,
                    order: Number(section.order), // 숫자로 변환하여 저장
                    lastUpdatedAt: serverTimestamp(),
                    lastUpdatedBy: currentUser.uid,
                }, { merge: true });
            }

            setSuccessMessage("회사 정보가 성공적으로 저장되었습니다.");
            // 저장 후 데이터 다시 불러오기 (초기 데이터와 동기화 및 정렬)
            fetchCompanyInfo();

        } catch (err) {
            console.error("Error saving company info: ", err);
            setError("정보 저장 중 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    }, [mainFormData, dynamicSections, isSaving, fetchCompanyInfo]);

    // 단축키 저장
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

    // 성공 메시지 자동 숨김
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
    const h2Style = { fontSize: '18px', fontWeight: '600', color: '#333' };
    const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px' };
    const smallInputStyle = { ...inputStyle, maxWidth: '300px' };
    const textareaStyle = { ...inputStyle, minHeight: '100px', resize: 'vertical', marginBottom: '10px' };
    const saveButtonStyle = { display: 'block', marginLeft: 'auto', padding: '10px 25px', backgroundColor: '#4A5568', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '15px' };
    const addSectionButtonStyle = { padding: '10px 15px', backgroundColor: '#6C757D', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' };
    const deleteSectionButtonStyle = { padding: '5px 10px', backgroundColor: '#DC3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginLeft: '10px' };
    const messageStyle = { marginTop: '15px', padding: '10px', borderRadius: '4px', textAlign: 'center' };
    const successMessageStyle = { ...messageStyle, backgroundColor: '#d4edda', color: '#155724' };
    const errorMessageStyle = { ...messageStyle, backgroundColor: '#f8d7da', color: '#721c24' };
    const horizontalGroupStyle = { display: 'flex', gap: '20px', alignItems: 'flex-start' };
    const inputGroupStyle = { display: 'flex', flexDirection: 'column', flex: 1 };
    const labelStyle = { marginBottom: '8px', fontSize: '14px', color: '#333', fontWeight: '500' };
    const sectionHeaderStyle = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #eee', // 섹션 제목 아래 줄 추가
        paddingBottom: '10px' // 줄과의 간격
    };
    const orderInputStyle = {
        ...inputStyle,
        width: '80px', // 순서 필드 너비 조절
        textAlign: 'center',
        marginRight: '10px',
        padding: '5px',
        fontSize: '14px'
    };
    const titleAndOrderGroupStyle = {
        display: 'flex',
        alignItems: 'center',
        flexGrow: 1 // 공간을 최대한 차지하도록
    };


    if (isLoading) {
        return <div style={sectionStyle}><p>회사 정보를 불러오는 중...</p></div>;
    }

    return (
        <div>
            {/* 동적 섹션 추가 버튼 */}
            <button onClick={handleAddSection} style={addSectionButtonStyle} disabled={isSaving || isLoading}>
                + 새로운 섹션 추가
            </button>

            {/* 동적 섹션 렌더링 */}
            {dynamicSections.map((section) => (
                <div key={section.id} style={sectionStyle}>
                    <div style={sectionHeaderStyle}>
                        <div style={titleAndOrderGroupStyle}>
                            <input
                                type="number"
                                name={`order-${section.id}`}
                                placeholder="순서"
                                style={orderInputStyle}
                                value={section.order}
                                onChange={(e) => handleDynamicSectionChange(section.id, 'order', Number(e.target.value))}
                                disabled={isSaving}
                                min="0" // 음수 입력 방지
                            />
                            <h2 style={{ ...h2Style, marginBottom: '0', flexGrow: 1 }}>
                                <input
                                    type="text"
                                    name={`title-${section.id}`}
                                    placeholder="섹션 제목"
                                    style={{ ...inputStyle, border: 'none', padding: '0', fontSize: '18px', fontWeight: '600' }}
                                    value={section.title}
                                    onChange={(e) => handleDynamicSectionChange(section.id, 'title', e.target.value)}
                                    disabled={isSaving}
                                />
                            </h2>
                        </div>
                        <button
                            onClick={() => handleDeleteSection(section.id)}
                            style={deleteSectionButtonStyle}
                            disabled={isSaving}
                        >
                            삭제
                        </button>
                    </div>
                    <textarea
                        name={`content-${section.id}`}
                        placeholder="섹션 내용"
                        style={textareaStyle}
                        value={section.content}
                        onChange={(e) => handleDynamicSectionChange(section.id, 'content', e.target.value)}
                        disabled={isSaving}
                    />
                </div>
            ))}

            {/* 고정 섹션: Footer 내용 */}
            <div style={sectionStyle}>
                <h2 style={{ ...h2Style, borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Footer 내용</h2>
                <textarea name="footerContent" style={textareaStyle} value={mainFormData.footerContent} onChange={handleMainFormChange} disabled={isSaving} />
            </div>

            {/* 고정 섹션: 고객센터 정보 */}
            <div style={sectionStyle}>
                <h2 style={{ ...h2Style, borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>고객센터 정보</h2>
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
                            value={mainFormData.customerServicePhone}
                            onChange={handleMainFormChange}
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
                            value={mainFormData.customerServiceHours}
                            onChange={handleMainFormChange}
                            disabled={isSaving}
                        />
                    </div>
                </div>
            </div>

            {successMessage && <div style={successMessageStyle}>{successMessage}</div>}
            {error && <div style={errorMessageStyle}>{error}</div>}

            <button onClick={handleSave} style={saveButtonStyle} disabled={isSaving || isLoading}>
                {isSaving ? '저장 중...' : '저장'}
            </button>
        </div>
    );
}