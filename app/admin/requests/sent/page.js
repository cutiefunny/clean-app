// /app/admin/requests/sent/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../board.module.css'; // 공통 CSS Module (경로 확인!)
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getCountFromServer,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useAuth } from '@/app/context/AuthContext';

const SearchIconSvg = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

const ITEMS_PER_PAGE = 10;
// "배정업체명" 필터 옵션 (Firestore의 실제 업체명 데이터나 '전체' 등으로 구성)
const ASSIGNED_COMPANY_OPTIONS = ["전체", "A업체", "B업체", "C청소"];
const COLLECTION_NAME = "requests";
const STATUS_SENT = "전송"; // Firestore에 저장된 실제 '전송 완료' 상태값으로 변경 필요

export default function SentRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { permissions, isSuperAdmin } = useAuth();
  const canEdit = !loading && (isSuperAdmin || permissions?.requests === 'edit');

  const [selectedAssignedCompany, setSelectedAssignedCompany] = useState(ASSIGNED_COMPANY_OPTIONS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchSentRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const requestsCollectionRef = collection(db, COLLECTION_NAME);
      const conditions = [];

      // 1. **필수 필터**: status가 "전송"인 문서만 가져옴
      conditions.push(where('status', '==', STATUS_SENT));

      // 2. 배정업체명 필터링
      if (selectedAssignedCompany !== "전체") {
        conditions.push(where('assignedCompanyName', '==', selectedAssignedCompany));
      }

      // 3. 검색어 필터링 (신청자명 기준 "시작 문자열" 검색 예시)
      if (debouncedSearchTerm) {
        const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
        conditions.push(where('applicantName', '>=', lowerSearchTerm));
        conditions.push(where('applicantName', '<=', lowerSearchTerm + '\uf8ff'));
      }

      const dataQueryConstraints = [orderBy('requestDate', 'desc'), ...conditions];
      let dataQuery = query(requestsCollectionRef, ...dataQueryConstraints);
      
      const countQuery = query(requestsCollectionRef, ...conditions);
      const snapshotCount = await getCountFromServer(countQuery);
      setTotalItems(snapshotCount.data().count);

      const querySnapshot = await getDocs(dataQuery);
      let docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestDate: doc.data().requestDate?.toDate ? doc.data().requestDate.toDate() : new Date(doc.data().requestDate),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
      }));

      const paginatedRequests = docsData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      setRequests(paginatedRequests);

    } catch (err) {
      console.error(`Error fetching ${COLLECTION_NAME} (sent): `, err);
      setError(`데이터를 불러오는 중 오류가 발생했습니다. Firestore 색인 및 보안 규칙을 확인해주세요. 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedAssignedCompany, debouncedSearchTerm]);

  useEffect(() => {
    fetchSentRequests();
  }, [fetchSentRequests]);

  const handleSearch = () => {
    setDebouncedSearchTerm(searchTerm); 
    setCurrentPage(1);
  };

  const handleExcelDownload = async () => {
    // TODO: 엑셀 다운로드 로직 (이전 답변의 exceljs 로직 참고)
    alert('엑셀 다운로드 기능 구현 예정입니다.');
  };

  const handleViewAssignedCompany = (companyName, companyId) => {
    // TODO: 배정된 업체 상세 정보 보기 로직 (모달 또는 페이지 이동)
    alert(`선택된 적용매장: ${companyName} (ID: ${companyId || 'N/A'}) - 상세 보기 기능 구현 예정`);
  };

  const handleEdit = (id) => {
    // "전송" 상태의 요청에 대한 수정/상세보기 페이지로 이동
    // 필요에 따라 경로를 /admin/requests/sent/[id]/edit 또는 /admin/requests/view/[id] 등으로 변경
    router.push(`/admin/requests/sent/${id}`); 
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('정말로 이 신청 건을 삭제하시겠습니까? (이미 전송된 건입니다)')) {
      try {
        const requestDocRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(requestDocRef);
        fetchSentRequests(); 
      } catch (err) {
        console.error(`Error deleting request ${id}: `, err);
        setError(`삭제 중 오류 발생: ${err.message}`);
      }
    }
  };
  
  const handleSelectAll = (e) => { setSelectedIds(e.target.checked ? requests.map(r => r.id) : []); };
  const handleSelectSingle = (e, id) => { setSelectedIds(prev => e.target.checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id)); };
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className={styles.pageContainer}>
      {/* 필터 및 검색 영역 */}
      <div className={styles.filterSection} style={{justifyContent: 'flex-start', marginBottom: '10px'}}>
        <div className={styles.filterGroup}>
          <label htmlFor="assignedCompanyFilter">배정업체명:</label>
          <select id="assignedCompanyFilter" value={selectedAssignedCompany} onChange={(e) => { setSelectedAssignedCompany(e.target.value); setCurrentPage(1);}} className={styles.filterDropdown}>
            {ASSIGNED_COMPANY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className={styles.searchInputContainer} style={{maxWidth: '400px'}}>
          <div className={styles.searchInputWrapper}>
            <input type="text" id="searchTerm" placeholder="신청자명, 연락처(하이픈 제외)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput}/>
            <SearchIconSvg className={styles.searchIcon} />
          </div>
          <button onClick={handleSearch} className={styles.button}>검색</button>
        </div>
      </div>
      
      {/* 액션 버튼 영역 */}
      <div className={styles.filterSection} style={{justifyContent: 'space-between'}}>
        <button onClick={handleExcelDownload} className={styles.button}>엑셀 다운</button>
        { canEdit && (
          <button className={styles.primaryButton} disabled={true} title="이미 전송된 내역입니다.">일괄 매칭 선택 적용</button>
        )}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thCheckbox}><input type="checkbox" onChange={handleSelectAll} checked={requests.length > 0 && selectedIds.length === requests.length} /></th>
            <th className={styles.thNumber}>번호</th>
            <th className={styles.th}>분야</th>
            <th className={styles.th}>적용매장</th>
            <th className={styles.thLeft}>신청자명</th>
            <th className={styles.th}>신청자 연락처</th>
            <th className={styles.th}>상태</th>
            {canEdit && <th className={styles.thActions}>관리</th>}
          </tr>
        </thead>
        <tbody>
          {loading && ( <tr><td colSpan={8} className={styles.centerTd}>로딩 중...</td></tr> )}
          {!loading && requests.length === 0 && ( <tr><td colSpan={8} className={styles.centerTd}>"전송" 상태의 신청 내역이 없습니다.</td></tr> )}
          {!loading && requests.length > 0 && (
            requests.map((req, index) => (
              <tr key={req.id}>
                <td className={styles.centerTd}><input type="checkbox" checked={selectedIds.includes(req.id)} onChange={(e) => handleSelectSingle(e, req.id)} /></td>
                <td className={styles.centerTd}>{(totalItems - ((currentPage - 1) * ITEMS_PER_PAGE)) - index}</td>
                <td className={styles.td}>{req.field}</td>
                <td className={styles.td}>
                  {req.assignedCompanyName && req.assignedCompanyName !== '-' ? (
                    <button 
                      onClick={() => handleViewAssignedCompany(req.assignedCompanyName, req.assignedCompanyId)} 
                      className={styles.button} 
                      style={{padding: '3px 8px', fontSize: '12px', backgroundColor: '#007bff', color: 'white'}}
                    >
                      확인
                    </button>
                  ) : '-'}
                </td>
                <td className={styles.tdLeft}>{req.applicantName}</td>
                <td className={styles.centerTd}>{req.applicantContact}</td>
                <td className={styles.centerTd}><span style={{color: '#28a745', fontWeight: 'bold'}}>{req.status}</span></td>
                {canEdit && (
                  <td >
                    <div className={styles.actionTdInnerDiv}>
                      <button onClick={() => handleEdit(req.id)} className={`${styles.button}`} style={{backgroundColor: '#5cb85c', color: 'white'}}>수정</button>
                      <button onClick={() => handleDelete(req.id)} className={`${styles.button}`} style={{backgroundColor: '#d9534f', color: 'white'}}>삭제</button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이지네이션 */}
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