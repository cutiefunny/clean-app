// /app/admin/advertisements/page.js
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../board.module.css'; // 공통 CSS Module
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

const ITEMS_PER_PAGE = 10;
const TABS = ["전체", "사용중", "사용완료"];
const COLLECTION_NAME = "advertisements";

export default function AdvertisementsPage() {
  const router = useRouter();
  const [ads, setAds] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  // 검색어 디바운싱
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchAdvertisements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const adsCollectionRef = collection(db, COLLECTION_NAME);
      const q = query(adsCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const allAds = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      setAds(allAds);
    } catch (err) {
      console.error("Error fetching advertisements: ", err);
      setError("광고 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvertisements();
  }, [fetchAdvertisements]);

  // 필터링 및 페이지네이션 로직
  useEffect(() => {
    let newFilteredAds = ads;

    // 1. 검색어 필터링
    if (debouncedSearchTerm) {
      newFilteredAds = newFilteredAds.filter(ad => 
        ad.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // 2. 탭 필터링
    const now = new Date();
    if (activeTab === "사용중") {
      newFilteredAds = newFilteredAds.filter(ad => ad.isVisible && ad.startDate <= now && ad.endDate >= now);
    } else if (activeTab === "사용완료") {
      newFilteredAds = newFilteredAds.filter(ad => !ad.isVisible || ad.endDate < now);
    }

    setFilteredAds(newFilteredAds);
    setTotalItems(newFilteredAds.length);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로

  }, [ads, activeTab, debouncedSearchTerm]);


  const handleCreateNew = () => router.push('/admin/advertisements/new');
  const handleEdit = (id) => router.push(`/admin/advertisements/${id}/edit`);

  const handleDelete = async (id) => {
    if (window.confirm("정말로 이 광고를 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        // TODO: Firebase Storage에 연결된 이미지도 함께 삭제하는 로직 추가 권장
        alert("광고가 삭제되었습니다.");
        fetchAdvertisements(); // 목록 새로고침
      } catch (err) {
        setError(`삭제 중 오류 발생: ${err.message}`);
      }
    }
  };

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? paginatedAds.map(ad => ad.id) : []);
  };
  const handleSelectSingle = (e, id) => {
    setSelectedIds(prev => e.target.checked ? [...prev, id] : prev.filter(sid => sid !== id));
  };
  
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedAds = filteredAds.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className={styles.pageContainer}>
      <h2 className={styles.pageTitle}>광고(배너) 관리</h2>

      <div className={styles.filterSection} style={{justifyContent: 'space-between'}}>
        <div className={styles.searchInputContainer} style={{maxWidth: '400px'}}>
            <label htmlFor="searchTerm" style={{marginRight: '10px'}}>배너명:</label>
            <input
              type="text"
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.input}
            />
            <button className={styles.button}>검색</button>
        </div>
        <button onClick={handleCreateNew} className={styles.primaryButton}>신규</button>
      </div>

      <div className={styles.tabContainer}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? styles.tabButtonActive : styles.tabButton} >
            {tab}
          </button>
        ))}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thCheckbox}><input type="checkbox" onChange={handleSelectAll} checked={paginatedAds.length > 0 && selectedIds.length === paginatedAds.length} /></th>
            <th className={styles.thNumber}>번호</th>
            <th className={styles.thLeft}>배너명</th>
            <th className={styles.th}>광고게시기간</th>
            <th className={styles.thActions}>관리</th>
          </tr>
        </thead>
        <tbody>
          {loading && (<tr><td colSpan={5} className={styles.centerTd}>로딩 중...</td></tr>)}
          {!loading && paginatedAds.length === 0 && (<tr><td colSpan={5} className={styles.centerTd}>표시할 광고가 없습니다.</td></tr>)}
          {!loading && paginatedAds.map((ad, index) => (
            <tr key={ad.id}>
              <td className={styles.centerTd}><input type="checkbox" checked={selectedIds.includes(ad.id)} onChange={e => handleSelectSingle(e, ad.id)} /></td>
              <td className={styles.centerTd}>{(totalItems - (currentPage - 1) * ITEMS_PER_PAGE) - index}</td>
              <td className={styles.tdLeft}>{ad.name}</td>
              <td className={styles.centerTd}>{`${formatDate(ad.startDate)} ~ ${formatDate(ad.endDate)}`}</td>
              <td>
                <div className={styles.actionTdInnerDiv}>
                  <button onClick={() => handleEdit(ad.id)} className={styles.button} style={{backgroundColor: '#5cb85c', color: 'white'}}>수정</button>
                  <button onClick={() => handleDelete(ad.id)} className={styles.button} style={{backgroundColor: '#d9534f', color: 'white'}}>삭제</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && totalPages > 1 && (
        <div className={styles.paginationContainer}>
            {/* 페이지네이션 UI */}
        </div>
      )}
    </div>
  );
}