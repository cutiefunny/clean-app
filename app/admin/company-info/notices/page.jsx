// /app/admin/company-info/notices/page.jsx (deleteDoc 기능 구현)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './NoticesPage.module.css';
// doc, deleteDoc 추가
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getCountFromServer,
  doc,  // Firestore 문서 참조를 위해 추가
  deleteDoc // Firestore 문서 삭제를 위해 추가
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp'; // 경로 확인!

const SearchIconSvg = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

const ITEMS_PER_PAGE = 5;

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const noticesCollectionRef = collection(db, 'companyNotices');
      const conditions = [];

      if (startDate) {
        conditions.push(where('createdAt', '>=', Timestamp.fromDate(new Date(startDate))));
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(where('createdAt', '<=', Timestamp.fromDate(endOfDay)));
      }
      if (debouncedSearchTerm) {
        conditions.push(where('title', '>=', debouncedSearchTerm));
        conditions.push(where('title', '<=', debouncedSearchTerm + '\uf8ff'));
      }

      let finalQuery = query(noticesCollectionRef, orderBy('createdAt', 'desc'), ...conditions);
      const countQuery = query(noticesCollectionRef, ...conditions);
      
      const snapshotCount = await getCountFromServer(countQuery);
      setTotalItems(snapshotCount.data().count);

      const querySnapshot = await getDocs(finalQuery);
      let docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
      }));

      const paginatedNotices = docsData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      setNotices(paginatedNotices);

    } catch (err) {
      console.error("Error fetching notices: ", err);
      setError('공지사항을 불러오는 중 오류가 발생했습니다. Firestore 색인(index) 설정을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, startDate, endDate, debouncedSearchTerm]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleSearch = () => {
    setDebouncedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const handleCreateNew = () => {
    router.push('/admin/company-info/notices/new');
  };

  const handleEdit = (id) => {
    router.push(`/admin/company-info/notices/${id}/edit`);
  };

  // handleDelete 함수 수정
  const handleDelete = async (id) => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      try {
        const noticeDocRef = doc(db, 'companyNotices', id); // 삭제할 문서의 참조 생성
        await deleteDoc(noticeDocRef); // Firestore에서 문서 삭제

        // (선택 사항) 사용자에게 성공 메시지 표시
        // alert('공지사항이 성공적으로 삭제되었습니다.');

        // 삭제 후 목록 새로고침
        // 전체 아이템 수를 다시 계산하거나, 현재 페이지의 아이템이 모두 삭제된 경우 이전 페이지로 이동하는 등의 로직 추가 가능
        // 간단하게는 fetchNotices()를 호출하여 현재 페이지를 다시 로드
        fetchNotices();

      } catch (err) {
        console.error("Error deleting notice: ", err);
        // Firestore 보안 규칙 오류일 가능성도 고려
        if (err.code === 'permission-denied') {
            alert('공지사항을 삭제할 권한이 없습니다. 보안 규칙을 확인해주세요.');
        } else {
            alert('삭제 중 오류가 발생했습니다.');
        }
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(notices.map(n => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectSingle = (e, id) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  return (
    <div className={styles.pageContainer}>
      {/* 필터 및 검색 영역 (이전과 동일) */}
      <div className={styles.filterSection}>
        <label htmlFor="startDate">날짜:</label>
        <div className={styles.datePickerContainer}>
          <input type="date" id="startDate" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1);}} className={styles.input} />
          <span>~</span>
          <input type="date" id="endDate" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1);}} className={styles.input} />
        </div>
        <label htmlFor="searchTerm">제목:</label>
        <div className={styles.searchInputContainer}>
          <div className={styles.searchInputWrapper}>
            <input
              type="text"
              id="searchTerm"
              placeholder="제목을 검색해주세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <SearchIconSvg className={styles.searchIcon} />
          </div>
        </div>
      </div>

      {/* 신규 버튼 (이전과 동일) */}
      <div className={styles.actionButtonContainer}>
        <button onClick={handleCreateNew} className={styles.primaryButton}>신규</button>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      {/* 공지사항 목록 테이블 (이전과 동일) */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thCheckbox}><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === notices.length && notices.length > 0} /></th>
            <th className={styles.thNumber}>번호</th>
            <th className={styles.th}>제목</th>
            <th className={styles.thDate}>작성날짜</th>
            <th className={styles.thActions}>관리</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={5} className={styles.centerTd}>로딩 중...</td>
            </tr>
          )}
          {!loading && notices.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.centerTd}>공지사항이 없습니다.</td>
            </tr>
          )}
          {!loading && notices.length > 0 && (
            notices.map((notice, index) => (
              <tr key={notice.id}>
                <td className={styles.centerTd}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(notice.id)}
                    onChange={(e) => handleSelectSingle(e, notice.id)}
                  />
                </td>
                <td className={styles.centerTd}>
                  {(totalItems - ((currentPage - 1) * ITEMS_PER_PAGE)) - index}
                </td>
                <td className={styles.td}>{notice.title}</td>
                <td className={styles.centerTd}>{formatDate(notice.createdAt)}</td>
                <td className={styles.centerTd}>
                  <div className={styles.actionTdInnerDiv}>
                    <button onClick={() => handleEdit(notice.id)} className={`${styles.button}`} style={{backgroundColor: '#5cb85c', color: 'white'}}>수정</button>
                    <button onClick={() => handleDelete(notice.id)} className={`${styles.button}`} style={{backgroundColor: '#d9534f', color: 'white'}}>삭제</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 페이지네이션 (이전과 동일) */}
      {!loading && totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`${styles.pageButton} ${currentPage === page ? styles.pageButtonActive : ''}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}