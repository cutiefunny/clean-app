// /app/admin/staff/history/page.js
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
  Timestamp,
  getCountFromServer,
  doc,
  writeBatch // 비고 일괄 저장을 위해 추가
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp'; // Firebase db 객체
import { useAuth } from '../../../context/AuthContext';

const ITEMS_PER_PAGE = 10;
const EVENT_TYPES = ["전체", "계정 생성", "비밀번호 변경", "권한 변경"];
const COLLECTION_NAME = "staffAuditHistory"; // 직원 변경 내역을 저장할 Firestore 컬렉션 이름

export default function StaffHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [initialHistory, setInitialHistory] = useState([]); // '비고' 변경 감지를 위한 원본 데이터
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { permissions, isSuperAdmin } = useAuth();
  const canEdit = !loading && (isSuperAdmin || permissions?.cleaners === 'edit'); // 권한 체크

  // 필터 및 검색 상태
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEventType, setSelectedEventType] = useState(EVENT_TYPES[0]);
  const [targetStaffSearch, setTargetStaffSearch] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 디바운싱 useEffect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(targetStaffSearch);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [targetStaffSearch]);

  // Firestore에서 변경 내역 데이터 로드 함수
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const historyCollectionRef = collection(db, COLLECTION_NAME);
      const conditions = [];

      if (startDate) {
        conditions.push(where('createdAt', '>=', Timestamp.fromDate(new Date(startDate))));
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(where('createdAt', '<=', Timestamp.fromDate(endOfDay)));
      }
      if (selectedEventType !== "전체") {
        conditions.push(where('eventType', '==', selectedEventType));
      }
      if (debouncedSearchTerm) {
        // 'targetStaffName' 또는 'targetStaffId' 필드에 대한 검색
        conditions.push(where('targetStaffName', '>=', debouncedSearchTerm));
        conditions.push(where('targetStaffName', '<=', debouncedSearchTerm + '\uf8ff'));
      }

      const dataQuery = query(historyCollectionRef, orderBy('createdAt', 'desc'), ...conditions);
      const countQuery = query(historyCollectionRef, ...conditions);
      
      const snapshotCount = await getCountFromServer(countQuery);
      setTotalItems(snapshotCount.data().count);

      const querySnapshot = await getDocs(dataQuery);
      let docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
      }));

      const paginated = docsData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      setHistory(paginated);
      // '비고' 저장을 위해 원본 데이터를 깊은 복사하여 저장
      setInitialHistory(JSON.parse(JSON.stringify(paginated)));

    } catch (err) {
      console.error(`Error fetching ${COLLECTION_NAME}: `, err);
      setError(`변경 내역을 불러오는 중 오류가 발생했습니다. Firestore 색인 및 보안 규칙을 확인해주세요. 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, startDate, endDate, selectedEventType, debouncedSearchTerm]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleNoteChange = (id, newNote) => {
    setHistory(currentHistory =>
      currentHistory.map(item =>
        item.id === id ? { ...item, notes: newNote } : item
      )
    );
  };

  const handleSaveChanges = async () => {
    const changedItems = history.filter(item => {
      const initialItem = initialHistory.find(initItem => initItem.id === item.id);
      // 초기 '비고'가 undefined/null일 경우와 빈 문자열을 동일하게 처리
      return (item.notes || '') !== (initialItem?.notes || '');
    });

    if (changedItems.length === 0) {
      alert("변경된 내용이 없습니다.");
      return;
    }

    try {
      const batch = writeBatch(db);
      changedItems.forEach(item => {
        const docRef = doc(db, COLLECTION_NAME, item.id);
        batch.update(docRef, { notes: item.notes || '' }); // 빈 문자열로 저장
      });
      await batch.commit();
      alert(`${changedItems.length}개의 비고 항목이 성공적으로 저장되었습니다.`);
      fetchHistory(); // 저장 후 데이터 새로고침
    } catch (err) {
      console.error("Error saving notes: ", err);
      alert(`저장 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  const handleFilterReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedEventType(EVENT_TYPES[0]);
    setTargetStaffSearch('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  return (
    <div className={styles.pageContainer}>
      <h2 className={styles.pageTitle} style={{textAlign: 'left', borderBottom: 'none'}}>직원 변경내역</h2>
      
      <div className={styles.filterSection} style={{justifyContent: 'flex-start'}}>
        <div className={styles.filterGroup}>
          <label>적용 날짜:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={styles.input} />
          <span>~</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={styles.input} />
        </div>
        <div className={styles.filterGroup}>
          <label>이벤트 유형:</label>
          <select value={selectedEventType} onChange={(e) => setSelectedEventType(e.target.value)} className={styles.filterDropdown}>
            {EVENT_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>대상 직원:</label>
          <input type="text" value={targetStaffSearch} onChange={(e) => setTargetStaffSearch(e.target.value)} className={styles.input} placeholder="직원명 또는 아이디" />
        </div>
      </div>
      
      {error && <p className={styles.errorText}>{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thNumber}>번호</th>
            <th className={styles.th}>날짜 및 시간</th>
            <th className={styles.th}>작업관리자</th>
            <th className={styles.th}>대상 직원</th>
            <th className={styles.th}>이벤트 유형</th>
            <th className={styles.th} style={{width: '30%'}}>비고</th>
          </tr>
        </thead>
        <tbody>
          {loading && ( <tr><td colSpan={6} className={styles.centerTd}>로딩 중...</td></tr> )}
          {!loading && history.length === 0 && ( <tr><td colSpan={6} className={styles.centerTd}>변경 내역이 없습니다.</td></tr> )}
          {!loading && history.length > 0 && (
            history.map((item, index) => (
              <tr key={item.id}>
                <td className={styles.centerTd}>{(totalItems - ((currentPage - 1) * ITEMS_PER_PAGE)) - index}</td>
                <td className={styles.centerTd}>{formatDate(item.createdAt)}</td>
                <td className={styles.centerTd}>{item.operatorName} ({item.operatorId})</td>
                <td className={styles.centerTd}>{item.targetStaffName} ({item.targetStaffId})</td>
                <td className={styles.centerTd}>{item.eventType}</td>
                <td className={styles.td}>
                  <input 
                    type="text" 
                    value={item.notes || ''} 
                    onChange={(e) => handleNoteChange(item.id, e.target.value)} 
                    className={styles.input}
                    placeholder='메모를 별도로 입력할 수 있습니다.'
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      { canEdit && (
      <div className={styles.buttonContainer} style={{justifyContent: 'center', marginTop: '25px'}}>
        <button onClick={handleSaveChanges} className={styles.button} style={{padding: '10px 30px'}}>저장</button>
      </div>
      )}

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