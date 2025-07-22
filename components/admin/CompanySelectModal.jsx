// /components/admin/CompanySelectModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where, doc, getDoc as getSingleDoc } from 'firebase/firestore'; // getSingleDoc as alias 추가
import { db } from '@/lib/firebase/clientApp';
import styles from './CompanySelectModal.module.css';

// 아이콘 SVG
const SearchIconSvg = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

export default function CompanySelectModal({ isOpen, onClose, onSelect }) {
  const [allCompanies, setAllCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 모달이 열릴 때 업체 목록을 불러옵니다.
  useEffect(() => {
    if (isOpen) {
      const fetchCompanies = async () => {
        setLoading(true);
        try {
            // 1. settings/pointSettings 문서에서 pointsToApply 값 불러오기
            const settingsDocRef = doc(db, 'settings', 'pointSettings');
            const settingsDocSnap = await getSingleDoc(settingsDocRef); // 'getSingleDoc'으로 별칭 사용

            let pointsToApply = 0;
            if (settingsDocSnap.exists()) {
                pointsToApply = settingsDocSnap.data().pointsToApply || 0;
            } else {
                console.warn("settings/pointSettings 문서가 존재하지 않습니다. 포인트 기준값은 0으로 설정됩니다.");
                // 필요하다면 사용자에게 알림을 띄우는 등의 추가 처리를 할 수 있습니다.
            }

          // 'registrationStatus'가 '신청완료'이고 'currentPoints'가 pointsToApply보다 크거나 같은 업체만 가져오도록 where 조건 추가
          const cleanersQuery = query(
            collection(db, 'cleaners'),
            where("registrationStatus", "==", "신청완료"),
            where("currentPoints", ">=", pointsToApply), // currentPoints가 pointsToApply보다 크거나 같으면 포함
            orderBy('businessName', 'asc')
          );
          
          const querySnapshot = await getDocs(cleanersQuery);
          const fetchedCompanies = querySnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().businessName,
            contactPhone: doc.data().contactPhone || '',
          }));
          setAllCompanies(fetchedCompanies);
          setFilteredCompanies(fetchedCompanies);
        } catch (error) {
          console.error("Error fetching companies: ", error);
        } finally {
          setLoading(false);
        }
      };
      fetchCompanies();
    } else {
      // 모달이 닫힐 때 상태 초기화
      setSearchTerm('');
      setSelectedCompanies([]);
    }
  }, [isOpen]); // isOpen이 변경될 때만 fetchCompanies 호출

  // 검색어에 따라 업체 목록을 필터링합니다.
  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = allCompanies.filter(company =>
      company.name.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredCompanies(filteredData);
  }, [searchTerm, allCompanies]);

  // 체크박스 선택/해제 핸들러
  const handleCheckboxChange = (company, isChecked) => {
    if (isChecked) {
      setSelectedCompanies(prev => [...prev, company]);
    } else {
      setSelectedCompanies(prev => prev.filter(c => c.id !== company.id));
    }
  };

  // '전송' 버튼 클릭 핸들러
  const handleConfirm = () => {
    if (selectedCompanies.length > 0) {
      onSelect(selectedCompanies); // 선택된 회사들의 배열을 전달
    } else {
      alert('업체를 하나 이상 선택해주세요.');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>청소업체 검색 (복수 선택 가능)</h3>
        
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="업체명 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.searchIconWrapper}>
            <SearchIconSvg />
          </div>
        </div>

        {/* 선택된 업체 태그 표시 */}
        {selectedCompanies.length > 0 && (
            <div className={styles.selectedTagsContainer}>
                {selectedCompanies.map(company => (
                    <div key={company.id} className={styles.tag}>
                        <span>{company.name}</span>
                        <button onClick={() => handleCheckboxChange(company, false)}>&times;</button>
                    </div>
                ))}
            </div>
        )}

        <div className={styles.companyList}>
          {loading && <p>업체 목록을 불러오는 중...</p>}
          {!loading && filteredCompanies.map(company => (
            <label key={company.id} className={styles.companyItem}>
              <input
                type="checkbox"
                checked={selectedCompanies.some(c => c.id === company.id)}
                onChange={(e) => handleCheckboxChange(company, e.target.checked)}
                className={styles.checkboxInput}
              />
              <span className={styles.companyName}>{company.name}</span>
            </label>
          ))}
        </div>

        <div className={styles.buttonContainer}>
          <button onClick={onClose} className={styles.secondaryButton}>취소</button>
          <button onClick={handleConfirm} className={styles.primaryButton} disabled={selectedCompanies.length === 0}>전송</button>
        </div>
      </div>
    </div>
  );
}