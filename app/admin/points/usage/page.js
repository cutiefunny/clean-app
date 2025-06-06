// /app/admin/points/usage/page.jsx (Firestore 연동)
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
  updateDoc,
  writeBatch // 비고 일괄 저장을 위해 추가
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

const ITEMS_PER_PAGE = 10;
const TRANSACTION_TYPES = ["전체", "충전", "차감"];
const COLLECTION_NAME = "pointHistory";

export default function PointUsagePage() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [initialHistory, setInitialHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 필터 및 검색 상태
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState(TRANSACTION_TYPES[0]);
  const [companyNameSearch, setCompanyNameSearch] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 디바운싱
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(companyNameSearch);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [companyNameSearch]);

  // Firestore에서 데이터 로드 함수
  const fetchPointHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const historyCollectionRef = collection(db, COLLECTION_NAME);
      const conditions = [];

      // 날짜 필터링 (createdAt 기준)
      if (startDate) {
        conditions.push(where('createdAt', '>=', Timestamp.fromDate(new Date(startDate))));
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(where('createdAt', '<=', Timestamp.fromDate(endOfDay)));
      }

      // 유형 필터링
      if (selectedType !== "전체") {
        conditions.push(where('transactionType', '==', selectedType));
      }

      // 업체명 검색 (시작 문자열 기준)
      if (debouncedSearchTerm) {
        const lowerSearch = debouncedSearchTerm.toLowerCase();
        conditions.push(where('companyName', '>=', lowerSearch));
        conditions.push(where('companyName', '<=', lowerSearch + '\uf8ff'));
      }

      // 최종 쿼리 생성 (정렬 + 필터)
      const dataQueryConstraints = [orderBy('createdAt', 'desc'), ...conditions];
      let dataQuery = query(historyCollectionRef, ...dataQueryConstraints);

      // 전체 아이템 수 계산
      const countQuery = query(historyCollectionRef, ...conditions);
      const snapshotCount = await getCountFromServer(countQuery);
      setTotalItems(snapshotCount.data().count);

      // 데이터 가져오기 (클라이언트 사이드 페이지네이션)
      // 참고: 대량 데이터의 경우 Firestore의 limit()과 startAfter()를 사용한 서버 사이드 페이지네이션이 훨씬 효율적입니다.
      const querySnapshot = await getDocs(dataQuery);
      let docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
      }));

      const paginated = docsData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      setHistory(paginated);
      setInitialHistory(JSON.parse(JSON.stringify(paginated))); // 깊은 복사를 통해 원본 데이터 저장

    } catch (err) {
      console.error(`Error fetching ${COLLECTION_NAME}: `, err);
      setError(`데이터를 불러오는 중 오류가 발생했습니다. Firestore 색인 및 보안 규칙을 확인해주세요. 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, startDate, endDate, selectedType, debouncedSearchTerm]);

  useEffect(() => {
    fetchPointHistory();
  }, [fetchPointHistory]);

  const handleNoteChange = (id, newNote) => {
    setHistory(currentHistory =>
      currentHistory.map(item =>
        item.id === id ? { ...item, notes: newNote } : item
      )
    );
  };

  const handleSaveChanges = async () => {
    const changedItems = history.filter((item, index) => {
      // initialHistory에 해당 index의 아이템이 없을 경우(예: 페이지네이션 후 데이터 변경)를 대비
      const initialItem = initialHistory.find(initItem => initItem.id === item.id);
      return initialItem && item.notes !== initialItem.notes;
    });

    if (changedItems.length === 0) {
      alert("변경된 내용이 없습니다.");
      return;
    }

    try {
      const batch = writeBatch(db);
      changedItems.forEach(item => {
        const docRef = doc(db, COLLECTION_NAME, item.id);
        batch.update(docRef, { notes: item.notes });
      });
      await batch.commit();
      alert(`${changedItems.length}개의 비고 항목이 성공적으로 저장되었습니다.`);
      fetchPointHistory(); // 저장 후 데이터 새로고침
    } catch (err) {
      console.error("Error saving notes: ", err);
      alert(`저장 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  // 나머지 핸들러 함수들 (handleFilterReset, handleSearch, handlePointSettings 등)은 이전과 동일하게 유지
  const handleFilterReset = () => { /* ... */ };
  const handleSearch = () => { /* ... */ };
  const handlePointSettings = () => {
    router.push('/admin/points/usage/setting'); // 포인트 설정 페이지로 이동
  }
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const formatDate = (dateInput) => { /* ... */ };

  return (
    <div className={styles.pageContainer}>
      {/* ... (필터, 버튼, 테이블 등 JSX 부분은 이전 답변과 동일하게 유지) ... */}
      <h2 className={styles.pageTitle} style={{textAlign: 'left', borderBottom: 'none'}}>충전 및 차감 내역</h2>
      {/* 필터 영역 */}
      <div className={styles.filterSection} style={{justifyContent: 'flex-start'}}>
        <div className={styles.filterGroup}>
          <label>포인트 적용일:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={styles.input} />
          <span>~</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={styles.input} />
        </div>
        <div className={styles.filterGroup}>
          <label>유형:</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={styles.filterDropdown}>
            {TRANSACTION_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>청소업체명:</label>
          <input type="text" value={companyNameSearch} onChange={(e) => setCompanyNameSearch(e.target.value)} className={styles.input} />
        </div>
        <div className={styles.filterGroup}>
          <button onClick={handleSearch} className={styles.button}>검색</button>
          <button onClick={handleFilterReset} className={styles.button} style={{backgroundColor: '#f8f9fa'}}>초기화</button>
        </div>
      </div>
      <div className={styles.actionButtonContainer}>
        <button onClick={handlePointSettings} className={styles.primaryButton}>포인트 설정</button>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thNumber}>번호</th>
            <th className={styles.th}>일시</th>
            <th className={styles.thLeft}>청소업체</th>
            <th className={styles.th}>유형</th>
            <th className={styles.th}>적용포인트</th>
            <th className={styles.th}>보유포인트</th>
            <th className={styles.thLeft}>내용</th>
            <th className={styles.thLeft} style={{width: '25%'}}>비고</th>
          </tr>
        </thead>
        <tbody>
          {loading && ( <tr><td colSpan={8} className={styles.centerTd}>로딩 중...</td></tr> )}
          {!loading && history.length === 0 && ( <tr><td colSpan={8} className={styles.centerTd}>포인트 사용 내역이 없습니다.</td></tr> )}
          {!loading && history.length > 0 && (
            history.map((item, index) => (
              <tr key={item.id}>
                <td className={styles.centerTd}>{(totalItems - ((currentPage - 1) * ITEMS_PER_PAGE)) - index}</td>
                <td className={styles.centerTd}>{formatDate(item.createdAt)}</td>
                <td className={styles.tdLeft}>{item.companyName}</td>
                <td className={styles.centerTd}>
                  <span style={{color: item.transactionType === '충전' ? 'blue' : 'red'}}>{item.transactionType}</span>
                </td>
                <td className={styles.centerTd} style={{fontWeight: 'bold', color: item.points > 0 ? 'blue' : 'red'}}>
                  {item.points > 0 ? '+' : ''}{item.points.toLocaleString()}
                </td>
                <td className={styles.centerTd}>{item.pointsBalanceAfter.toLocaleString()}</td>
                <td className={styles.tdLeft}>{item.description}</td>
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
      
      <div className={styles.actionButtonContainer} style={{justifyContent: 'center', marginTop: '25px'}}>
        <button onClick={handleSaveChanges} className={styles.button} style={{padding: '10px 30px'}}>저장</button>
      </div>

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