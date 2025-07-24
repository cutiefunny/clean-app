// /app/admin/requests/sent/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../board.module.css'; // 공통 CSS Module (경로 확인!)
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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

const COLLECTION_NAME = "requests";
const STATUS_SENT = ["전송", "청소완료"]; // "전송" 상태의 요청을 필터링하기 위한 배열

export default function SentRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { permissions, isSuperAdmin } = useAuth();
  const canEdit = !loading && (isSuperAdmin || permissions?.requests === 'edit');

  const [companyOptions, setCompanyOptions] = useState([{ id: 'all', name: '전체' }]);
  const [selectedAssignedCompany, setSelectedAssignedCompany] = useState("전체");
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const fetchCompanyOptions = async () => {
      try {
        const cleanersQuery = query(collection(db, 'cleaners'), orderBy('businessName', 'asc'));
        const querySnapshot = await getDocs(cleanersQuery);
        const fetchedCompanies = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().businessName,
        }));
        // [수정] 기존 상태에 덧붙이지 않고, 매번 새로운 배열로 상태를 설정합니다.
        const staticOptions = [{ id: 'all', name: '전체' }];
        setCompanyOptions([...staticOptions, ...fetchedCompanies]);
      } catch (err) {
        console.error("Error fetching company options:", err);
      }
    };
    fetchCompanyOptions();
  }, []); // 마운트 시 한 번만 실행

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
      conditions.push(where('status', 'in', STATUS_SENT));

      // 2. 배정업체명 필터링
      if (selectedAssignedCompany !== "전체") {
        // 'assignedCompanies' 배열에 특정 업체 객체가 포함되어 있는지 확인
        // 이 쿼리가 작동하려면 Firestore 스키마의 assignedCompanies 필드가 객체의 배열이어야 합니다.
        // 예: assignedCompanies: [{id: '...', name: '...'}, ...]
        const selectedCompanyObject = companyOptions.find(opt => opt.name === selectedAssignedCompany);
        if (selectedCompanyObject) {
            conditions.push(where('assignedCompanies', 'array-contains', selectedCompanyObject));
        }
      }

      // 3. 검색어 필터링 (신청자명 기준 "시작 문자열" 검색 예시)
      if (debouncedSearchTerm) {
        const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
        conditions.push(where('applicantName', '>=', lowerSearchTerm));
        conditions.push(where('applicantName', '<=', lowerSearchTerm + '\uf8ff'));
      }

      const dataQueryConstraints = [orderBy('createdAt', 'desc'), ...conditions];
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

  const handleExcelDownload = async () => { // 함수를 async로 변경
      if (requests.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
      }
  
      // 1. Excel 워크북 및 워크시트 생성
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('신청내역'); // 시트 이름 설정
  
      // 2. 컬럼 정의 (헤더, 데이터 매핑을 위한 key, 너비 등)
      // worksheet.columns의 각 객체 key는 아래 dataForExcel 객체의 key와 일치해야 합니다.
      worksheet.columns = [
        { header: '번호', key: 'displayNumber', width: 8 },
        { header: '분야', key: 'field', width: 20 },
        { header: '적용매장', key: 'assignedCompanyName', width: 20 },
        { header: '신청자명', key: 'applicantName', width: 15 },
        { header: '신청자 연락처', key: 'applicantContact', width: 20 },
        { header: '상태', key: 'status', width: 15 },
        { header: '신청일', key: 'requestDateStr', width: 15 },
        // 필요한 다른 컬럼 추가
      ];
  
      // 3. 워크시트에 사용할 데이터 준비
      // 현재 페이지에 표시되는 requests 데이터를 사용합니다.
      // 전체 필터링된 데이터를 원하시면 fetchPendingRequests에서 slice 전의 데이터를 사용해야 합니다.
      const dataForExcel = requests.map((req, index) => ({
        displayNumber: (totalItems - ((currentPage - 1) * ITEMS_PER_PAGE)) - index, // 화면에 표시되는 번호
        field: req.field,
        assignedCompanyName: req.assignedCompanyName || '-',
        applicantName: req.applicantName,
        applicantContact: req.applicantContact,
        status: req.status,
        requestDateStr: req.requestDate ? formatDate(req.requestDate) : 'N/A',
        // id: req.id, // 내부 ID가 필요하면 추가
      }));
  
      // 4. 데이터 행 추가
      worksheet.addRows(dataForExcel);
  
      // 5. 헤더 행 스타일링 (선택 사항)
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, name: 'Arial', size: 11, color: { argb: 'FFFFFFFF' } }; // 흰색 텍스트
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4A5568' }, // 헤더 배경색 (기존 저장 버튼 색상과 유사)
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { // 모든 셀에 테두리 적용
          top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
          left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
          bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
          right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
        };
      });
      
      // 6. 모든 데이터 셀에 기본 스타일 적용 (선택 사항 - 예: 테두리)
      worksheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
          if (rowNumber > 1) { // 헤더 제외
              row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
                  cell.border = {
                      top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
                      left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
                      bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
                      right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
                  };
                  // 특정 컬럼 중앙 정렬 (예시: 번호, 상태, 신청일)
                  if ([1, 6, 7].includes(colNumber)) { // 컬럼 번호 기준 (1부터 시작)
                      cell.alignment = { vertical: 'middle', horizontal: 'center' };
                  } else {
                      cell.alignment = { vertical: 'middle' };
                  }
              });
          }
      });
  
  
      // 7. Excel 파일 생성 및 다운로드
      const today = new Date();
      const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const fileName = `청소신청내역(전송대기)_${dateString}.xlsx`;
  
      try {
        const buffer = await workbook.xlsx.writeBuffer(); // 비동기 작업
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, fileName); // file-saver를 사용하여 파일 다운로드
      } catch (err) {
        console.error("Error writing excel buffer or saving file: ", err);
        alert('엑셀 파일 생성 중 오류가 발생했습니다.');
      }
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
            {companyOptions.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
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
        {/* { canEdit && (
          <button className={styles.primaryButton} disabled={true} title="이미 전송된 내역입니다.">일괄 매칭 선택 적용</button>
        )} */}
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
                  <div className={styles.tagsContainer}>
                    {req.assignedCompanies && req.assignedCompanies.length > 0 ? (
                      req.assignedCompanies.map(c => <span key={c.id} className={styles.tagCompany}>{c.name}</span>)
                    ) : '-'}
                  </div>
                </td>
                <td className={styles.tdLeft}>{req.applicantName}</td>
                <td className={styles.centerTd}>{req.applicantContact}</td>
                <td className={styles.centerTd}><span style={{color: '#28a745', fontWeight: 'bold'}}>{req.status}</span></td>
                {canEdit && (
                  <td >
                    <div className={styles.actionTdInnerDiv}>
                      <button onClick={() => handleEdit(req.id)} className={`${styles.button}`} style={{backgroundColor: '#5cb85c', color: 'white'}}>상세</button>
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