"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/clientApp';
import styles from '../../board.module.css';

const COLLECTION_NAME = "advertisements";

export default function NewAdvertisementPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        isVisible: true,
        name: '',
        description: '', // 이미지 URL이 포함될 텍스트 필드
        startDate: '',
        endDate: ''
    });
    const [mainImageFile, setMainImageFile] = useState(null); // 메인 배너 이미지 파일
    const [mainImagePreview, setMainImagePreview] = useState(''); // 메인 배너 이미지 미리보기

    const [descriptionImageFile, setDescriptionImageFile] = useState(null); // 설명 필드 내 삽입될 이미지 파일
    const [descriptionImagePreview, setDescriptionImagePreview] = useState(''); // 설명 필드 내 이미지 미리보기
    const [isUploadingDescriptionImage, setIsUploadingDescriptionImage] = useState(false); // 설명 이미지 업로드 중 상태

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); // 이미지 업로드 성공 메시지

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // 메인 배너 이미지 변경 핸들러
    const handleMainImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setMainImageFile(file);
            setMainImagePreview(URL.createObjectURL(file));
        }
    };

    // 설명 필드 내 이미지 업로드 및 URL 삽입 핸들러
    const handleDescriptionImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setDescriptionImageFile(file);
        setDescriptionImagePreview(URL.createObjectURL(file));
        setIsUploadingDescriptionImage(true);
        setError('');
        setSuccessMessage(''); // 이전 메시지 초기화

        try {
            // 이미지를 Firebase Storage에 업로드
            const imageRef = ref(storage, `advertisements/description_images/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(imageRef, file);
            const imageUrl = await getDownloadURL(snapshot.ref);

            // 업로드된 이미지 URL을 description 텍스트의 끝에 마크다운 형식으로 삽입
            // 실제 구현에서는 커서 위치에 삽입하는 로직이 더 좋을 수 있지만,
            // textarea의 한계와 복잡성을 고려하여 간단히 끝에 추가합니다.
            setFormData(prev => ({
                ...prev,
                description: `${prev.description}\n\n![Image](${imageUrl})\n\n` // 마크다운 형식으로 삽입
            }));
            setSuccessMessage("이미지가 성공적으로 업로드되어 설명에 삽입되었습니다.");

        } catch (err) {
            console.error("Error uploading description image: ", err);
            setError(`이미지 업로드 중 오류 발생: ${err.message}`);
        } finally {
            setIsUploadingDescriptionImage(false);
            // 업로드 완료 후 input을 초기화하여 같은 파일을 다시 선택할 수 있게 함
            e.target.value = '';
            setDescriptionImageFile(null);
            setDescriptionImagePreview('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !mainImageFile || !formData.startDate || !formData.endDate) {
            setError("광고명, 배너이미지, 광고 게시 기간은 필수 항목입니다.");
            return;
        }
        setIsSaving(true);
        setError('');

        try {
            // 1. 메인 배너 이미지 업로드
            const imageRef = ref(storage, `advertisements/${Date.now()}_${mainImageFile.name}`);
            const snapshot = await uploadBytes(imageRef, mainImageFile);
            const imageUrl = await getDownloadURL(snapshot.ref);

            // endDate의 시간을 23:59:59로 설정
            const endDate = new Date(formData.endDate);
            endDate.setHours(23, 59, 59, 999);

            // 2. Firestore에 데이터 저장
            await addDoc(collection(db, COLLECTION_NAME), {
                ...formData,
                imageUrl, // 메인 배너 이미지 URL
                startDate: Timestamp.fromDate(new Date(formData.startDate)),
                endDate: Timestamp.fromDate(endDate),
                createdAt: serverTimestamp(),
            });

            alert("새로운 광고가 성공적으로 등록되었습니다.");
            router.push('/admin/advertisements');

        } catch (err) {
            console.error("Error creating advertisement: ", err);
            setError(`등록 중 오류 발생: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.formPageContainer}>
            <h1 className={styles.pageTitle}>신규 광고 등록</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div>
                    <label className={styles.label}>노출여부</label>
                    <input
                        type="checkbox"
                        name="isVisible"
                        checked={formData.isVisible}
                        onChange={handleChange}
                        style={{marginLeft: '10px'}}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>광고명</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={styles.input}/>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="description" className={styles.label}>광고설명</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className={styles.textarea}
                        rows="10" // textarea 높이 조절
                        disabled={isUploadingDescriptionImage || isSaving} // 이미지 업로드 중 또는 저장 중 비활성화
                    />
                    {/* 설명 필드 내 이미지 추가 버튼 및 미리보기 */}
                    <div style={{ marginTop: '10px' }}>
                        <label htmlFor="descriptionImage" className={styles.label} style={{display: 'block', marginBottom: '5px'}}>
                            설명에 이미지 삽입:
                        </label>
                        <input
                            type="file"
                            id="descriptionImage"
                            onChange={handleDescriptionImageUpload}
                            accept="image/*"
                            disabled={isUploadingDescriptionImage || isSaving}
                        />
                        {descriptionImagePreview &&
                            <img
                                src={descriptionImagePreview}
                                alt="삽입할 이미지 미리보기"
                                style={{maxWidth: '150px', marginTop: '10px', display: 'block', border: '1px dashed #ccc', padding: '5px'}}
                            />
                        }
                        {isUploadingDescriptionImage &&
                            <p style={{color: '#007bff', marginTop: '5px'}}>이미지 업로드 중... 잠시만 기다려 주세요.</p>
                        }
                        {successMessage &&
                            <p style={{color: '#28a745', marginTop: '5px'}}>{successMessage}</p>
                        }
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="image" className={styles.label}>배너이미지</label>
                    <input type="file" id="image" onChange={handleMainImageChange} accept="image/*" />
                    {mainImagePreview && <img src={mainImagePreview} alt="배너 미리보기" style={{maxWidth: '300px', marginTop: '10px'}}/>}
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>광고 게시 기간</label>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={styles.input}/>
                        <span>~</span>
                        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={styles.input}/>
                    </div>
                </div>

                {error && <p className={styles.errorText}>{error}</p>}

                <div className={styles.buttonContainer}>
                    <button type="submit" className={styles.primaryButton} disabled={isSaving || isUploadingDescriptionImage}>
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                    <button type="button" onClick={() => router.push('/admin/advertisements')} className={styles.secondaryButton} disabled={isSaving || isUploadingDescriptionImage}>
                        목록
                    </button>
                </div>
            </form>
        </div>
    );
}