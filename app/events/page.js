// app/events/page.js
'use client';

import Link from 'next/link';
import styles from './EventPage.module.css';
import Header2 from '@/components/Header2';

// 목업 데이터 (실제로는 API 등에서 가져옴)
const mockEvents = [
  { id: 'event1', title: '광고 1: 여름맞이 특별 할인전' },
  { id: 'event2', title: '광고 2: 신규 회원가입 웰컴 쿠폰' },
  { id: 'event3', title: '광고 3: 친구 추천하고 포인트 받기' },
  { id: 'event4', title: '광고 4: 앱 사용 후기 작성 이벤트' },
  { id: 'event5', title: '광고 5: 매일매일 출석체크 챌린지' },
  { id: 'event6', title: '광고 6: 구매 금액별 사은품 증정' },
];

// 개별 이벤트 아이템 컴포넌트 (수정됨)
function EventItem({ event }) {
  return (
    <Link href={`/events/${event.id}`} className={styles.eventItem}> {/* legacyBehavior 제거, className 직접 적용 */}
      <span className={styles.eventTitle}>{event.title}</span>
      <span className={styles.chevron}>›</span>
    </Link> // 내부 <a> 태그 제거
  );
}

// 이벤트 목록 페이지 (수정됨)
export default function EventListPage() {
  return (
    <div className={styles.pageContainer}>
      <Header2 title="이벤트내역" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}} onBack={() => window.history.back()} />

      <main className={styles.eventList}>
        {mockEvents.map((event) => (
          <EventItem key={event.id} event={event} />
        ))}
      </main>
    </div>
  );
}