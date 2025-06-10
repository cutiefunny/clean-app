// components/LocationSelectModal.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './LocationSelectModal.module.css';

// API 정보
const SERVICE_ID = process.env.NEXT_PUBLIC_SERVICE_ID;
const SECURITY_KEY = process.env.NEXT_PUBLIC_SECURITY_KEY;
const AUTH_URL = "https://sgisapi.kostat.go.kr/OpenAPI3/auth/authentication.json";
const ADDR_URL = "https://sgisapi.kostat.go.kr/OpenAPI3/addr/stage.json";

// AccessToken을 발급받고 관리하는 커스텀 훅 (선택사항이지만 권장)
function useSgisToken() {
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const getAccessToken = async () => {
      try {
        const response = await fetch(`${AUTH_URL}?consumer_key=${SERVICE_ID}&consumer_secret=${SECURITY_KEY}`);
        const data = await response.json();
        if (data.result && data.result.accessToken) {
          setAccessToken(data.result.accessToken);
        } else {
          console.error("Failed to get SGIS access token:", data.errMsg);
        }
      } catch (error) {
        console.error("Error fetching SGIS access token:", error);
      }
    };
    getAccessToken();
  }, []);

  return accessToken;
}


export default function LocationSelectModal({ isOpen, onClose, onSelect }) {
  const accessToken = useSgisToken(); // AccessToken 발급

  const [siDoList, setSiDoList] = useState([]);
  const [siGunGuList, setSiGunGuList] = useState([]);
  const [dongList, setDongList] = useState([]);

  const [selectedSiDo, setSelectedSiDo] = useState(null); // {cd: '11', addr_name: '서울특별시'} 형태
  const [selectedSiGunGu, setSelectedSiGunGu] = useState(null);
  const [selectedDong, setSelectedDong] = useState(null);

  const [expandedSiGunGuCd, setExpandedSiGunGuCd] = useState(null);
  
  const [loading, setLoading] = useState({ sido: false, sigungu: false, dong: false });
  const [error, setError] = useState('');
  
  // 1. 시/도 목록 불러오기 (최초 1회)
  useEffect(() => {
    if (isOpen && accessToken && siDoList.length === 0) {
      const fetchSiDo = async () => {
        setLoading(prev => ({...prev, sido: true}));
        setError('');
        try {
          const response = await fetch(`${ADDR_URL}?accessToken=${accessToken}`);
          const data = await response.json();
          if (data.errCd === 0) {
            setSiDoList(data.result);
          } else {
            setError(data.errMsg);
          }
        } catch (err) {
          setError('시/도 목록을 불러오는 데 실패했습니다.');
        } finally {
          setLoading(prev => ({...prev, sido: false}));
        }
      };
      fetchSiDo();
    }
  }, [isOpen, accessToken, siDoList.length]);

  // 시/도 선택 핸들러
  const handleSiDoSelect = useCallback((sido) => {
    setSelectedSiDo(sido);
    setSelectedSiGunGu(null);
    setSelectedDong(null);
    setExpandedSiGunGuCd(null);
    setDongList([]);

    const fetchSiGunGu = async () => {
      if (!accessToken) return;
      setLoading(prev => ({ ...prev, sigungu: true }));
      setError('');
      setSiGunGuList([]);
      try {
        const response = await fetch(`${ADDR_URL}?accessToken=${accessToken}&cd=${sido.cd}`);
        const data = await response.json();
        if (data.errCd === 0) {
          setSiGunGuList(data.result);
        } else { setError(data.errMsg); }
      } catch (err) { setError('시/군/구 목록 로딩 실패'); } 
      finally { setLoading(prev => ({ ...prev, sigungu: false })); }
    };
    fetchSiGunGu();
  }, [accessToken]);

  // 시/군/구 그룹 토글(열고 닫기) 핸들러
  const toggleSiGunGuGroup = useCallback((sigungu) => {
    const isOpening = expandedSiGunGuCd !== sigungu.cd;
    setExpandedSiGunGuCd(isOpening ? sigungu.cd : null);
    setSelectedSiGunGu(sigungu);
    setSelectedDong(null);
    setDongList([]);

    if (isOpening && accessToken) {
      const fetchDong = async () => {
        setLoading(prev => ({ ...prev, dong: true }));
        setError('');
        try {
          const response = await fetch(`${ADDR_URL}?accessToken=${accessToken}&cd=${sigungu.cd}`);
          const data = await response.json();
          if (data.errCd === 0) {
            setDongList(data.result);
          } else { setError(data.errMsg); }
        } catch (err) { setError('읍/면/동 목록 로딩 실패'); }
        finally { setLoading(prev => ({ ...prev, dong: false })); }
      };
      fetchDong();
    }
  }, [accessToken, expandedSiGunGuCd]);

  const handleDongSelect = useCallback((dong) => {
    setSelectedDong(dong);
  }, []);
  
  // 2. 시/군/구 목록 불러오기 (시/도가 선택될 때마다)
  useEffect(() => {
    if (selectedSiDo?.cd) {
      const fetchSiGunGu = async () => {
        setLoading(prev => ({...prev, sigungu: true}));
        setError('');
        setSiGunGuList([]); // 초기화
        setDongList([]);
        try {
          const response = await fetch(`${ADDR_URL}?accessToken=${accessToken}&cd=${selectedSiDo.cd}`);
          const data = await response.json();
          if (data.errCd === 0) {
            setSiGunGuList(data.result);
          } else {
            setError(data.errMsg);
          }
        } catch (err) {
          setError('시/군/구 목록을 불러오는 데 실패했습니다.');
        } finally {
          setLoading(prev => ({...prev, sigungu: false}));
        }
      };
      fetchSiGunGu();
    }
  }, [selectedSiDo, accessToken]);
  
  // 3. 읍/면/동 목록 불러오기 (시/군/구가 선택될 때마다)
  useEffect(() => {
    if (selectedSiGunGu?.cd) {
      const fetchDong = async () => {
        setLoading(prev => ({...prev, dong: true}));
        setError('');
        setDongList([]); // 초기화
        try {
          const response = await fetch(`${ADDR_URL}?accessToken=${accessToken}&cd=${selectedSiGunGu.cd}`);
          const data = await response.json();
          if (data.errCd === 0) {
            setDongList(data.result);
          } else {
            setError(data.errMsg);
          }
        } catch (err) {
          setError('읍/면/동 목록을 불러오는 데 실패했습니다.');
        } finally {
          setLoading(prev => ({...prev, dong: false}));
        }
      };
      fetchDong();
    }
  }, [selectedSiGunGu, accessToken]);

  const handleSelect = (level, item) => {
    if (level === 'sido') {
      setSelectedSiDo(item);
      setSelectedSiGunGu(null);
      setSelectedDong(null);
    } else if (level === 'sigungu') {
      setSelectedSiGunGu(item);
      setSelectedDong(null);
    } else if (level === 'dong') {
      setSelectedDong(item);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedDong) {
      const fullAddress = `${selectedSiDo.addr_name} ${selectedSiGunGu.addr_name} ${selectedDong.addr_name}`;
      onSelect(fullAddress);
      onClose();
    } else {
      alert("읍/면/동까지 모두 선택해주세요.");
    }
  };
  
  const displaySelectedPath = () => {
    if (selectedDong) return `${selectedSiDo.addr_name} ${selectedSiGunGu.addr_name} ${selectedDong.addr_name}`;
    if (selectedSiGunGu) return `${selectedSiDo.addr_name} ${selectedSiGunGu.addr_name} (동 선택)`;
    if (selectedSiDo) return `${selectedSiDo.addr_name} (세부 지역 선택)`;
    return "지역을 선택해주세요";
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>지역선택</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <div className={styles.selectedPathDisplay}>{displaySelectedPath()}</div>
        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.selectionArea}>
          {/* 시/도 리스트 (왼쪽 컬럼) */}
          <div className={styles.siDoList}>
            {siDoList.map(sido => (
              <button key={sido.cd} onClick={() => handleSiDoSelect(sido)} className={`${styles.siDoItem} ${selectedSiDo?.cd === sido.cd ? styles.active : ''}`}>
                {sido.addr_name}
              </button>
            ))}
          </div>

          {/* 시/군/구 및 동 리스트 (오른쪽 컬럼) */}
          <div className={styles.detailsList}>
            {selectedSiDo ? (
              loading.sigungu ? <p className={styles.guideText}>로딩 중...</p> : 
              siGunGuList.map(sigungu => (
                <div key={sigungu.cd} className={styles.siGunGuGroup}>
                  <button onClick={() => toggleSiGunGuGroup(sigungu)} className={`${styles.siGunGuHeader} ${expandedSiGunGuCd === sigungu.cd ? styles.expanded : ''}`}>
                    {sigungu.addr_name}
                    <span className={styles.arrow}>{expandedSiGunGuCd === sigungu.cd ? '▲' : '▼'}</span>
                  </button>
                  {expandedSiGunGuCd === sigungu.cd && (
                    <div className={styles.dongGrid}>
                      {loading.dong ? <p>로딩 중...</p> : dongList.map(dong => (
                        <button key={dong.cd} onClick={() => handleDongSelect(dong)} className={`${styles.dongItem} ${selectedDong?.cd === dong.cd ? styles.activeDong : ''}`}>
                          {dong.addr_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : <p className={styles.guideText}>시/도를 먼저 선택해주세요.</p>
            }
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={handleConfirmSelection} className={styles.confirmButton} disabled={!selectedDong}>
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
}