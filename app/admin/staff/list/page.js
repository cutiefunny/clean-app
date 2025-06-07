// /app/admin/staff/list/page.jsx (Firestore 연동)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../board.module.css'; // 공통 CSS Module
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  getCountFromServer,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp'; // Firebase db 객체
import { useAuth } from '../../../context/AuthContext';

const ITEMS_PER_PAGE = 10;
const SEARCH_OPTIONS = ["이름", "회원번호(아이디)"];
const COLLECTION_NAME = "staffMembers";

export default function StaffListPage() {
  const router = useRouter();
  const { permissions, isSuperAdmin } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 필터 및 검색 상태
  const [searchCondition, setSearchCondition] = useState(SEARCH_OPTIONS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]); // 체크박스 선택용 (필요시 사용)

  const canEditStaff = isSuperAdmin || permissions?.staff === 'edit';

  // 디바운싱
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Firestore에서 데이터 로드 함수
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const staffCollectionRef = collection(db, COLLECTION_NAME);
      const conditions = [];

      // 검색 필터링
      if (debouncedSearchTerm) {
        const fieldToSearch = searchCondition === '이름' ? 'staffName' : 'staffId';
        const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
        conditions.push(where(fieldToSearch, '>=', lowerSearchTerm));
        conditions.push(where(fieldToSearch, '<=', lowerSearchTerm + '\uf8ff'));
      }
      
      // 최종 쿼리 생성
      // createdAt 필드로 최신순 정렬을 기본으로 합니다.
      const dataQuery = query(staffCollectionRef, orderBy('createdAt', 'desc'), ...conditions);
      const countQuery = query(staffCollectionRef, ...conditions);

      // 전체 아이템 수 계산
      const snapshotCount = await getCountFromServer(countQuery);
      setTotalItems(snapshotCount.data().count);

      // 데이터 가져오기 (클라이언트 사이드 페이지네이션)
      // 참고: 데이터가 많을 경우 서버 사이드 페이지네이션(limit, startAfter 사용)이 더 효율적입니다.
      const querySnapshot = await getDocs(dataQuery);
      const docsData = querySnapshot.docs.map(doc => ({
        id: doc.id, // Firestore 문서 ID를 id로 사용 (이것이 직원의 UID)
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
      }));
      
      const paginatedStaff = docsData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      setStaffList(paginatedStaff);

    } catch (err) {
      console.error(`Error fetching ${COLLECTION_NAME}: `, err);
      setError(`직원 목록을 불러오는 중 오류가 발생했습니다. Firestore 색인 및 보안 규칙을 확인해주세요. 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchCondition, debouncedSearchTerm]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);


  const handleSearch = () => {
    setDebouncedSearchTerm(searchTerm);
    setCurrentPage(1);
  };
  
  const handleCreateNew = () => router.push('/admin/staff/list/new');
  const handleEdit = (id) => router.push(`/admin/staff/list/${id}/edit`);
  const handleDelete = async (id, staffName) => {
    if (window.confirm(`'${staffName}' 직원을 정말 삭제하시겠습니까?\n이 작업은 Firestore의 직원 정보만 삭제하며, 인증 계정은 별도로 삭제해야 합니다.`)) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        alert(`'${staffName}' 직원의 정보가 삭제되었습니다.`);
        fetchStaff();
      } catch (err) {
        console.error(`Error deleting staff member ${id}: `, err);
        setError(`직원 정보 삭제 중 오류 발생: ${err.message}`);
      }
    }
  };
  
  const handleSelectAll = (e) => { setSelectedIds(e.target.checked ? staffList.map(s => s.id) : []); };
  const handleSelectSingle = (e, id) => { setSelectedIds(prev => e.target.checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id)); };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.filterSection} style={{ justifyContent: 'flex-start', marginBottom: '10px' }}>
        <div className={styles.filterGroup}>
          <select value={searchCondition} onChange={(e) => setSearchCondition(e.target.value)} className={styles.filterDropdown}>
            {SEARCH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <div className={styles.searchInputWrapper}>
            <input type="text" placeholder="검색" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchInput} />
            <span className={styles.searchIcon}>🔍</span>
          </div>
          <button onClick={handleSearch} className={styles.button}>검색</button>
        </div>
      </div>
      
      <div className={styles.actionButtonContainer}>
        {canEditStaff && (
          <button onClick={handleCreateNew} className={styles.primaryButton}>신규</button>
        )}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thCheckbox}><input type="checkbox" onChange={handleSelectAll} checked={staffList.length > 0 && selectedIds.length === staffList.length} /></th>
            <th className={styles.thNumber}>번호</th>
            <th className={styles.thLeft}>아이디</th>
            <th className={styles.thLeft}>직원명</th>
            <th className={styles.th}>휴대폰번호</th>
            <th className={styles.thLeft}>이메일</th>
            { canEditStaff && <th className={styles.thActions}>관리</th> }
          </tr>
        </thead>
        <tbody>
          {loading && (<tr><td colSpan={7} className={styles.centerTd}>로딩 중...</td></tr>)}
          {!loading && staffList.length === 0 && (<tr><td colSpan={7} className={styles.centerTd}>등록된 직원이 없습니다.</td></tr>)}
          {!loading && staffList.length > 0 && (
            staffList.map((staff, index) => (
              <tr key={staff.id}>
                <td className={styles.centerTd}><input type="checkbox" checked={selectedIds.includes(staff.id)} onChange={(e) => handleSelectSingle(e, staff.id)} /></td>
                <td className={styles.centerTd}>{(totalItems - ((currentPage - 1) * ITEMS_PER_PAGE)) - index}</td>
                <td className={styles.tdLeft}>{staff.staffId}</td>
                <td className={styles.tdLeft}>{staff.staffName}</td>
                <td className={styles.centerTd}>{staff.phone}</td>
                <td className={styles.tdLeft}>{staff.email}</td>
                {canEditStaff && (
                    <td >
                        <div className={styles.actionTdInnerDiv}>
                        <button onClick={() => handleEdit(staff.id)} className={`${styles.button}`} style={{backgroundColor: '#5cb85c', color: 'white'}}>수정</button>
                        <button onClick={() => handleDelete(staff.id)} className={`${styles.button}`} style={{backgroundColor: '#d9534f', color: 'white'}}>삭제</button>
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