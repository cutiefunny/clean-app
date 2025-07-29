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
import { useAuth } from '../../../context/AuthContext'; // 인증 컨텍스트

const ITEMS_PER_PAGE = 10;
const CLEANERS_COLLECTION = "cleaners";
const HISTORY_COLLECTION = "pointHistory";

// 포인트 지급/회수 모달 컴포넌트
const PointGrantModal = ({ company, onClose, onGrant }) => {
  const [points, setPoints] = useState('');
  const [description, setDescription] = useState('관리자 직접 지급');
  const [transactionType, setTransactionType] = useState('grant'); // 'grant' 또는 'redeem'
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    const amount = parseInt(points, 10);
    if (isNaN(amount) || amount <= 0) {
      alert('유효한 포인트를 입력해주세요.');
      return;
    }
    
    let confirmMessage = '';
    if (transactionType === 'grant') {
      confirmMessage = `[${company.businessName}]에 ${amount.toLocaleString()}포인트를 지급합니다.\n\n지급하면 되돌릴 수 없습니다. 그래도 포인트를 지급하시겠습니까?`;
    } else { // 'redeem'
      confirmMessage = `[${company.businessName}]에서 ${amount.toLocaleString()}포인트를 회수합니다.\n\n회수하면 되돌릴 수 없습니다. 그래도 포인트를 회수하시겠습니까?`;
    }

    if (window.confirm(confirmMessage)) {
      setIsProcessing(true);
      try {
        await onGrant(amount, description, transactionType); // transactionType 전달
        onClose(); 
      } catch (error) {
        // onGrant 함수에서 발생하는 에러를 여기서 처리하거나,
        // onGrant 함수 자체에서 alert 등으로 사용자에게 알릴 수 있습니다.
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.pageTitle} style={{textAlign: 'center', marginBottom: '20px'}}>포인트 {transactionType === 'grant' ? '지급' : '회수'}: {company.businessName}</h3>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>작업 선택:</label>
          <div style={{ display: 'flex', gap: '15px', marginTop: '5px', marginBottom: '10px' }}>
            <label>
              <input
                type="radio"
                name="transactionType"
                value="grant"
                checked={transactionType === 'grant'}
                onChange={() => setTransactionType('grant')}
                disabled={isProcessing}
              /> 지급
            </label>
            <label>
              <input
                type="radio"
                name="transactionType"
                value="redeem"
                checked={transactionType === 'redeem'}
                onChange={() => setTransactionType('redeem')}
                disabled={isProcessing}
              /> 회수
            </label>
          </div>
        </div>

        <div className={styles.formGroup} style={{ display: 'flex', gap: '15px', marginTop: '5px', marginBottom: '10px' }}>
          <label className={styles.label}>{transactionType === 'grant' ? '지급' : '회수'} 포인트:</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className={styles.input}
            placeholder={transactionType === 'grant' ? '지급할 포인트를 입력하세요' : '회수할 포인트를 입력하세요'}
            disabled={isProcessing}
          />
        </div>
        <div className={styles.formGroup} style={{ display: 'flex', gap: '15px', marginTop: '5px', marginBottom: '10px' }}>
          <label className={styles.label}>내용:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.input}
            disabled={isProcessing}
          />
        </div>
        <div className={styles.buttonContainer} style={{justifyContent: 'center', marginBottom: '20px'}}>
          <button onClick={onClose} className={styles.secondaryButton} disabled={isProcessing}>닫기</button>
          <button onClick={handleSubmit} className={styles.primaryButton} disabled={isProcessing}>
            {isProcessing ? '처리 중...' : (transactionType === 'grant' ? '지급' : '회수')}
          </button>
        </div>
      </div>
    </div>
  );
};

