// /app/admin/cleaners/members/page.jsx (<thead> 및 tbody 수정)
"use client";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp, // 날짜 필터링 시 JavaScript Date를 Timestamp로 변환하기 위해
  getCountFromServer, // 전체 아이템 수 계산
  doc, // (삭제 기능을 위해 미리 추가)
  deleteDoc // (삭제 기능을 위해 미리 추가)
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp'; // Firebase db 객체 경로 확인
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../board.module.css'; // 공통 CSS Module 임포트
import { useAuth } from '../../../context/AuthContext'; // 인증 컨텍스트 임포트

const SearchIconSvg = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

const ITEMS_PER_PAGE = 10;
const TABS = ["전체", "신청대기", "신청완료", "신청거부"];

const fieldOptions = ["전체", "입주청소", "이사청소", "사무실청소", "특수청소"];
const businessNameFilterOptions = ["전체", "A등급", "B등급", "C등급"];
const COLLECTION_NAME = "cleaners"; // Firestore 컬렉션 이름

export default function CleanerMembersPage() {
  const router = useRouter();
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { permissions, isSuperAdmin } = useAuth();
  const canEdit = !loading && (isSuperAdmin || permissions?.cleaners === 'edit'); // 권한 체크

  const [selectedField, setSelectedField] = useState(fieldOptions[0]);
  const [selectedBusinessNameFilter, setSelectedBusinessNameFilter] = useState(businessNameFilterOptions[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // 검색어 변경 시 첫 페이지로
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Firestore에서 데이터 로드 함수
  const fetchCleaners = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const cleanersCollectionRef = collection(db, COLLECTION_NAME);
      const conditions = []; // Firestore where 조건을 담을 배열

      // 1. 탭 필터링 (registrationStatus 기준)
      if (activeTab !== "전체") {
        conditions.push(where('registrationStatus', '==', activeTab));
      }

      // 2. 분야 필터링 (field 기준)
      if (selectedField !== "전체") {
        conditions.push(where('field', '==', selectedField));
      }

      // 3. "상호명(필터)" 드롭다운 필터링
      // 이 필터가 어떤 Firestore 필드와 매칭되는지 확인 필요.
      // 예시: 만약 '업체등급(grade)' 필드가 있고 businessNameFilterOptions가 등급이라면:
      // if (selectedBusinessNameFilter !== "전체") {
      //   conditions.push(where('grade', '==', selectedBusinessNameFilter));
      // }
      // 현재는 이 필터 로직을 비워둡니다. 실제 필드에 맞게 추가해주세요.

      // 4. 검색어 필터링 (대표자명 또는 연락처 - Firestore에서 OR 조건은 복잡)
      // Firestore는 기본적으로 여러 필드에 대한 OR 검색을 단일 쿼리로 지원하지 않습니다.
      // - 대표자명과 연락처를 합친 검색용 필드를 Firestore에 추가하거나,
      // - 대표자명 따로, 연락처 따로 검색 후 클라이언트에서 합치거나 (비효율적),
      // - Algolia 같은 외부 검색 엔진 사용을 권장합니다.
      // 여기서는 우선 representativeName에 대해서만 시작 문자열 검색을 구현합니다.
      if (debouncedSearchTerm) {
        const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
        conditions.push(where('representativeName', '>=', lowerSearchTerm));
        conditions.push(where('representativeName', '<=', lowerSearchTerm + '\uf8ff'));
        // 연락처 검색을 추가하려면 별도 쿼리 또는 다른 방식 필요
      }

      // 최종 쿼리 (정렬 조건은 registrationDate로 가정, 필요시 변경)
      // Firestore에서 여러 필드에 대해 범위/부등호 필터를 사용하거나,
      // 정렬 필드와 다른 필드에 범위/부등호 필터를 사용하려면 복합 색인이 필요할 수 있습니다.
      let dataQuery = query(cleanersCollectionRef, orderBy('registrationDate', 'desc'), ...conditions);
      const countQuery = query(cleanersCollectionRef, ...conditions); // 개수 계산용 쿼리

      // 전체 아이템 수 계산
      const snapshotCount = await getCountFromServer(countQuery);
      setTotalItems(snapshotCount.data().count);

      // 현재 페이지 데이터 가져오기 (클라이언트 사이드 페이지네이션)
      // 대량 데이터의 경우 Firestore의 limit, startAfter를 사용한 서버 사이드 페이지네이션 권장
      const querySnapshot = await getDocs(dataQuery);
      let docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Firestore Timestamp를 JavaScript Date 객체로 변환
        registrationDate: doc.data().registrationDate?.toDate ? doc.data().registrationDate.toDate() : new Date(doc.data().registrationDate),
        // createdAt, updatedAt 등 다른 Timestamp 필드도 동일하게 변환 필요
      }));
      console.log('docsData:', docsData); // 디버깅용 로그

      const paginatedCleaners = docsData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      setCleaners(paginatedCleaners);

    } catch (err) {
      console.error(`Error fetching ${COLLECTION_NAME}: `, err);
      setError(`데이터를 불러오는 중 오류가 발생했습니다. Firestore 색인 및 보안 규칙을 확인해주세요. 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, selectedField, selectedBusinessNameFilter, debouncedSearchTerm]); // 의존성 배열

  useEffect(() => {
    fetchCleaners();
  }, [fetchCleaners]);

  // handleSearch, handleRegisterNew, handleEdit, handleDelete는 이전과 유사하게 구현
  // 단, handleDelete에서는 Firestore 삭제 로직을 사용해야 함

  const handleSearch = () => {
    setDebouncedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleRegisterNew = () => { router.push('/admin/cleaners/members/new'); };
  const handleEdit = (id) => { router.push(`/admin/cleaners/members/${id}/edit`); };
  
  const handleDelete = async (id) => {
    if (window.confirm('정말로 이 업체를 삭제하시겠습니까?')) {
      try {
        const memberDocRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(memberDocRef);
        // 성공 메시지 (선택 사항)
        // alert('업체 정보가 삭제되었습니다.');
        fetchCleaners(); // 목록 새로고침
      } catch (err) {
        console.error(`Error deleting cleaner member ${id}: `, err);
        setError(`삭제 중 오류 발생: ${err.message}`);
      }
    }
  };

  const handleSelectAll = (e) => { /* 이전과 동일 */ setSelectedIds(e.target.checked ? cleaners.map(c => c.id) : []); };
  const handleSelectSingle = (e, id) => { /* 이전과 동일 */ setSelectedIds(prev => e.target.checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id)); };

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
      {/* 필터 및 검색 영역, 등록 버튼, 탭 영역은 이전과 동일하게 유지 */}
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <label htmlFor="fieldFilter">분야:</label>
          <select id="fieldFilter" value={selectedField} onChange={(e) => { setSelectedField(e.target.value); setCurrentPage(1); }} className={styles.filterDropdown}>
            {fieldOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="businessNameFilter">상호명(필터):</label>
          <select id="businessNameFilter" value={selectedBusinessNameFilter} onChange={(e) => { setSelectedBusinessNameFilter(e.target.value); setCurrentPage(1); }} className={styles.filterDropdown}>
            {businessNameFilterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className={styles.searchInputContainer}>
          <div className={styles.searchInputWrapper}>
            <input type="text" id="searchTerm" placeholder="대표자명, 연락처(하이픈 제외)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput}/>
            <SearchIconSvg className={styles.searchIcon} />
          </div>
          <button onClick={handleSearch} className={styles.button}>검색</button>
        </div>
      </div>

      {canEdit && (
        <div className={styles.actionButtonContainer}>
          <button onClick={handleRegisterNew} className={styles.primaryButton}>등록</button>
        </div>
      )}

      <div className={styles.tabContainer}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1); }} className={activeTab === tab ? styles.tabButtonActive : styles.tabButton} >
            {tab}
          </button>
        ))}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thCheckbox}><input type="checkbox" onChange={handleSelectAll} checked={cleaners.length > 0 && selectedIds.length === cleaners.length} /></th>
            <th className={styles.thNumber}>번호</th>
            <th className={styles.th}>분야</th>
            <th className={styles.thLeft}>상호명</th>
            <th className={styles.thLeft}>대표자명</th>
            <th className={styles.th}>담당자 연락처</th>
            <th className={styles.th}>가입신청</th>
            <th className={styles.th}>상태</th>
            {canEdit && (
            <th className={styles.thActions}>관리</th>
          )}
          </tr>
        </thead>
        {/* === tbody 조건부 렌더링 수정 === */}
        <tbody>
          {loading && (
            <tr>
              <td colSpan={9} className={styles.centerTd}>로딩 중...</td>
            </tr>
          )}
          {!loading && cleaners.length === 0 && (
            <tr>
              <td colSpan={9} className={styles.centerTd}>해당 조건의 업체가 없습니다.</td>
            </tr>
          )}
          {!loading && cleaners.length > 0 && (
            cleaners.map((cleaner, index) => (
              <tr key={cleaner.id}>
                <td className={styles.centerTd}>
                  <input type="checkbox" checked={selectedIds.includes(cleaner.id)} onChange={(e) => handleSelectSingle(e, cleaner.id)} />
                </td>
                <td className={styles.centerTd}>{(totalItems - ((currentPage - 1) * ITEMS_PER_PAGE)) - index}</td>
                <td className={styles.centerTd}>{cleaner.field}</td>
                <td className={styles.tdLeft}>{cleaner.businessName}</td>
                <td className={styles.tdLeft}>{cleaner.representativeName}</td>
                <td className={styles.centerTd}>{cleaner.contactPhone}</td>
                <td className={styles.centerTd}>{cleaner.registrationStatus} ({formatDate(cleaner.registrationDate)})</td>
                <td className={styles.centerTd}>{cleaner.operationalStatus}</td>
                {canEdit && (
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
        {/* ========================= */}
      </table>

      {/* 페이지네이션 (이전과 동일) */}
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