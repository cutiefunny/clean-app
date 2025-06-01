// components/LocationSelectModal.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './LocationSelectModal.module.css'; // CSS 모듈 import

// 목업 데이터 (실제로는 props로 받거나 API를 통해 가져오는 것이 좋습니다)
const locationData = {
  "서울": {
    "강남/서초": ["서울시 강남구 개포동", "서울시 강남구 논현동", "서울시 강남구 대치동", "서울시 서초구 서초동", "서울시 서초구 반포동"],
    "송파/강동": ["서울시 송파구 잠실동", "서울시 송파구 신천동", "서울시 강동구 천호동", "서울시 강동구 성내동"],
    "용산/이태원/한남": ["서울시 용산구 이태원동", "서울시 용산구 한남동", "서울시 용산구 동빙고동", "서울시 용산구 보광동"],
    "종로/중구": ["서울시 종로구 사직동", "서울시 종로구 삼청동", "서울시 중구 명동", "서울시 중구 을지로동"],
    "마포/홍대/신촌": ["서울시 마포구 합정동", "서울시 마포구 서교동", "서울시 서대문구 신촌동", "서울시 마포구 상수동"],
  },
  "경기": {
    "수원시": ["수원시 장안구 정자동", "수원시 팔달구 인계동", "수원시 영통구 영통동"],
    "성남시": ["성남시 분당구 서현동", "성남시 분당구 정자동", "성남시 수정구 신흥동"],
    "고양시": ["고양시 일산동구 장항동", "고양시 일산서구 대화동", "고양시 덕양구 행신동"],
  },
  "인천": {
    "남동구": ["인천 남동구 구월동", "인천 남동구 논현동"],
    "부평구": ["인천 부평구 부평동", "인천 부평구 산곡동"],
  },
  // 필요에 따라 다른 시/도 및 하위 지역 데이터 추가
  //https://sgisapi.kostat.go.kr/OpenAPI3/addr/stage.json?accessToken=3922e227-3179-4783-b266-848204a99138&cd=11 사용 예정
};

