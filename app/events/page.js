// /app/events/page.js (Firestore 연동)
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

import styles from './EventPage.module.css';
import Header2 from '@/components/Header2';

const COLLECTION_NAME = "advertisements";

// 개별 이벤트 아이템 컴포넌트
function EventItem({ event }) {
  return (
    <Link href={`/events/${event.id}`} className={styles.eventItem}>
      <span className={styles.eventTitle}>{event.title}</span>
      <span className={styles.chevron}>›</span>
    </Link>
  );
}

// 이벤트 목록 페이지
export default function EventListPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const now = Timestamp.now();
        // 'isVisible'이 true이고, 현재 날짜가 게시 기간에 포함되는 광고(이벤트)만 가져옵니다.
        const q = query(
          collection(db, COLLECTION_NAME),
          where("isVisible", "==", true),
          where("startDate", "<=", now),
          orderBy("startDate", "desc") // 시작일이 최신인 순으로 정렬
        );
        
        const querySnapshot = await getDocs(q);
        
        // Firestore의 endDate 필터링은 다른 범위 필터와 함께 사용 시 복합 색인이 필요하므로, 클라이언트에서 처리합니다.
        const activeEvents = querySnapshot.docs
          .filter(doc => doc.data().endDate >= now)
          .map(doc => ({
            id: doc.id,
            title: doc.data().name || '제목 없음',
          }));

        setEvents(activeEvents);

      } catch (err) {
        console.error("Error fetching events:", err);
        setError("이벤트 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className={styles.pageContainer}>
      <Header2 title="이벤트내역" onBack={() => router.back()} />

      <main className={styles.eventList}>
        {loading ? (
          <p className={styles.loadingText}>이벤트 목록을 불러오는 중...</p>
        ) : error ? (
          <p className={styles.errorText}>{error}</p>
        ) : events.length > 0 ? (
          events.map((event) => (
            <EventItem key={event.id} event={event} />
          ))
        ) : (
          <p className={styles.noItemsText}>진행 중인 이벤트가 없습니다.</p>
        )}
      </main>
    </div>
  );
}
