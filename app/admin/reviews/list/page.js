// /app/admin/review/list/page.jsx (데이터 조인 로직 추가)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../board.module.css';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getCountFromServer,
  doc,
  documentId // documentId import 추가
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

const SearchIconSvg = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const CalendarIconSvg = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;

const ITEMS_PER_PAGE = 10;
const BUILDING_TYPES = ["전체", "오피스텔", "아파트", "원룸", "빌라", "단독주택"];
const SORT_OPTIONS = ["최신순", "오래된순", "평수높은순", "평수낮은순"];
const REVIEWS_COLLECTION = "reviews";
const REQUESTS_COLLECTION = "requests";

export default function ReviewListPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBuildingType, setSelectedBuildingType] = useState(BUILDING_TYPES[0]);
  const [productNameSearch, setProductNameSearch] = useState('');
  const [debouncedProductNameSearch, setDebouncedProductNameSearch] = useState('');
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProductNameSearch(productNameSearch);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [productNameSearch]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const reviewsCollectionRef = collection(db, REVIEWS_COLLECTION);
      const conditions = [];

      if (startDate) conditions.push(where('createdAt', '>=', Timestamp.fromDate(new Date(startDate))));
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(where('createdAt', '<=', Timestamp.fromDate(endOfDay)));
      }
      
      // [수정] 건물형태는 requests 컬렉션에 있으므로 클라이언트에서 필터링
      // if (selectedBuildingType !== "전체") {
      //   conditions.push(where('buildingType', '==', selectedBuildingType));
      // }
      
      // [수정] 상품명(서비스 타입) 필터링
      if (debouncedProductNameSearch) {
        conditions.push(where('serviceType', '>=', debouncedProductNameSearch));
        conditions.push(where('serviceType', '<=', debouncedProductNameSearch + '\uf8ff'));
      }

      let orderByField = 'createdAt';
      let orderByDirection = 'desc';
      // [수정] 평수 정렬은 requests 컬렉션에 있으므로 클라이언트에서 처리
      // switch...case for sorting on 'createdAt' remains
      if (sortOption === "오래된순") orderByDirection = 'asc';
      
      const dataQueryConstraints = [orderBy(orderByField, orderByDirection), ...conditions];
      const dataQuery = query(reviewsCollectionRef, ...dataQueryConstraints);
      
      const reviewsSnapshot = await getDocs(dataQuery);
      if (reviewsSnapshot.empty) {
        setReviews([]);
        setTotalItems(0);
        setLoading(false);
        return;
      }

      const reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      
      const requestIds = [...new Set(reviewsData.map(r => r.requestId).filter(Boolean))];

      let requestsMap = new Map();
      if (requestIds.length > 0) {
        const requestsQuery = query(collection(db, REQUESTS_COLLECTION), where(documentId(), 'in', requestIds));
        const requestsSnapshot = await getDocs(requestsQuery);
        requestsSnapshot.forEach(doc => requestsMap.set(doc.id, doc.data()));
      }

      let combinedData = reviewsData.map(review => {
        const requestData = requestsMap.get(review.requestId) || {};
        return {
          ...review,
          buildingType: requestData.buildingType || '정보 없음',
          areaSize: requestData.areaSize || '정보 없음',
          usageDate: requestData.requestDate?.toDate() || null,
        };
      });

      // [추가] 클라이언트 사이드 필터링 및 정렬
      if (selectedBuildingType !== "전체") {
        combinedData = combinedData.filter(item => item.buildingType === selectedBuildingType);
      }
      if (sortOption === "평수높은순") {
        combinedData.sort((a, b) => Number(b.areaSize) - Number(a.areaSize));
      } else if (sortOption === "평수낮은순") {
        combinedData.sort((a, b) => Number(a.areaSize) - Number(b.areaSize));
      }
      
      setTotalItems(combinedData.length);
      const paginatedReviews = combinedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      setReviews(paginatedReviews);

    } catch (err) {
      console.error(`Error fetching data: `, err);
      setError(`데이터를 불러오는 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, startDate, endDate, selectedBuildingType, debouncedProductNameSearch, sortOption]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleFilterReset = () => { /* ... */ };
  const handleSearch = () => { /* ... */ };
  const handleViewDetails = (reviewId) => router.push(`/admin/reviews/list/${reviewId}`);
  const handleSelectAll = (e) => { /* ... */ };
  const handleSelectSingle = (e, id) => { /* ... */ };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className={styles.pageContainer}>
      {/* 필터 및 검색 영역 */}
      <div className={styles.filterSection} style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* ... input fields for date, building type, product name ... */}
             <div className={styles.filterGroup}>
               <label htmlFor="startDate">리뷰등록일:</label>
               <input type="date" id="startDate" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1);}} className={styles.input} />
               <span style={{ margin: '0 5px' }}>~</span>
               <input type="date" id="endDate" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1);}} className={styles.input} />
             </div>
             <div className={styles.filterGroup}>
               <label htmlFor="buildingTypeFilter">건물형태:</label>
               <select id="buildingTypeFilter" value={selectedBuildingType} onChange={(e) => { setSelectedBuildingType(e.target.value); setCurrentPage(1);}} className={styles.filterDropdown}>
                 {BUILDING_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
               </select>
             </div>
             <div className={styles.filterGroup} style={{flexGrow: 1}}>
               <label htmlFor="productNameSearch">상품명:</label>
               <input type="text" id="productNameSearch" placeholder="상품명 검색" value={productNameSearch} onChange={(e) => setProductNameSearch(e.target.value)} className={styles.input} style={{width: '200px'}}/>
             </div>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="sortOption">정렬:</label>
          <select id="sortOption" value={sortOption} onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1);}} className={styles.filterDropdown}>
            {SORT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thCheckbox}><input type="checkbox" onChange={handleSelectAll} checked={reviews.length > 0 && selectedIds.length === reviews.length} /></th>
            <th className={styles.thNumber}>번호</th>
            <th className={styles.th}>리뷰번호</th>
            <th className={styles.th}>건물형태</th>
            <th className={styles.th}>평수</th>
            <th className={styles.thLeft}>이름</th>
            <th className={styles.thLeft} style={{minWidth: '250px'}}>내용</th>
            <th className={styles.th}>이용날짜</th>
            <th className={styles.thActions}>관리</th>
          </tr>
        </thead>
        <tbody>
          {loading && ( <tr><td colSpan={9} className={styles.centerTd}>로딩 중...</td></tr> )}
          {!loading && reviews.length === 0 && ( <tr><td colSpan={9} className={styles.centerTd}>해당 조건의 리뷰가 없습니다.</td></tr> )}
          {!loading && reviews.length > 0 && (
            reviews.map((review, index) => (
              <tr key={review.id}>
                <td className={styles.centerTd}><input type="checkbox" checked={selectedIds.includes(review.id)} onChange={(e) => handleSelectSingle(e, review.id)} /></td>
                <td className={styles.centerTd}>{(totalItems - ((currentPage - 1) * ITEMS_PER_PAGE)) - index}</td>
                <td className={styles.td}>{review.id.substring(0, 8)}</td>
                <td className={styles.td}>{review.buildingType}</td>
                <td className={styles.td}>{review.areaSize}</td>
                <td className={styles.tdLeft}>{review.userName}</td>
                <td className={styles.tdLeft} title={review.content}>
                  {review.content && review.content.length > 30 ? `${review.content.substring(0, 30)}...` : review.content}
                </td>
                <td className={styles.td}>{formatDate(review.usageDate)}</td>
                <td className={styles.centerTd}>
                  <button onClick={() => handleViewDetails(review.id)} className={styles.button} style={{padding: '5px 10px', fontSize: '13px'}}>자세히</button>
                </td>
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
