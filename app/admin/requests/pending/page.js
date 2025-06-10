// /app/admin/requests/pending/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
// [수정] useSearchParams 임포트 추가
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../../board.module.css';
import { collection, getDocs, query, where, orderBy, Timestamp, getCountFromServer, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useAuth } from '../../../context/AuthContext';

// 아이콘 SVG (필요시 사용)
const SearchIconSvg = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

const ITEMS_PER_PAGE = 10; // 이미지에는 4개만 보이지만, 일반적인 게시판 수 고려
const ASSIGNED_COMPANY_OPTIONS = ["전체", "A업체", "B업체", "미배정"]; // 배정업체명 필터 옵션 예시
const STATUS_PENDING = "전송대기"; // Firestore에 저장된 실제 '전송대기' 상태값으로 변경

const COLLECTION_NAME = "requests"; // Firestore 컬렉션 이름

export default function PendingRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { permissions, isSuperAdmin } = useAuth();
  const canEdit = !loading && (isSuperAdmin || permissions?.requests === 'edit');

  // 필터 및 검색 상태 (이전과 동일)
  const [selectedAssignedCompany, setSelectedAssignedCompany] = useState(ASSIGNED_COMPANY_OPTIONS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // 페이지네이션 상태 (이전과 동일)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  // 검색어 디바운싱 (이전과 동일)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Firestore에서 "전송대기" 상태의 데이터 로드 함수
  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const requestsCollectionRef = collection(db, COLLECTION_NAME);
      const conditions = []; // Firestore where 조건을 담을 배열

      // 1. **필수 필터**: status가 "전송대기"인 문서만 가져옴
      conditions.push(where('status', '==', STATUS_PENDING));

      // 2. 배정업체명 필터링
      if (selectedAssignedCompany !== "전체") {
        if (selectedAssignedCompany === "미배정") {
          // 'assignedCompanyName' 필드가 없거나, null이거나, 특정 값('-' 또는 빈 문자열)인 경우를 필터링
          // Firestore에서는 null 또는 특정 값으로 필터링 가능. 필드가 없는 경우는 쿼리로 직접 잡기 어려움.
          // 데이터 저장 시 '미배정' 상태를 명시적인 값(예: null 또는 'UNASSIGNED')으로 저장하는 것이 좋음.
          conditions.push(where('assignedCompanyName', '==', null)); // 또는 '==' , '-' 등 저장 방식에 따름
        } else {
          conditions.push(where('assignedCompanyName', '==', selectedAssignedCompany));
        }
      }

      // 3. 검색어 필터링 (신청자명 기준 "시작 문자열" 검색 예시)
      // Firestore는 여러 필드에 대한 OR 검색이나 복잡한 텍스트 검색을 직접 지원하지 않음.
      // 필요시 Algolia 등 외부 검색 엔진 연동 고려.
      if (debouncedSearchTerm) {
        const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
        conditions.push(where('applicantName', '>=', lowerSearchTerm));
        conditions.push(where('applicantName', '<=', lowerSearchTerm + '\uf8ff'));
        // 연락처 검색을 추가하려면 별도 쿼리나 다른 방식 필요
      }

      // url 파라미터를 통한 필터링(date=YYYY-MM-DD)
      const dateParam = searchParams.get('date');
      if (dateParam) {
        const date = new Date(dateParam);
        if (!isNaN(date.getTime())) {
          // 날짜가 유효한 경우, 해당 날짜의 시작과 끝을 기준으로 필터링
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);
          conditions.push(where('requestDate', '>=', Timestamp.fromDate(startOfDay)));
          conditions.push(where('requestDate', '<=', Timestamp.fromDate(endOfDay)));
        } else {
          console.warn(`Invalid date parameter: ${dateParam}`);
        }
      }

      // 정렬 조건 (예: requestDate 또는 createdAt 최신순)
      // Firestore에서 여러 필드에 대해 범위/부등호 필터를 사용하거나,
      // 정렬 필드와 다른 필드에 범위/부등호 필터를 사용하려면 복합 색인이 필요.
      const dataQueryConstraints = [orderBy('requestDate', 'desc'), ...conditions]; // requestDate 또는 createdAt
      let dataQuery = query(requestsCollectionRef, ...dataQueryConstraints);

      // 전체 아이템 수 계산 (필터링된 결과에 대해)
      const countQuery = query(requestsCollectionRef, ...conditions); // 정렬 제외
      const snapshotCount = await getCountFromServer(countQuery);
      setTotalItems(snapshotCount.data().count);

      // 현재 페이지 데이터 가져오기 (클라이언트 사이드 페이지네이션)
      // 대량 데이터의 경우 Firestore의 limit(), startAfter()를 사용한 서버 사이드 페이지네이션 권장.
      const querySnapshot = await getDocs(dataQuery);
      let docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Firestore Timestamp를 JavaScript Date 객체로 변환
        requestDate: doc.data().requestDate?.toDate ? doc.data().requestDate.toDate() : new Date(doc.data().requestDate),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt), // 필요하다면
      }));

      const paginatedRequests = docsData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      setRequests(paginatedRequests);

    } catch (err) {
      console.error(`Error fetching ${COLLECTION_NAME}: `, err);
      setError(`데이터를 불러오는 중 오류가 발생했습니다. Firestore 색인 및 보안 규칙을 확인해주세요. 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedAssignedCompany, debouncedSearchTerm]); // 의존성 배열

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);


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


  const handleBatchMatchApply = () => {
    if (selectedIds.length === 0) { alert('먼저 매칭할 신청 건을 선택해주세요.'); return; }
    alert(`${selectedIds.length}건에 대해 일괄 매칭 적용 기능 구현 예정입니다.`);
    console.log("Selected IDs for batch matching:", selectedIds);
  };
  const handleEdit = (id) => { router.push(`/admin/requests/pending/${id}`); }; // 상세 페이지로 이동

  const handleDelete = async (id) => {
    if (window.confirm('정말로 이 신청 건을 삭제하시겠습니까?')) {
      try {
        const requestDocRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(requestDocRef);
        fetchPendingRequests(); // 삭제 후 목록 새로고침
      } catch (err) {
        console.error(`Error deleting request ${id}: `, err);
        setError(`삭제 중 오류 발생: ${err.message}`);
      }
    }
  };

  const handleSelectAll = (e) => { setSelectedIds(e.target.checked ? requests.map(r => r.id) : []); };
  const handleSelectSingle = (e, id) => { setSelectedIds(prev => e.target.checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id)); };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const formatDate = (dateInput) => { /* 이전과 동일 */
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
      <div className={styles.filterSection} style={{justifyContent: 'flex-start', marginBottom: '10px'}}> {/* 좌측 정렬 */}
        <div className={styles.filterGroup}>
          <label htmlFor="assignedCompanyFilter">배정업체명:</label>
          <select id="assignedCompanyFilter" value={selectedAssignedCompany} onChange={(e) => { setSelectedAssignedCompany(e.target.value); setCurrentPage(1);}} className={styles.filterDropdown}>
            {ASSIGNED_COMPANY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className={styles.searchInputContainer} style={{maxWidth: '400px'}}> {/* 검색창 너비 제한 */}
          <div className={styles.searchInputWrapper}>
            <input type="text" id="searchTerm" placeholder="신청자명, 연락처(하이픈 제외)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput}/>
            <SearchIconSvg className={styles.searchIcon} />
          </div>
          <button onClick={handleSearch} className={styles.button}>검색</button>
        </div>
      </div>
      
      {/* 액션 버튼 영역 */}
      <div className={styles.filterSection} style={{justifyContent: 'space-between'}}> {/* 버튼들을 양쪽으로 배치 */}
        <button onClick={handleExcelDownload} className={styles.button}>엑셀 다운</button>
        {canEdit && (
        <button onClick={handleBatchMatchApply} className={styles.primaryButton}>일괄 매칭 선택 적용</button>
        )}
      </div>


      {error && <p className={styles.errorText}>{error}</p>}

      {/* 신청 목록 테이블 */}
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
            { canEdit && <th className={styles.thActions}>관리</th> }
          </tr>
        </thead>
        <tbody>
          {loading && ( <tr><td colSpan={8} className={styles.centerTd}>로딩 중...</td></tr> )}
          {!loading && requests.length === 0 && ( <tr><td colSpan={8} className={styles.centerTd}>전송대기 중인 신청 내역이 없습니다.</td></tr> )}
          {!loading && requests.length > 0 && (
            requests.map((req, index) => (
              <tr key={req.id}>
                <td className={styles.centerTd}><input type="checkbox" checked={selectedIds.includes(req.id)} onChange={(e) => handleSelectSingle(e, req.id)} /></td>
                <td className={styles.centerTd}>{(totalItems - ((currentPage - 1) * ITEMS_PER_PAGE)) - index}</td>
                <td className={styles.td}>{req.field}</td>
                <td className={styles.td}>{req.assignedCompanyName || '-'}</td>
                <td className={styles.tdLeft}>{req.applicantName}</td>
                <td className={styles.centerTd}>{req.applicantContact}</td>
                <td className={styles.centerTd}><span style={{color: '#dc3545', fontWeight: 'bold'}}>{req.status}</span></td>
                { canEdit && (
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