export default function LocationSelectModal({ isOpen, onClose, onSelect, currentAddress = "" }) {
  const [siDoList] = useState(Object.keys(locationData)); // 컴포넌트 마운트 시 한 번만 설정
  const [selectedSiDo, setSelectedSiDo] = useState('');
  
  const [siGunGuGroupList, setSiGunGuGroupList] = useState([]);
  const [selectedSiGunGuGroup, setSelectedSiGunGuGroup] = useState('');
  
  const [dongList, setDongList] = useState([]);
  const [selectedDong, setSelectedDong] = useState('');

  const [expandedSiGunGuGroup, setExpandedSiGunGuGroup] = useState(null);

  // currentAddress prop이 변경될 때 초기 선택 상태 업데이트
  useEffect(() => {
    if (currentAddress) {
      const parts = currentAddress.split(' ');
      if (parts.length > 0 && siDoList.includes(parts[0])) {
        setSelectedSiDo(parts[0]);
        // 시/도 선택 후, 해당 시/도의 시군구 그룹 목록을 설정합니다.
        const SGGroups = locationData[parts[0]] ? Object.keys(locationData[parts[0]]) : [];
        setSiGunGuGroupList(SGGroups);

        if (parts.length > 1) {
          // currentAddress에서 시군구 그룹과 동을 추론하는 로직이 필요합니다.
          // 예: "서울 용산구 이태원동" -> "용산/이태원/한남" 그룹, "용산구 이태원동" 동
          // 이 부분은 locationData의 구조와 currentAddress 형식에 따라 달라집니다.
          // 간단한 예시로, parts[1] + parts[2] (구 + 동) 가 selectedDong과 일치하는지 확인
          // 또는 currentAddress를 기반으로 selectedSiGunGuGroup과 selectedDong을 설정합니다.
          // 여기서는 단순화를 위해, 만약 currentAddress에 동 정보까지 있다면 해당 동을 selectedDong으로 설정합니다.
          if (parts.join(' ') === currentAddress) { // 전체 주소가 동 레벨까지 일치한다면
             const matchingSiDo = locationData[parts[0]];
             if(matchingSiDo) {
                for (const group in matchingSiDo) {
                    if (matchingSiDo[group].includes(currentAddress)) {
                        setSelectedSiGunGuGroup(group);
                        setExpandedSiGunGuGroup(group); // 해당 그룹 펼치기
                        setDongList(matchingSiDo[group]);
                        setSelectedDong(currentAddress);
                        break;
                    }
                }
             }
          }
        }
      } else { // currentAddress가 없거나 유효하지 않으면 초기화
        setSelectedSiDo('');
      }
    } else {
        setSelectedSiDo(''); // currentAddress가 "" 이면 초기화
    }
  }, [currentAddress, siDoList]); // isOpen을 추가하여 모달이 열릴 때마다 currentAddress를 반영하도록 할 수도 있습니다.


  const handleSiDoSelect = useCallback((sido) => {
    setSelectedSiDo(sido);
    setSiGunGuGroupList(locationData[sido] ? Object.keys(locationData[sido]) : []);
    setSelectedSiGunGuGroup('');
    setDongList([]);
    setSelectedDong('');
    setExpandedSiGunGuGroup(null);
  }, []);

  const toggleSiGunGuGroup = useCallback((groupKey) => {
    setExpandedSiGunGuGroup(prevGroup => {
      const newExpandedGroup = prevGroup === groupKey ? null : groupKey;
      if (newExpandedGroup && locationData[selectedSiDo]?.[newExpandedGroup]) {
        setSelectedSiGunGuGroup(newExpandedGroup); // 현재 선택된 그룹으로 설정
        setDongList(locationData[selectedSiDo][newExpandedGroup]);
        setSelectedDong(''); // 그룹 변경 시 동 선택 초기화
      } else if (!newExpandedGroup) {
        // 그룹이 닫힐 때 선택된 그룹은 유지하거나 초기화 할 수 있습니다.
        // setSelectedSiGunGuGroup(''); // 선택적으로 그룹 선택도 초기화
      }
      return newExpandedGroup;
    });
  }, [selectedSiDo]);
  
  const handleDongSelect = useCallback((dong) => {
    setSelectedDong(dong);
  }, []);

  const handleConfirmSelection = () => {
    if (selectedSiDo && selectedDong) {
      onSelect(selectedDong); // 최종 선택된 동 정보(예: "용산구 이태원동") 전달
      onClose(); // 모달 닫기
    } else {
      alert("모든 지역 단계를 선택해주세요 (시/도, 시/군/구 그룹, 동).");
    }
  };

  const displaySelectedPath = () => {
    if (selectedDong) return selectedDong;
    if (selectedSiGunGuGroup) return `${selectedSiDo} ${selectedSiGunGuGroup.split('/')[0]}구 (동 선택)`; // 예시
    if (selectedSiDo) return `${selectedSiDo} (세부 지역 선택)`;
    return "지역을 선택해주세요";
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>지역선택</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>

        <div className={styles.selectedPathDisplay}>
          {displaySelectedPath()}
        </div>

        <div className={styles.selectionArea}>
          <div className={styles.siDoList}>
            {siDoList.map(sido => (
              <button
                key={sido}
                className={`${styles.siDoItem} ${selectedSiDo === sido ? styles.active : ''}`}
                onClick={() => handleSiDoSelect(sido)}
              >
                {sido}
              </button>
            ))}
          </div>

          <div className={styles.siGunGuDongList}>
            {selectedSiDo ? (
              siGunGuGroupList.length > 0 ? (
                siGunGuGroupList.map(groupKey => (
                  <div key={groupKey} className={styles.siGunGuGroup}>
                    <button
                      className={`${styles.siGunGuGroupHeader} ${expandedSiGunGuGroup === groupKey ? styles.expanded : ''}`}
                      onClick={() => toggleSiGunGuGroup(groupKey)}
                    >
                      {groupKey}
                      <span className={styles.arrow}>{expandedSiGunGuGroup === groupKey ? '▲' : '▼'}</span>
                    </button>
                    {expandedSiGunGuGroup === groupKey && (
                      <div className={styles.dongGrid}>
                        {dongList.map(dong => (
                          <button
                            key={dong}
                            className={`${styles.dongItem} ${selectedDong === dong ? styles.activeDong : ''}`}
                            onClick={() => handleDongSelect(dong)}
                          >
                            {dong.split(' ').pop()} {/* "용산구 이태원동"에서 "이태원동"만 표시 */}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className={styles.guideText}>선택하신 시/도에 대한 세부 지역 정보가 없습니다.</p>
              )
            ) : (
              <p className={styles.guideText}>시/도를 먼저 선택해주세요.</p>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button 
            onClick={handleConfirmSelection} 
            className={styles.confirmButton}
            disabled={!selectedDong} // 동까지 선택해야 활성화
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
}