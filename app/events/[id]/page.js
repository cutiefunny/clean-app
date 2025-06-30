// /app/events/[id]/page.js (Firestore 연동)
'use client';

// React를 명시적으로 임포트합니다.
import React, { useEffect, useState } from 'react'; 
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore'; // Firestore 모듈 추가
import { db } from '@/lib/firebase/clientApp'; // Firebase 설정 임포트

import styles from '../EventPage.module.css';
import Header2 from '@/components/Header2';

const COLLECTION_NAME = "advertisements";

export default function EventDetailPage() {
    const router = useRouter(); // useRouter 훅 사용
    const params = useParams();
    const eventId = params?.id;

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (eventId) {
            const fetchEventData = async () => {
                setLoading(true);
                setError('');
                try {
                    const docRef = doc(db, COLLECTION_NAME, eventId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        // Firestore 데이터를 컴포넌트에서 사용할 형식으로 매핑
                        setEvent({
                            id: docSnap.id,
                            title: data.name || '제목 없음',
                            description: data.description || '상세 내용이 준비 중입니다.',
                            imgSrc: data.imageUrl || null, // 이미지 URL 필드
                        });
                    } else {
                        setError('해당 이벤트를 찾을 수 없습니다.');
                        console.log(`No such document with ID: ${eventId}`);
                    }
                } catch (err) {
                    console.error("Error fetching event:", err);
                    setError('이벤트 정보를 가져오는 중 오류가 발생했습니다.');
                } finally {
                    setLoading(false);
                }
            };
            fetchEventData();
        } else {
            setLoading(false);
        }
    }, [eventId]); // eventId가 변경될 때마다 실행

    // description 내용을 줄바꿈 처리하여 렌더링하는 헬퍼 함수
    const renderDescription = (descriptionText) => {
        if (!descriptionText) return null;

        // 텍스트를 줄바꿈 문자(\n) 기준으로 분할하고, 각 줄 사이에 <br />을 삽입합니다.
        // React.Fragment를 사용하여 각 줄과 <br />이 형제 요소로 렌더링되도록 합니다.
        return descriptionText.split('\n').map((line, index, array) => (
            <React.Fragment key={index}>
                {line}
                {/* 마지막 줄이 아니면 <br /> 태그를 추가합니다. */}
                {index < array.length - 1 && <br />}
            </React.Fragment>
        ));
    };

    // 로딩 상태 UI
    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <Header2 title="로딩 중..." onBack={() => router.back()} />
                <main style={{ padding: '20px', textAlign: 'center' }}>
                    <p>이벤트 정보를 가져오고 있습니다...</p>
                </main>
            </div>
        );
    }

    // 에러 또는 이벤트 없음 UI
    if (error || !event) {
        return (
            <div className={styles.pageContainer}>
                <Header2 title="오류" onBack={() => router.back()} />
                <main style={{ padding: '20px', textAlign: 'center' }}>
                    <p className={styles.errorText}>{error || `요청하신 이벤트를 찾을 수 없습니다.`}</p>
                    {/* <Link href="/events" className={styles.link}>이벤트 목록으로 돌아가기</Link> */}
                </main>
            </div>
        );
    }

    // 성공적으로 데이터를 가져온 경우 UI
    return (
        <div className={styles.pageContainer}>
            <Header2 title={event.title} onBack={() => router.back()} />
            <main className={styles.eventDetailContent}>
                <h2 className={styles.eventDetailTitle}>{event.title}</h2>
                {event.imgSrc && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={event.imgSrc} alt={event.title} className={styles.eventImage} />
                    </div>
                )}
                {/* description에 줄바꿈 적용 */}
                <p className={styles.eventDetailDescription}>
                    {renderDescription(event.description)}
                </p>
            </main>
        </div>
    );
}