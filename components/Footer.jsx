
import React from 'react';
import styles from './Footer.module.css';


const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div style={{ paddingTop: '10px', paddingBottom: '20px', width: '100%', alignItems: 'center' }}>
                <span className={styles.callCenter}>
                고객센터 <img src="/images/phone.png" alt="Phone Icon" style={{verticalAlign: 'middle'}} /> <span className={styles.phoneNumber}>02-123-4567</span>
                </span>
                <span className={styles.callCenter}>
                고객센터 상담시간 09:00~20:00
                </span>
            </div>
            <div className={styles.company}>
                <img src="/images/company.png" alt="Company Icon" style={{verticalAlign: 'middle'}} /> 회사소개 <img src="/images/support.png" alt="Support Icon" style={{verticalAlign: 'middle', paddingLeft: '10px'}} /> 고객지원
            </div>
            <div className={styles.address}>
                (주)픽큐 | 대표 : 홍길동 | 서울시 강남구 논현로 K빌딩 1025호
                <br />
                서울시 강남구 논현로 K빌딩 1025호 | 02-1234-5678
                <br />
                gildong@naver.com | 사업자 등록번호 1234-567890
                <br />
                개인정보관리책임자 : 홍길동 | 호스팅제공자 : 홍길동
                <br />
                통신판매업(제2025-서울강남-1234호)
                <br />
                <br />
                copyrightⓒ All rights reserved.</div>
        </footer>
        );
};

export default Footer;