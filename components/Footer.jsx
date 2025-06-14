// /components/Footer.js
'use client';

import React, { useState, useEffect } from 'react';
import styles from './Footer.module.css';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp'; // Firebase 경로 확인

const DOCUMENT_ID = "mainDetails";
const COLLECTION_NAME = "companyInfo";

export default function Footer() {
  // [수정] 여러 데이터를 한 번에 관리하기 위해 상태를 객체로 변경
  const [footerData, setFooterData] = useState({
    footerContent: '',
    phoneNumber: '',
    serviceHours: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFooterInfo = async () => {
      try {
        const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // [수정] Firestore에서 모든 관련 데이터를 가져와 상태에 설정
          setFooterData({
            footerContent: data.footerContent || '회사 정보가 없습니다.',
            phoneNumber: data.customerServicePhone || '전화번호 정보 없음',
            serviceHours: data.customerServiceHours || '상담시간 정보 없음',
          });
        } else {
          console.log("No footer content found in Firestore.");
          setFooterData({
            footerContent: '회사 정보 문서를 찾을 수 없습니다.',
            phoneNumber: '-',
            serviceHours: '-',
          });
        }
      } catch (error) {
        console.error("Error fetching footer content: ", error);
        setFooterData({
          footerContent: '정보를 불러오는 중 오류가 발생했습니다.',
          phoneNumber: '-',
          serviceHours: '-',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFooterInfo();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  return (
    <footer className={styles.footer}>
      <div style={{ paddingTop: '10px', paddingBottom: '20px', width: '100%', alignItems: 'center' }}>
        <span className={styles.callCenter}>
          고객센터 <img src="/images/phone.png" alt="Phone Icon" style={{ verticalAlign: 'middle' }} /> 
          {/* [수정] Firestore에서 가져온 전화번호 표시 */}
          <span className={styles.phoneNumber}>{footerData.phoneNumber}</span>
        </span>
        <span className={styles.callCenter}>
          {/* [수정] Firestore에서 가져온 상담시간 표시 */}
          고객센터 상담시간 {footerData.serviceHours}
        </span>
      </div>
      <div className={styles.company}>
        <Link href="/company-info" className={styles.footerLink}>
          <img src="/images/company.png" alt="Company Icon" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          회사소개
        </Link>
        <Link href="/faq" className={styles.footerLink} style={{ marginLeft: '20px' }}>
          <img src="/images/support.png" alt="Support Icon" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          고객지원
        </Link>
      </div>
      <div className={styles.address}>
        {loading ? (
          '로딩 중...'
        ) : (
          <>
            {footerData.footerContent.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
            <br />
            copyrightⓒ All rights reserved.
          </>
        )}
      </div>
    </footer>
  );
};
