// ReviewCard.jsx - 수정된 방식
import React from 'react';
import styles from './reviewCard.module.css'; // CSS 모듈을 'styles' 객체로 가져옵니다.

function ReviewCard({ review }) {
    return (
        // styles 객체를 통해 CSS 모듈의 클래스에 접근합니다.
        <div className={styles.reviewCard}> 
            <div className='horizontalAlign' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className={styles.reviewTitle} style={{ textAlign: 'left' }}>{review.cleaningType}</h3>
                <div className={styles.detailButtonStyle} style={{ textAlign: 'right' }}>
                    자세히 보기 <img src="/images/right.png" alt="자세히 보기" onClick={() => window.location.href = `/detail/${review.id}`} />
                </div>
            </div>
            <table className={styles.reviewTable} style={{ width: '100%', textAlign: 'left' }}>
                <tbody>
                    <tr className={styles.reviewTableRow}>
                        <th className={styles.reviewTableHeader} style={{ width: '30%' }}>이용일</th>
                        <td className={styles.reviewTableData} style={{ width: '70%' }}>{review.usageDate}</td>
                    </tr>
                    <tr className={styles.reviewTableRow}>
                        <th className={styles.reviewTableHeader} style={{ width: '30%' }}>건물형태</th>
                        <td className={styles.reviewTableData} style={{ width: '70%' }}>{review.buildingType}</td>
                    </tr>
                    <tr className={styles.reviewTableRow}>
                        <th className={styles.reviewTableHeader} style={{ width: '30%' }}>평수</th>
                        <td className={styles.reviewTableData} style={{ width: '70%' }}>{review.area}평</td>
                    </tr>
                    <tr className={styles.reviewTableRow}>
                        <th className={styles.reviewTableHeader} style={{ width: '30%' }}>공간정보</th>
                        <td className={styles.reviewTableData} style={{ width: '70%' }}>{review.spaceInfo}</td>
                    </tr>
                </tbody>
            </table>
            <button className={review.content ? styles.reviewCheckButtonStyle : styles.reviewButtonStyle}>
                {review.content ? '후기 확인' : '후기 작성'}
            </button>
        </div>
    );
}

export default ReviewCard;