// 일괄 포인트 지급/회수 모달 컴포넌트
const BatchPointGrantModal = ({ onClose, onGrant, selectedCount }) => {
  const [points, setPoints] = useState('');
  const [description, setDescription] = useState('관리자 일괄 지급');
  const [transactionType, setTransactionType] = useState('grant'); // 'grant' 또는 'redeem'
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    const amount = parseInt(points, 10);
    if (isNaN(amount) || amount <= 0) {
      alert('유효한 포인트를 입력해주세요.');
      return;
    }

    let confirmMessage = '';
    if (transactionType === 'grant') {
      confirmMessage = `선택된 ${selectedCount}개 업체에 ${amount.toLocaleString()}포인트를 일괄 지급합니다.\n\n지급하면 되돌릴 수 없습니다. 그래도 포인트를 지급하시겠습니까?`;
    } else { // 'redeem'
      confirmMessage = `선택된 ${selectedCount}개 업체에서 ${amount.toLocaleString()}포인트를 일괄 회수합니다.\n\n회수하면 되돌릴 수 없습니다. 그래도 포인트를 회수하시겠습니까?`;
    }

    if (window.confirm(confirmMessage)) {
      setIsProcessing(true);
      try {
        await onGrant(amount, description, transactionType); // transactionType 전달
        onClose();
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.pageTitle} style={{textAlign: 'center', marginBottom: '20px'}}>
          포인트 일괄 {transactionType === 'grant' ? '지급' : '회수'} ({selectedCount}개 업체)
        </h3>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>작업 선택:</label>
          <div style={{ display: 'flex', gap: '15px', marginTop: '5px', marginBottom: '10px' }}>
            <label>
              <input
                type="radio"
                name="batchTransactionType"
                value="grant"
                checked={transactionType === 'grant'}
                onChange={() => setTransactionType('grant')}
                disabled={isProcessing}
              /> 지급
            </label>
            <label>
              <input
                type="radio"
                name="batchTransactionType"
                value="redeem"
                checked={transactionType === 'redeem'}
                onChange={() => setTransactionType('redeem')}
                disabled={isProcessing}
              /> 회수
            </label>
          </div>
        </div>

        <div className={styles.formGroup} style={{ display: 'flex', gap: '15px', marginTop: '5px', marginBottom: '10px' }}>
          <label className={styles.label}>{transactionType === 'grant' ? '지급' : '회수'} 포인트:</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className={styles.input}
            placeholder={transactionType === 'grant' ? '일괄 지급할 포인트를 입력하세요' : '일괄 회수할 포인트를 입력하세요'}
            disabled={isProcessing}
          />
        </div>
        
        <div className={styles.formGroup} style={{ display: 'flex', gap: '15px', marginTop: '5px', marginBottom: '10px' }}>
          <label className={styles.label}>내용:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.input}
            disabled={isProcessing}
          />
        </div>
        
        <div className={styles.buttonContainer} style={{justifyContent: 'center', marginBottom: '20px'}}> 
          <button onClick={onClose} className={styles.secondaryButton} disabled={isProcessing}>닫기</button>
          <button onClick={handleSubmit} className={styles.primaryButton} disabled={isProcessing}>
            {isProcessing ? '처리 중...' : (transactionType === 'grant' ? '지급' : '회수')}
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
  const { permissions, isSuperAdmin } = useAuth();
  const canEdit = !loading && (isSuperAdmin || permissions?.requests === 'edit');

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

  // *** 포인트 지급/회수 트랜잭션 로직을 재사용 가능한 함수로 분리 ***
  const executeGrantTransaction = async (cleanerId, cleanerName, amount, description, type) => { // type 파라미터 추가
    const cleanerRef = doc(db, CLEANERS_COLLECTION, cleanerId);
    const historyRef = doc(collection(db, HISTORY_COLLECTION));

    return runTransaction(db, async (transaction) => {
      const cleanerDoc = await transaction.get(cleanerRef);
      if (!cleanerDoc.exists()) throw new Error(`[${cleanerName}] 업체 정보를 찾을 수 없습니다.`);

      const currentPoints = Number(cleanerDoc.data().currentPoints) || 0;
      let newBalance;

      if (type === 'grant') {
        newBalance = currentPoints + amount;
      } else if (type === 'redeem') {
        if (currentPoints < amount) {
          throw new Error(`[${cleanerName}]의 보유 포인트(${currentPoints.toLocaleString()})가 회수 요청 포인트(${amount.toLocaleString()})보다 적습니다.`);
        }
        newBalance = currentPoints - amount;
      } else {
        throw new Error('유효하지 않은 트랜잭션 타입입니다.');
      }

      transaction.update(cleanerRef, { currentPoints: newBalance, lastGrantDate: serverTimestamp() });
      transaction.set(historyRef, {
        companyId: cleanerId,
        companyName: cleanerName,
        transactionType: type === 'grant' ? '충전' : '회수', // 기록될 타입
        points: type === 'redeem' ? -amount : amount, // '회수'일 경우 amount를 음수로 저장
        pointsBalanceAfter: newBalance,
        description: description,
        createdAt: serverTimestamp()
      });
    });
  };

  const handleGrantPoints = (amount, description, type) => { // type 파라미터 추가
    if (!selectedCompany) return;
    return executeGrantTransaction(selectedCompany.id, selectedCompany.businessName, amount, description, type) // type 전달
      .then(() => {
        alert(`${selectedCompany.businessName}에 ${amount.toLocaleString()}포인트가 성공적으로 ${type === 'grant' ? '지급' : '회수'}되었습니다.`);
        fetchCleaners();
      })
      .catch((e) => {
        console.error("Point transaction failed: ", e);
        setError(`포인트 ${type === 'grant' ? '지급' : '회수'} 중 오류가 발생했습니다: ${e.message}`);
        throw e;
      });
  };

  // *** 새로운 일괄 지급/회수 핸들러 ***
  const handleExecuteBatchGrant = async (amount, description, type) => { // type 파라미터 추가
    const grantPromises = selectedIds.map(id => {
      const cleaner = cleaners.find(c => c.id === id); // 현재 페이지에서만 찾음
      if (!cleaner) return Promise.reject(new Error(`ID ${id}에 해당하는 업체 정보를 찾을 수 없습니다.`));
      return executeGrantTransaction(id, cleaner.businessName, amount, description, type); // type 전달
    });

    try {
      await Promise.all(grantPromises);
      alert(`${selectedIds.length}개 업체에 포인트가 성공적으로 ${type === 'grant' ? '지급' : '회수'}되었습니다.`);
      setSelectedIds([]); // 성공 후 선택 해제
      fetchCleaners();
    } catch (e) {
      console.error("Batch point transaction failed for one or more items: ", e);
      alert(`일괄 ${type === 'grant' ? '지급' : '회수'} 처리 중 일부 또는 전체 작업에 실패했습니다. 오류: ${e.message}`);
    }
  };

  // 나머지 핸들러 함수들
  const handleBatchGrant = () => {
    if (selectedIds.length === 0) {
      alert("포인트를 지급/회수할 업체를 먼저 선택해주세요.");
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
      {/* 개별 지급/회수 모달 */}
      {isModalOpen && selectedCompany && ( <PointGrantModal company={selectedCompany} onClose={closeGrantModal} onGrant={handleGrantPoints} /> )}
      {/* 일괄 지급/회수 모달 */}
      {isBatchModalOpen && (
        <BatchPointGrantModal
          onClose={closeBatchGrantModal}
          onGrant={handleExecuteBatchGrant}
          selectedCount={selectedIds.length}
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

      { canEdit && (
        <div className={styles.actionButtonContainer}>
          <button onClick={handleBatchGrant} className={styles.primaryButton}>포인트 일괄 지급/회수</button>
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thCheckbox}><input type="checkbox" onChange={handleSelectAll} checked={cleaners.length > 0 && selectedIds.length === cleaners.length} /></th>
            <th className={styles.thNumber}>번호</th>
            <th className={styles.thLeft}>청소업체명</th>
            <th className={styles.th}>보유 포인트</th>
            <th className={styles.th}>마지막 지급일시</th>
            <th className={styles.thLeft}>지급내용</th>
            { canEdit && (
              <th className={styles.th}>포인트 지급/회수</th>
            )}
            { canEdit && (
            <th className={styles.thActions}>관리</th>
            )}
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
                { canEdit && (<td className={styles.centerTd}>
                    <button className={styles.primaryButton} style={{padding: '5px 12px'}} onClick={() => openGrantModal(cleaner)}>지급/회수</button> {/* 버튼 텍스트 변경 */}
                </td>)}
                { canEdit && (
                <td >
                  <div className={styles.actionTdInnerDiv}>
                    <button onClick={() => handleEdit(cleaner.id)} className={`${styles.button}`} style={{backgroundColor: '#5cb85c', color: 'white'}}>수정</button>
                    <button onClick={() => handleDelete(cleaner.id)} className={`${styles.button}`} style={{backgroundColor: '#d9534f', color: 'white'}}>삭제</button>
                  </div>
                </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {!loading && totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={styles.pageButton}>&lt;</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => setCurrentPage(page)} className={`${styles.pageButton} ${currentPage === page ? styles.pageButtonActive : ''}`}>{page}</button>
          ))}
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={styles.pageButton}>&gt;</button>
        </div>
      )}
    </div>
  );
}