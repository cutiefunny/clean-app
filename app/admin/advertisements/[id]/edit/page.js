// /app/admin/advertisements/[id]/edit/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // deleteObject 추가
import { db, storage } from '@/lib/firebase/clientApp';
import styles from '../../../board.module.css';

const COLLECTION_NAME = "advertisements";

export default function EditAdvertisementPage() {
    const router = useRouter();
    const params = useParams();
    const advertisementId = params?.id; // URL 파라미터에서 ID 가져오기

    const [formData, setFormData] = useState({
        isVisible: true,
        name: '',
        description: '', // 이미지 URL이 포함될 텍스트 필드
        startDate: '',
        endDate: '',
    });
    const [originalImageUrl, setOriginalImageUrl] = useState(null); // 기존 배너 이미지 URL
    const [mainImageFile, setMainImageFile] = useState(null); // 새로운 배너 이미지 파일
    const [mainImagePreview, setMainImagePreview] = useState(''); // 새로운 배너 이미지 미리보기

    const [descriptionImageFile, setDescriptionImageFile] = useState(null); // 설명 필드 내 삽입될 이미지 파일
    const [descriptionImagePreview, setDescriptionImagePreview] = useState(''); // 설명 필드 내 이미지 미리보기
    const [isUploadingDescriptionImage, setIsUploadingDescriptionImage] = useState(false); // 설명 이미지 업로드 중 상태

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // 데이터 로딩 상태
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); // 이미지 업로드 성공 메시지

    // 기존 광고 데이터 불러오기
    useEffect(() => {
        if (!advertisementId) {
            setIsLoading(false);
            return;
        }

        const fetchAdvertisement = async () => {
            setIsLoading(true);
            try {
                const docRef = doc(db, COLLECTION_NAME, advertisementId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const loadedData = {
                        isVisible: data.isVisible !== undefined ? data.isVisible : true,
                        name: data.name || '',
                        description: data.description || '',
                        startDate: data.startDate ? data.startDate.toDate().toISOString().split('T')[0] : '', // Timestamp -> Date string
                        endDate: data.endDate ? data.endDate.toDate().toISOString().split('T')[0] : '',     // Timestamp -> Date string
                    };
                    setFormData(loadedData);
                    setOriginalImageUrl(data.imageUrl || null); // 기존 이미지 URL 저장
                    setMainImagePreview(data.imageUrl || ''); // 미리보기에도 기존 이미지 표시
                } else {
                    setError('광고를 찾을 수 없습니다.');
                    router.push('/admin/advertisements'); // 목록으로 리다이렉트
                }
            } catch (err) {
                console.error("Error fetching advertisement:", err);
                setError(`광고 정보를 불러오는 중 오류 발생: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAdvertisement();
    }, [advertisementId, router]); // ID와 라우터가 변경될 때마다 데이터를 다시 불러옴

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
        } else {
            setMainImageFile(null);
            setMainImagePreview(originalImageUrl || ''); // 파일 선택 취소 시 원래 이미지로 복원
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
            const imageRef = ref(storage, `advertisements/description_images/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(imageRef, file);
            const imageUrl = await getDownloadURL(snapshot.ref);

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
            e.target.value = ''; // input 초기화
            setDescriptionImageFile(null);
            setDescriptionImagePreview('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.startDate || !formData.endDate) {
            setError("광고명, 광고 게시 기간은 필수 항목입니다.");
            return;
        }
        
        // 새 이미지가 없고, 기존 이미지도 없으면 배너 이미지 필수 오류
        if (!mainImageFile && !originalImageUrl) {
            setError("배너 이미지는 필수 항목입니다.");
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            let finalImageUrl = originalImageUrl; // 기본적으로 기존 URL 사용

            // 새로운 메인 배너 이미지가 선택되었다면 업로드
            if (mainImageFile) {
                // 선택 사항: 기존 이미지가 있다면 스토리지에서 삭제
                // if (originalImageUrl && originalImageUrl.includes('firebasestorage.googleapis.com')) {
                //     try {
                //         const oldImageRef = ref(storage, originalImageUrl);
                //         await deleteObject(oldImageRef);
                //     } catch (delErr) {
                //         console.warn("Failed to delete old image:", delErr);
                //     }
                // }
                const imageRef = ref(storage, `advertisements/${Date.now()}_${mainImageFile.name}`);
                const snapshot = await uploadBytes(imageRef, mainImageFile);
                finalImageUrl = await getDownloadURL(snapshot.ref);
            } else if (!mainImagePreview && originalImageUrl) {
                // 미리보기(mainImagePreview)가 없어지고 기존 URL(originalImageUrl)이 있었다면, 이미지를 삭제한 것으로 간주
                // 이 경우 스토리지에서 해당 이미지를 삭제할 수도 있습니다. (선택 사항)
                // if (originalImageUrl && originalImageUrl.includes('firebasestorage.googleapis.com')) {
                //     try {
                //         const oldImageRef = ref(storage, originalImageUrl);
                //         await deleteObject(oldImageRef);
                //     } catch (delErr) {
                //         console.warn("Failed to delete old image preview:", delErr);
                //     }
                // }
                finalImageUrl = null; // 이미지가 삭제되었으므로 URL을 null로 설정
            }

            const endDate = new Date(formData.endDate);
            endDate.setHours(23, 59, 59, 999);

            const docRef = doc(db, COLLECTION_NAME, advertisementId);
            await updateDoc(docRef, {
                ...formData,
                imageUrl: finalImageUrl, // 최종 이미지 URL 저장
                startDate: Timestamp.fromDate(new Date(formData.startDate)),
                endDate: Timestamp.fromDate(endDate),
                updatedAt: serverTimestamp(), // 수정 시간 기록
            });

            alert("광고 정보가 성공적으로 수정되었습니다.");
            router.push('/admin/advertisements');

        } catch (err) {
            console.error("Error updating advertisement: ", err);
            setError(`수정 중 오류 발생: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.formPageContainer}>
                <h1 className={styles.pageTitle}>광고 불러오는 중...</h1>
                <p>광고 정보를 가져오고 있습니다.</p>
            </div>
        );
    }

    return (
        <div className={styles.formPageContainer}>
            <h1 className={styles.pageTitle}>광고 수정</h1>
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
                    <button type="submit" className={styles.primaryButton} disabled={isSaving || isLoading || isUploadingDescriptionImage}>
                        {isSaving ? '저장 중...' : '수정'}
                    </button>
                    <button type="button" onClick={() => router.push('/admin/advertisements')} className={styles.secondaryButton} disabled={isSaving || isLoading || isUploadingDescriptionImage}>
                        목록
                    </button>
                </div>
            </form>
        </div>
    );
}