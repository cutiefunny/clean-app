// app/events/[id]/page.js
'use client';

import Link from 'next/link';
import styles from '../EventPage.module.css';
import Header2 from '@/components/Header2';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // useParams 훅을 import 합니다.

// 목업 데이터 (이전과 동일)
const mockEvents = [
  { id: 'event1', title: '광고 1: 여름맞이 특별 할인전', description: '여름을 맞이하여 다양한 상품을 특별 할인가로 만나보세요! 기간 한정입니다.', imgSrc: '/images/sample/event1.jpg' },
  { id: 'event2', title: '광고 2: 신규 회원가입 웰컴 쿠폰', description: '지금 가입하시면 즉시 사용 가능한 10% 할인 쿠폰을 드립니다.', imgSrc: '/images/sample/event2.jpg' },
  { id: 'event3', title: '광고 3: 친구 추천하고 포인트 받기', description: '친구를 추천하고 추천인과 친구 모두에게 1000 포인트를 드립니다.', imgSrc: '/images/sample/event3.jpg' },
  { id: 'event4', title: '광고 4: 앱 사용 후기 작성 이벤트', description: '앱 사용 후기를 남겨주시면 추첨을 통해 커피 기프티콘을 드립니다.', imgSrc: '/images/sample/event4.jpg' },
  { id: 'event5', title: '광고 5: 매일매일 출석체크 챌린지', description: '한 달 동안 매일 출석체크하고 특별한 선물을 받아가세요.', imgSrc: '/images/sample/event5.jpg' },
  { id: 'event6', title: '광고 6: 구매 금액별 사은품 증정', description: '구매 금액에 따라 푸짐한 사은품을 추가로 증정합니다.', imgSrc: '/images/sample/event6.jpg' },
];

async function getEventById(id) {
  await new Promise(resolve => setTimeout(resolve, 100)); // 데이터 로딩 시뮬레이션
  return mockEvents.find(event => event.id === id);
}

// 페이지 컴포넌트는 props로 params를 받지만, 클라이언트 컴포넌트 내에서는 useParams() 사용 권장
export default function EventDetailPage({ params: propParams }) { // props로 받는 params는 propParams로 이름을 변경하거나, 사용하지 않으면 제거 가능
  const params = useParams(); // useParams 훅을 사용하여 파라미터 객체를 가져옵니다.
  const eventId = params ? params.id : null; // params가 존재할 때 id에 접근

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      const fetchEventData = async () => {
        setLoading(true);
        const eventData = await getEventById(eventId);
        setEvent(eventData);
        setLoading(false);
      };
      fetchEventData();
    } else if (params) { // params 객체는 있지만 id가 없는 경우 (예: /events/[...catchall])
      setLoading(false);
      setEvent(null);
    } else {
        // params 자체가 아직 로드되지 않았거나 없는 경우 (초기 렌더링 또는 오류 상황)
        // 이 경우는 보통 Next.js가 params를 제공하므로 흔치 않지만, 방어적으로 처리
        setLoading(false);
    }
  }, [params, eventId]); // params 객체 또는 eventId가 변경될 때마다 실행

  const pageTitle = loading ? "로딩 중..." : (event ? event.title : "이벤트 정보 없음");

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <Link href="/events" className={styles.backButton}>‹</Link>
          <h1 className={styles.pageTitle}>로딩 중...</h1>
          <div style={{ width: '24px' }}></div>
        </header>
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <p>이벤트 정보를 가져오고 있습니다...</p>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <Link href="/events" className={styles.backButton}>‹</Link>
          <h1 className={styles.pageTitle}>이벤트 정보 없음</h1>
          <div style={{ width: '24px' }}></div>
        </header>
        <main style={{ padding: '20px', textAlign: 'center' }}>
          <p>요청하신 이벤트를 찾을 수 없습니다. (ID: {eventId || "알 수 없음"})</p>
          <Link href="/events">이벤트 목록으로 돌아가기</Link>
        </main>
      </div>
    );
  }

return (
    <div className={styles.pageContainer}>
        <Header2 title="" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}} onBack={() => window.history.back()} />
        <main className={styles.eventDetailContent}>
            <h2>{event.title}</h2>
            {event.imgSrc && <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img src={event.imgSrc} alt={event.title} className={styles.eventImage} />
            </div>}
            <p>{event.description || '상세 내용이 준비 중입니다.'}</p>
            <p style={{ marginTop: '20px' }}>
                <Link href="/events">이벤트 목록으로 돌아가기</Link>
            </p>
        </main>
    </div>
);
}