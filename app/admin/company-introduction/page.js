// /app/admin/company-introduction/page.js
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../board.module.css'; // 공통 CSS Module
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

const ITEMS_PER_PAGE = 10;
const TABS = ["전체", "사용중", "사용완료"];
const COLLECTION_NAME = "companyIntroductions"; // Firestore 컬렉션 이름

export default function CompanyIntroductionPage() {
  const router = useRouter();
  const [introductions, setIntroductions] = useState([]);
  const [filteredIntros, setFilteredIntros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchIntroductions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const collectionRef = collection(db, COLLECTION_NAME);
      const q = query(collectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const allIntros = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      setIntroductions(allIntros);
    } catch (err) {
      console.error("Error fetching company introductions: ", err);
      setError("업체소개 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntroductions();
  }, [fetchIntroductions]);

  useEffect(() => {
    let newFiltered = introductions;
    if (debouncedSearchTerm) {
      newFiltered = newFiltered.filter(intro => 
        intro.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    const now = new Date();
    if (activeTab === "사용중") {
      newFiltered = newFiltered.filter(intro => intro.isVisible && intro.startDate <= now && intro.endDate >= now);
    } else if (activeTab === "사용완료") {
      newFiltered = newFiltered.filter(intro => !intro.isVisible || intro.endDate < now);
    }

    setFilteredIntros(newFiltered);
    setTotalItems(newFiltered.length);
    setCurrentPage(1);

  }, [introductions, activeTab, debouncedSearchTerm]);

  const handleCreateNew = () => router.push('/admin/company-introduction/new');
  const handleEdit = (id) => router.push(`/admin/company-introduction/${id}/edit`);
  const handleDelete = async (id) => {
    if (window.confirm("정말로 이 소개 항목을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        alert("삭제되었습니다.");
        fetchIntroductions();
      } catch (err) {
        setError(`삭제 중 오류 발생: ${err.message}`);
      }
    }
  };

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? paginatedIntros.map(i => i.id) : []);
  };
  const handleSelectSingle = (e, id) => {
    setSelectedIds(prev => e.target.checked ? [...prev, id] : prev.filter(sid => sid !== id));
  };
  
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('ko-KR') : 'N/A';

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedIntros = filteredIntros.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className={styles.pageContainer}>
      <h2 className={styles.pageTitle}>업체소개 관리</h2>
      <div className={styles.filterSection} style={{justifyContent: 'space-between'}}>
        <div className={styles.searchInputContainer} style={{maxWidth: '400px'}}>
            <label htmlFor="searchTerm" style={{marginRight: '10px'}}>소개명:</label>
            <input type="text" id="searchTerm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.input} />
            <button className={styles.button}>검색</button>
        </div>
        <button onClick={handleCreateNew} className={styles.primaryButton}>신규</button>
      </div>
      <div className={styles.tabContainer}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? styles.tabButtonActive : styles.tabButton}>{tab}</button>
        ))}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thCheckbox}><input type="checkbox" onChange={handleSelectAll} /></th>
            <th className={styles.thNumber}>번호</th>
            <th className={styles.thLeft}>소개명</th>
            <th className={styles.th}>소개게시기간</th>
            <th className={styles.thActions}>관리</th>
          </tr>
        </thead>
        <tbody>
          {loading && (<tr><td colSpan={5} className={styles.centerTd}>로딩 중...</td></tr>)}
          {!loading && paginatedIntros.length === 0 && (<tr><td colSpan={5} className={styles.centerTd}>표시할 항목이 없습니다.</td></tr>)}
          {!loading && paginatedIntros.map((intro, index) => (
            <tr key={intro.id}>
              <td className={styles.centerTd}><input type="checkbox" checked={selectedIds.includes(intro.id)} onChange={e => handleSelectSingle(e, intro.id)} /></td>
              <td className={styles.centerTd}>{(totalItems - (currentPage - 1) * ITEMS_PER_PAGE) - index}</td>
              <td className={styles.tdLeft}>{intro.name}</td>
              <td className={styles.centerTd}>{`${formatDate(intro.startDate)} ~ ${formatDate(intro.endDate)}`}</td>
              <td>
                <div className={styles.actionTdInnerDiv}>
                  <button onClick={() => handleEdit(intro.id)} className={styles.button} style={{backgroundColor: '#5cb85c', color: 'white'}}>수정</button>
                  <button onClick={() => handleDelete(intro.id)} className={styles.button} style={{backgroundColor: '#d9534f', color: 'white'}}>삭제</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 페이지네이션 */}
    </div>
  );
}