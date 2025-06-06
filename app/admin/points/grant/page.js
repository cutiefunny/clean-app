// /app/admin/points/grant/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../board.module.css'; // 공통 CSS Module 사용
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  runTransaction, // 원자적 업데이트를 위한 트랜잭션 임포트
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

const ITEMS_PER_PAGE = 10;
const CLEANERS_COLLECTION = "cleaners";
const HISTORY_COLLECTION = "pointHistory";

// 포인트 지급 모달 컴포넌트 (페이지 파일 하단 또는 별도 파일로 분리)
const PointGrantModal = ({ company, onClose, onGrant }) => {
    const [points, setPoints] = useState('');
    const [description, setDescription] = useState('관리자 직접 지급');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async () => {
        const grantAmount = parseInt(points, 10);
        if (isNaN(grantAmount) || grantAmount <= 0) {
            alert('유효한 포인트를 입력해주세요.');
            return;
        }
        
        // === 컨펌 팝업 추가 ===
        if (window.confirm('지급하면 되돌릴 수 없습니다. 그래도 포인트를 지급하시겠습니까?')) {
            setIsProcessing(true);
            try {
                await onGrant(grantAmount, description);
                // 성공 시에만 모달 닫기
                onClose(); 
            } catch (error) {
                // onGrant 함수에서 발생하는 에러를 여기서 처리하거나,
                // onGrant 함수 자체에서 alert 등으로 사용자에게 알릴 수 있습니다.
                // 이미 onGrant를 호출하는 handleGrantPoints에서 에러 처리를 하고 있으므로 여기서는 추가 작업이 필요 없을 수 있습니다.
            } finally {
                setIsProcessing(false);
            }
        }
        // 사용자가 "취소"를 누르면 아무 작업도 하지 않습니다.
        // =======================
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.pageTitle} style={{textAlign: 'center', marginBottom: '20px'}}>포인트 지급: {company.businessName}</h3>
                <div className={styles.formGroup}>
                    <label className={styles.label}>지급 포인트:</label>
                    <input
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        className={styles.input}
                        placeholder="지급할 포인트를 입력하세요"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>지급 내용:</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={styles.input}
                    />
                </div>
                <div className={styles.buttonContainer} style={{justifyContent: 'center', marginBottom: '20px'}}>
                    <button onClick={onClose} className={styles.secondaryButton} disabled={isProcessing}>닫기</button>
                    <button onClick={handleSubmit} className={styles.primaryButton} disabled={isProcessing}>
                        {isProcessing ? '처리 중...' : '지급'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function PointGrantPage() {
  const router = useRouter();
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 필터 상태
  const [filterType, setFilterType] = useState('청소업체명');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  // 포인트 지급 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false); // 일괄 지급 모달 상태
  const [selectedCompany, setSelectedCompany] = useState(null);

  // 디바운싱
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchCleaners = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const cleanersCollectionRef = collection(db, CLEANERS_COLLECTION);
      const conditions = [];

      // 검색 필터링
      if (debouncedSearchTerm) {
        // TODO: 실제 필드명에 맞게 수정 ('businessName', 'representativeName' 등)
        conditions.push(where('businessName', '>=', debouncedSearchTerm));
        conditions.push(where('businessName', '<=', debouncedSearchTerm + '\uf8ff'));
      }
      
      const dataQuery = query(cleanersCollectionRef, orderBy('businessName'), ...conditions);
      const querySnapshot = await getDocs(dataQuery);
      
      const docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastGrantDate: doc.data().lastGrantDate?.toDate ? doc.data().lastGrantDate.toDate() : null,
      }));

      setTotalItems(docsData.length); // 클라이언트 사이드 페이지네이션을 위한 전체 수
      const paginated = docsData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      setCleaners(paginated);

    } catch (err) {
      console.error(`Error fetching ${CLEANERS_COLLECTION}: `, err);
      setError(`업체 목록을 불러오는 중 오류 발생: ${err.message}. 색인 및 보안 규칙을 확인하세요.`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchCleaners();
  }, [fetchCleaners]);

  // *** 포인트 지급 트랜잭션 로직을 재사용 가능한 함수로 분리 ***
  const executeGrantTransaction = async (cleanerId, cleanerName, grantAmount, description) => {
    const cleanerRef = doc(db, CLEANERS_COLLECTION, cleanerId);
    const historyRef = doc(collection(db, HISTORY_COLLECTION));

    return runTransaction(db, async (transaction) => {
        const cleanerDoc = await transaction.get(cleanerRef);
        if (!cleanerDoc.exists()) throw new Error(`[${cleanerName}] 업체 정보를 찾을 수 없습니다.`);

        const currentPoints = Number(cleanerDoc.data().currentPoints) || 0;
        const newBalance = currentPoints + grantAmount;

        transaction.update(cleanerRef, { currentPoints: newBalance, lastGrantDate: serverTimestamp() });
        transaction.set(historyRef, {
            companyId: cleanerId,
            companyName: cleanerName,
            transactionType: '충전',
            points: grantAmount,
            pointsBalanceAfter: newBalance,
            description: description,
            createdAt: serverTimestamp()
        });
    });
  };

  const handleGrantPoints = (grantAmount, description) => {
    if (!selectedCompany) return;
    return executeGrantTransaction(selectedCompany.id, selectedCompany.businessName, grantAmount, description)
      .then(() => {
        alert(`${selectedCompany.businessName}에 ${grantAmount.toLocaleString()}포인트가 성공적으로 지급되었습니다.`);
        fetchCleaners();
      })
      .catch((e) => {
        console.error("Point grant transaction failed: ", e);
        setError(`포인트 지급 중 오류가 발생했습니다: ${e.message}`);
        throw e;
      });
  };

  // *** 새로운 일괄 지급 핸들러 ***
  const handleExecuteBatchGrant = async (grantAmount, description) => {
    const grantPromises = selectedIds.map(id => {
        const cleaner = cleaners.find(c => c.id === id) || allFetchedCleaners.find(c => c.id === id); // 현재 페이지 또는 전체 목록에서 찾기
        if (!cleaner) return Promise.reject(new Error(`ID ${id}에 해당하는 업체 정보를 찾을 수 없습니다.`));
        return executeGrantTransaction(id, cleaner.businessName, grantAmount, description);
    });

    try {
        await Promise.all(grantPromises);
        alert(`${selectedIds.length}개 업체에 포인트가 성공적으로 지급되었습니다.`);
        setSelectedIds([]); // 성공 후 선택 해제
        fetchCleaners();
    } catch (e) {
        console.error("Batch point grant failed for one or more items: ", e);
        alert(`일괄 지급 처리 중 일부 또는 전체 작업에 실패했습니다. 오류: ${e.message}`);
    }
  };

  // 나머지 핸들러 함수들
  const handleBatchGrant = () => {
    if (selectedIds.length === 0) {
      alert("포인트를 지급할 업체를 먼저 선택해주세요.");
      return;
    }
    setIsBatchModalOpen(true);
  };

  const openGrantModal = (company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };
  
  const closeGrantModal = () => setIsModalOpen(false);
  const closeBatchGrantModal = () => setIsBatchModalOpen(false);
  const handleEdit = (id) => router.push(`/admin/cleaners/members/${id}/edit`);
  const handleDelete = (id) => { /* ...삭제 로직... */ alert(`업체 ID ${id} 삭제 기능 구현 예정`); };
  const handleSelectAll = (e) => { setSelectedIds(e.target.checked ? cleaners.map(c => c.id) : []); };
  const handleSelectSingle = (e, id) => { setSelectedIds(prev => e.target.checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id)); };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('ko-KR');
  };

  return (
    <div className={styles.pageContainer}>
        {/* 개별 지급 모달 */}
      {isModalOpen && selectedCompany && ( <PointGrantModal company={selectedCompany} onClose={closeGrantModal} onGrant={handleGrantPoints} /> )}
      {/* 일괄 지급 모달 */}
      {isBatchModalOpen && (
                <BatchPointGrantModal
                    onClose={closeBatchGrantModal}
                    onGrant={handleExecuteBatchGrant}
                    selectedCount={selectedIds.length} // 선택된 업체 수 전달
                />
            )}
       
        
      <div className={styles.filterSection} style={{justifyContent: 'flex-start'}}>
        {/* TODO: 날짜 필터 추가 */}
        <div className={styles.filterGroup}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={styles.filterDropdown}>
            <option value="청소업체명">청소업체명</option>
            <option value="대표자명">대표자명</option>
          </select>
          <div className={styles.searchInputWrapper}>
             <input type="text" placeholder="검색" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} />
             {/* <SearchIconSvg className={styles.searchIcon} /> */}
          </div>
          <button className={styles.button}>검색</button>
        </div>
      </div>

      <div className={styles.actionButtonContainer}>
        <button onClick={handleBatchGrant} className={styles.primaryButton}>포인트 일괄 지급</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thCheckbox}><input type="checkbox" onChange={handleSelectAll} checked={cleaners.length > 0 && selectedIds.length === cleaners.length} /></th>
            <th className={styles.thNumber}>번호</th>
            <th className={styles.thLeft}>청소업체명</th>
            <th className={styles.th}>보유 포인트</th>
            <th className={styles.th}>마지막 지급일시</th>
            <th className={styles.thLeft}>지급내용</th>
            <th className={styles.th}>포인트 지급</th>
            <th className={styles.thActions}>관리</th>
          </tr>
        </thead>
        <tbody>
          {loading && (<tr><td colSpan={8} className={styles.centerTd}>로딩 중...</td></tr>)}
          {!loading && cleaners.length === 0 && (<tr><td colSpan={8} className={styles.centerTd}>업체 목록이 없습니다.</td></tr>)}
          {!loading && cleaners.length > 0 && (
            cleaners.map((cleaner, index) => (
              <tr key={cleaner.id}>
                <td className={styles.centerTd}><input type="checkbox" checked={selectedIds.includes(cleaner.id)} onChange={(e) => handleSelectSingle(e, cleaner.id)} /></td>
                <td className={styles.centerTd}>{(totalItems - ((currentPage - 1) * ITEMS_PER_PAGE)) - index}</td>
                <td className={styles.tdLeft}>{cleaner.businessName}</td>
                <td className={styles.centerTd}>{(cleaner.currentPoints || 0).toLocaleString()}</td>
                <td className={styles.centerTd}>{formatDate(cleaner.lastGrantDate)}</td>
                <td className={styles.tdLeft}>{/* 최근 지급내용 표시 로직 필요 */}</td>
                <td className={styles.centerTd}>
                    <button className={styles.primaryButton} style={{padding: '5px 12px'}} onClick={() => openGrantModal(cleaner)}>지급</button>
                </td>
                <td >
                  <div className={styles.actionTdInnerDiv}>
                    <button onClick={() => handleEdit(cleaner.id)} className={`${styles.button}`} style={{backgroundColor: '#5cb85c', color: 'white'}}>수정</button>
                    <button onClick={() => handleDelete(cleaner.id)} className={`${styles.button}`} style={{backgroundColor: '#d9534f', color: 'white'}}>삭제</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {!loading && totalPages > 1 && (
        <div className={styles.paginationContainer}>
            {/* 페이지네이션 컴포넌트 JSX */}
        </div>
      )}
    </div>
  );
}

// *** 새로운 일괄 포인트 지급 모달 컴포넌트 ***
const BatchPointGrantModal = ({ onClose, onGrant, selectedCount }) => { // 선택된 개수를 표시하기 위해 selectedCount prop 추가
    const [points, setPoints] = useState('');
    const [description, setDescription] = useState('관리자 일괄 지급'); // "지급 내용" 상태 추가
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async () => {
        const grantAmount = parseInt(points, 10);
        if (isNaN(grantAmount) || grantAmount <= 0) {
            alert('유효한 포인트를 입력해주세요.');
            return;
        }
        if (window.confirm(`선택된 ${selectedCount}개 업체에 포인트를 지급합니다.\n\n지급하면 되돌릴 수 없습니다. 그래도 포인트를 지급하시겠습니까?`)) {
            setIsProcessing(true);
            try {
                // onGrant 함수에 description 값도 함께 전달
                await onGrant(grantAmount, description);
                onClose();
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* 제목 스타일 및 내용 변경 */}
                <h3 className={styles.pageTitle} style={{textAlign: 'center', marginBottom: '20px'}}>
                    포인트 일괄 지급 ({selectedCount}개 업체)
                </h3>
                
                {/* "지급 포인트" 입력 필드 그룹 */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>지급 포인트:</label>
                    <input
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        className={styles.input}
                        placeholder="일괄 지급할 포인트를 입력하세요"
                    />
                </div>
                
                {/* "지급 내용" 입력 필드 그룹 추가 */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>지급 내용:</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={styles.input}
                    />
                </div>
                
                {/* 버튼 컨테이너 스타일 수정 */}
                <div className={styles.buttonContainer} style={{justifyContent: 'center', marginBottom: '20px'}}> 
                    <button onClick={onClose} className={styles.secondaryButton} disabled={isProcessing}>닫기</button>
                    <button onClick={handleSubmit} className={styles.primaryButton} disabled={isProcessing}>
                        {isProcessing ? '처리 중...' : '지급'}
                    </button>
                </div>
            </div>
        </div>
    );
};
