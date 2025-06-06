// /app/admin/review/list/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../board.module.css'; // 공통 CSS Module 임포트 (3단계 상위)
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp, // 날짜 필터링 및 데이터 변환 시 사용
  getCountFromServer, // 전체 아이템 수 계산
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp'; // Firebase db 객체

// 아이콘 SVG (필요시 사용)
const SearchIconSvg = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const CalendarIconSvg = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;


const ITEMS_PER_PAGE = 10; // 이미지에는 4개만 보이지만, 일반적인 게시판 수 고려
const BUILDING_TYPES = ["전체", "오피스텔", "아파트", "원룸", "빌라", "단독주택"]; // 건물형태 옵션 예시
const SORT_OPTIONS = ["최신순", "오래된순", "평수높은순", "평수낮은순"]; // 정렬 옵션 예시

const COLLECTION_NAME = "reviews"; // Firestore 컬렉션 이름

export default function ReviewListPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 필터 및 검색 상태 (이전과 동일)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBuildingType, setSelectedBuildingType] = useState(BUILDING_TYPES[0]);
  const [productNameSearch, setProductNameSearch] = useState(''); // "상품명" 검색어
  const [debouncedProductNameSearch, setDebouncedProductNameSearch] = useState('');
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);

  // 페이지네이션 상태 (이전과 동일)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  // 상품명 검색 디바운싱 (이전과 동일)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedProductNameSearch(productNameSearch);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [productNameSearch]);

  // Firestore에서 데이터 로드 함수 수정
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const reviewsCollectionRef = collection(db, COLLECTION_NAME);
      const conditions = []; // Firestore where 조건을 담을 배열

      // 날짜 필터링 (createdAt - 리뷰등록일 기준)
      if (startDate) {
        conditions.push(where('createdAt', '>=', Timestamp.fromDate(new Date(startDate))));
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push(where('createdAt', '<=', Timestamp.fromDate(endOfDay)));
      }

      // 건물형태 필터링
      if (selectedBuildingType !== "전체") {
        conditions.push(where('buildingType', '==', selectedBuildingType));
      }

      // 상품명 검색 (Firestore에서는 'productName' 필드에 대한 시작 문자열 검색 예시)
      // Firestore는 기본적으로 '포함' 검색을 직접 지원하지 않으므로,
      // 더 정교한 검색은 Algolia 등 외부 검색 엔진 연동을 권장합니다.
      if (debouncedProductNameSearch) {
        const lowerSearch = debouncedProductNameSearch.toLowerCase();
        // 'productName' 필드가 있다고 가정
        conditions.push(where('productName', '>=', lowerSearch));
        conditions.push(where('productName', '<=', lowerSearch + '\uf8ff'));
      }

      // 정렬 조건 적용
      let orderByField = 'createdAt'; // 기본 정렬 필드
      let orderByDirection = 'desc'; // 기본 정렬 방향 (최신순)

      switch (sortOption) {
        case "오래된순":
          orderByDirection = 'asc';
          break;
        case "평수높은순":
          orderByField = 'areaSize'; // Firestore 필드명 'areaSize' 가정
          orderByDirection = 'desc';
          break;
        case "평수낮은순":
          orderByField = 'areaSize';
          orderByDirection = 'asc';
          break;
        case "최신순":
        default:
          orderByField = 'createdAt';
          orderByDirection = 'desc';
          break;
      }
      
      // 최종 쿼리 생성 (필터 조건 + 정렬)
      // Firestore에서 여러 필드에 대해 범위/부등호 필터를 사용하거나,
      // 정렬 필드와 다른 필드에 범위/부등호 필터를 사용하려면 복합 색인이 필요할 수 있습니다.
      const dataQueryConstraints = [orderBy(orderByField, orderByDirection), ...conditions];
      let dataQuery = query(reviewsCollectionRef, ...dataQueryConstraints);
      
      // 전체 아이템 수 계산 (필터링된 결과에 대해, 정렬은 제외)
      const countQuery = query(reviewsCollectionRef, ...conditions);
      const snapshotCount = await getCountFromServer(countQuery);
      setTotalItems(snapshotCount.data().count);

      // 현재 페이지 데이터 가져오기 (클라이언트 사이드 페이지네이션)
      // 참고: 대량 데이터의 경우 Firestore의 limit()과 startAfter()를 사용한 서버 사이드 페이지네이션이 훨씬 효율적입니다.
      // 이 예제에서는 우선 필터링/정렬된 모든 결과를 가져온 후 클라이언트에서 slice합니다.
      const querySnapshot = await getDocs(dataQuery);
      let docsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Firestore Timestamp를 JavaScript Date 객체로 변환
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
        usageDate: doc.data().usageDate?.toDate ? doc.data().usageDate.toDate() : new Date(doc.data().usageDate),
      }));

      const paginatedReviews = docsData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
      setReviews(paginatedReviews);

    } catch (err) {
      console.error(`Error fetching ${COLLECTION_NAME}: `, err);
      setError(`데이터를 불러오는 중 오류가 발생했습니다. Firestore 색인(index) 및 보안 규칙을 확인해주세요. 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, startDate, endDate, selectedBuildingType, debouncedProductNameSearch, sortOption]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleFilterReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedBuildingType(BUILDING_TYPES[0]);
    setProductNameSearch('');
    // setDebouncedProductNameSearch(''); // searchTerm useEffect가 처리
    setSortOption(SORT_OPTIONS[0]);
    setCurrentPage(1);
  };
  
  const handleSearch = () => {
    setDebouncedProductNameSearch(productNameSearch); 
    setCurrentPage(1);
  };


  const handleViewDetails = (reviewId) => {
    // TODO: 리뷰 상세 페이지로 이동 또는 모달 표시
    // alert(`리뷰 ID ${reviewId} 상세보기`);
    router.push(`/admin/reviews/list/${reviewId}`);
  };

  const handleSelectAll = (e) => { setSelectedIds(e.target.checked ? reviews.map(r => r.id) : []); };
  const handleSelectSingle = (e, id) => { setSelectedIds(prev => e.target.checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id)); };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className={styles.pageContainer}>
      {/* 필터 및 검색 영역 */}
      <div className={styles.filterSection} style={{ justifyContent: 'space-between' }}> {/* 양쪽 정렬 위해 */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                <td className={styles.td}>{review.reviewId}</td>
                <td className={styles.td}>{review.buildingType}</td>
                <td className={styles.td}>{review.areaSize}</td>
                <td className={styles.tdLeft}>{review.userName}</td>
                <td className={styles.tdLeft} title={review.content}>
                  {review.content.length > 30 ? `${review.content.substring(0, 30)}...` : review.content}
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