// /app/admin/requests/pending/[id]/page.jsx (수정 예시)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
// Image 컴포넌트는 현재 사용되지 않지만, 만약 사진 필드가 있다면 필요
// import Image from 'next/image';
import { doc, getDoc, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore'; // updateDoc, serverTimestamp 추가 (수정 기능 대비)
import { db, auth } from '@/lib/firebase/clientApp';
import styles from '../../../board.module.css'; // 경로 확인
import CompanySelectModal from '@/components/admin/CompanySelectModal';
import useKakaoTalkSend from '@/hooks/useKakaoTalkSend';

// [추가] 관리자 알림톡 템플릿 ID
const ALIMTALK_TEMPLATE_ID = 'KA01TP250619092249838Moxlcsddycx';

const COLLECTION_NAME = "requests";

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id;

  const [requestDetail, setRequestDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false); // 수정 모드 상태
  const [formData, setFormData] = useState({}); // 수정용 폼 데이터 상태
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // useKakaoTalkSend 훅 사용
      const { sendKakaoTalk, loading: kakaoLoading, error: kakaoError } = useKakaoTalkSend();
      const [sentCodeFromServer, setSentCodeFromServer] = useState('');

  const fetchRequestDetail = useCallback(async () => {
    // ... (기존 fetchRequestDetail 로직은 동일) ...
    if (!requestId) {
      setError("잘못된 접근입니다. 신청 ID가 없습니다.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, COLLECTION_NAME, requestId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const processedData = { // 모든 필드를 여기서 적절히 처리
            id: docSnap.id,
            field: data.field || '',
            requestDate: data.requestDate?.toDate ? data.requestDate.toDate() : null, // JS Date 객체
            requestTimeSlot: data.requestTimeSlot || '',
            address: data.address || '',
            buildingType: data.buildingType || '',
            areaSize: data.areaSize || '',
            spaceInfo: data.spaceInfo || '',
            applicantName: data.applicantName || '',
            applicantContact: data.applicantContact || '',
            inquiryNotes: data.inquiryNotes || '',
            status: data.status || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null, // JS Date 객체
            // ... 만약 data에 다른 Timestamp 필드가 있다면 여기서 .toDate() 처리 ...
            // 예: someOtherTimestamp: data.someOtherTimestamp?.toDate ? data.someOtherTimestamp.toDate() : null,
        };
        setRequestDetail(processedData);
        // 폼 데이터에는 문자열 등 input value에 적합한 형태로 저장
        setFormData({
            ...processedData,
            // 날짜 필드는 input[type="date"] 형식(YYYY-MM-DD) 또는 formatDate를 사용한 문자열로 변환
            requestDate: processedData.requestDate ? new Date(processedData.requestDate).toISOString().split('T')[0] : '',
            createdAt: processedData.createdAt ? formatDate(processedData.createdAt, true) : '', // 예시: createdAt을 문자열로
            // someOtherTimestamp: processedData.someOtherTimestamp ? formatDate(processedData.someOtherTimestamp) : '',
        });
      } else {
        setError("해당 신청 내역을 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("Error fetching request detail: ", err);
      setError(`신청 내역을 불러오는 중 오류 발생: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequestDetail();
  }, [fetchRequestDetail]);

  const handleGoToList = () => {
    router.push('/admin/requests/pending');
  };

  const handleSelectCompany = () => {
    setIsCompanyModalOpen(true);
  };

  // [수정] 모달에서 다중 선택된 업체 목록을 처리하는 핸들러
  const handleCompanySelected = async (selectedCompanies) => {
    if (!selectedCompanies || selectedCompanies.length === 0) {
      alert('업체를 하나 이상 선택해주세요.');
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, requestId);
      
      // 선택된 업체들의 정보를 {id, name} 형태의 배열로 가공
      const assignedCompaniesData = selectedCompanies.map(c => ({
        id: c.id,
        name: c.name
      }));
      
      await updateDoc(docRef, {
        assignedCompanies: assignedCompaniesData, // 업체 배열 저장
        status: '전송' // 상태 변경
      });

      const companyNames = selectedCompanies.map(c => c.name).join(', ');

      //알림톡 발송
      const templateVariables = {
      '#{홍길동}': requestDetail.applicantName, // 신청자 이름
      };

      const phoneNumber = requestDetail.applicantContact; // 신청자의 연락처
        const result = await sendKakaoTalk(phoneNumber, ALIMTALK_TEMPLATE_ID, templateVariables);
    
        if (result && result.success) {
          console.log('알림톡 발송 성공:', result);
        } else {
          console.error('알림톡 발송 실패:', result);
        }


      alert(`'${companyNames}'으로 매칭(전송)이 완료되었습니다.`);
      
      setIsCompanyModalOpen(false); // 모달 닫기
      fetchRequestDetail(); // 변경된 데이터 다시 불러오기
    } catch (err) {
      console.error("Error updating company assignment: ", err);
      alert('업체 배정 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (date, includeTime = false) => {
    // ... (기존 formatDate 로직은 동일) ...
    if (!date) return 'N/A';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false; // 24시간제
    }
    try {
        return new Date(date).toLocaleDateString('ko-KR', options).replace(/\. /g, '.').replace(/\.$/, '');
    } catch (e) {
        return 'Invalid Date';
    }
  };
  
  // --- 예시: 수정 기능 관련 핸들러 ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleEditMode = () => {
    if (isEditing && requestDetail) {
        // 수정 취소 시 원본 데이터로 복구
        setFormData(requestDetail);
    }
    setIsEditing(!isEditing);
    setError(''); // 에러 메시지 초기화
  };

  const handleSaveChanges = async () => {
    if (!requestId || !auth.currentUser) {
        setError("수정 권한이 없거나 잘못된 요청입니다.");
        return;
    }
    // TODO: 유효성 검사 추가
    try {
        const docRef = doc(db, COLLECTION_NAME, requestId);
        const dataToUpdate = { ...formData };
        // id는 업데이트 대상에서 제외, Timestamp 필드는 다시 변환
        delete dataToUpdate.id; 
        if (formData.requestDate) {
            dataToUpdate.requestDate = Timestamp.fromDate(new Date(formData.requestDate));
        }
        if (formData.createdAt && !(formData.createdAt instanceof Timestamp)) { // 생성일은 보통 수정하지 않지만, 예시로 포함
            // dataToUpdate.createdAt = Timestamp.fromDate(new Date(formData.createdAt));
        }
        dataToUpdate.updatedAt = serverTimestamp(); // 수정 시간 업데이트
        dataToUpdate.updatedBy = auth.currentUser.uid; // 수정한 관리자 UID

        await updateDoc(docRef, dataToUpdate);
        alert("수정사항이 저장되었습니다.");
        setIsEditing(false);
        fetchRequestDetail(); // 데이터 다시 불러오기
    } catch (err) {
        console.error("Error updating request: ", err);
        setError("수정 중 오류가 발생했습니다: " + err.message);
    }
  };
  // --- 예시: 수정 기능 관련 핸들러 끝 ---


  if (loading) {
    return <div className={styles.pageContainer}><p className={styles.loadingText}>신청 내역을 불러오는 중...</p></div>;
  }
  if (error && !requestDetail) { // 에러가 있고, requestDetail이 아직 없으면(로딩 실패 등) 에러만 표시
    return <div className={styles.pageContainer}><p className={styles.errorText}>{error}</p></div>;
  }
  if (!requestDetail) {
    return <div className={styles.pageContainer}><p className={styles.emptyText}>신청 내역 정보가 없습니다.</p></div>;
  }

  return (
    <div className={styles.detailPageContainer}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1 className={styles.pageTitle}>청소신청 상세 보기</h1>
        {/* 예시: 수정 버튼 추가 */}
        {!isEditing && (
            <button onClick={handleToggleEditMode} className={styles.button} style={{marginBottom: '25px'}}>정보 수정</button>
        )}
      </div>


      {/* isEditing 상태에 따라 다른 UI 표시 */}
      {isEditing ? (
        // === 수정 모드 ===
        <div className={styles.form}> {/* board.module.css의 .form 스타일 재활용 */}
            <div className={styles.formGroup}>
                <label htmlFor="field" className={styles.label}>희망서비스</label>
                <input type="text" id="field" name="field" value={formData.field || ''} onChange={handleInputChange} className={styles.input}/>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="requestDate" className={styles.label}>희망일</label>
                {/* 날짜 입력은 type="date"를 사용하고, 값은 YYYY-MM-DD 형식이어야 함 */}
                <input type="date" id="requestDate" name="requestDate" value={formData.requestDate ? new Date(formData.requestDate).toISOString().split('T')[0] : ''} onChange={handleInputChange} className={styles.input}/>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="requestTimeSlot" className={styles.label}>희망시간대</label>
                <input type="text" id="requestTimeSlot" name="requestTimeSlot" value={formData.requestTimeSlot || ''} onChange={handleInputChange} className={styles.input}/>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="address" className={styles.label}>주소</label>
                <input type="text" id="address" name="address" value={formData.address || ''} onChange={handleInputChange} className={styles.input}/>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="buildingType" className={styles.label}>건물형태</label>
                <input type="text" id="buildingType" name="buildingType" value={formData.buildingType || ''} onChange={handleInputChange} className={styles.input}/>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="areaSize" className={styles.label}>평수</label>
                <input type="number" id="areaSize" name="areaSize" value={formData.areaSize || ''} onChange={handleInputChange} className={styles.input}/>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="spaceInfo" className={styles.label}>공간정보</label>
                <input type="text" id="spaceInfo" name="spaceInfo" value={formData.spaceInfo || ''} onChange={handleInputChange} className={styles.input}/>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="applicantName" className={styles.label}>이름</label>
                <input type="text" id="applicantName" name="applicantName" value={formData.applicantName || ''} onChange={handleInputChange} className={styles.input}/>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="applicantContact" className={styles.label}>휴대폰번호</label>
                <input type="tel" id="applicantContact" name="applicantContact" value={formData.applicantContact || ''} onChange={handleInputChange} className={styles.input}/>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="inquiryNotes" className={styles.label}>청소관련 문의</label>
                <textarea id="inquiryNotes" name="inquiryNotes" value={formData.inquiryNotes || ''} onChange={handleInputChange} className={styles.textarea}/> {/* .textarea 스타일 필요 */}
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="status" className={styles.label}>상태</label>
                {/* 상태 변경은 드롭다운이나 다른 UI로 하는 것이 좋을 수 있음 */}
                <input type="text" id="status" name="status" value={formData.status || ''} onChange={handleInputChange} className={styles.input}/>
            </div>
            {error && <p className={styles.errorText} style={{marginTop: '10px'}}>{error}</p>}
            <div className={styles.buttonContainer} style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={handleToggleEditMode} className={styles.secondaryButton}>취소</button>
                <button type="button" onClick={handleSaveChanges} className={styles.primaryButton}>변경사항 저장</button>
            </div>
        </div>
      ) : (
        // === 상세 보기 모드 ===
        <>
          <div className={styles.detailGrid}>
            <div className={styles.detailLabel}>희망서비스</div>
            <div className={styles.detailValue}>{requestDetail.field || '정보 없음'}</div>

            <div className={styles.detailLabel}>희망일</div>
            <div className={styles.detailValue}>{formatDate(requestDetail.requestDate)}</div>

            <div className={styles.detailLabel}>희망시간대</div>
            <div className={styles.detailValue}>{requestDetail.requestTimeSlot || '정보 없음'}</div>

            <div className={styles.detailLabel}>주소</div>
            <div className={styles.detailValue}>{requestDetail.address || '정보 없음'}</div>

            <div className={styles.detailLabel}>건물형태</div>
            <div className={styles.detailValue}>{requestDetail.buildingType || '정보 없음'}</div>

            <div className={styles.detailLabel}>평수</div>
            <div className={styles.detailValue}>{requestDetail.areaSize ? `${requestDetail.areaSize}평` : '정보 없음'}</div>

            <div className={styles.detailLabel}>공간정보</div>
            <div className={styles.detailValue}>{requestDetail.spaceInfo || '정보 없음'}</div>
            
            <div className={styles.detailLabel}>이름</div>
            <div className={styles.detailValue}>{requestDetail.applicantName || '정보 없음'}</div>

            <div className={styles.detailLabel}>휴대폰번호</div>
            <div className={styles.detailValue}>{requestDetail.applicantContact || '정보 없음'}</div>

            <div className={styles.detailLabel} style={{alignSelf: 'flex-start'}}>청소관련 문의</div>
            <div className={styles.detailValue} style={{whiteSpace: 'pre-wrap'}}>{requestDetail.inquiryNotes || '내용 없음'}</div>
            
            <div className={styles.detailLabel}>상태</div>
            <div className={styles.detailValue} style={{color: requestDetail.status === '전송대기' ? '#dc3545' : (requestDetail.status === '전송' ? '#28a745' : '#6c757d'), fontWeight: 'bold'}}>
                {requestDetail.status || '정보 없음'}
            </div>

            <div className={styles.detailLabel}>적용매장</div>
            <div className={styles.detailValue}>
              {requestDetail.assignedCompanies && requestDetail.assignedCompanies.length > 0
                ? requestDetail.assignedCompanies.map(c => c.name).join(', ')
                : '미배정'}
            </div>

            {/* 신청등록일 추가 표시 예시 */}
            <div className={styles.detailLabel}>신청등록일</div>
            <div className={styles.detailValue}>{formatDate(requestDetail.createdAt, true)}</div>
          </div>

          <div className={styles.buttonContainer} style={{ justifyContent: 'flex-end', marginTop: '30px' }}>
            <button onClick={handleSelectCompany} className={styles.primaryButton}>
              적용매장 선택
            </button>
            <button onClick={handleGoToList} className={styles.secondaryButton}>
              목록
            </button>
          </div>
        </>
      )}
      <CompanySelectModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSelect={handleCompanySelected}
      />
    </div>
  );
}