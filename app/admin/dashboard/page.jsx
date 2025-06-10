// /app/admin/dashboard/page.jsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // [추가] Link 컴포넌트 임포트
import { db, auth } from '../../../lib/firebase/clientApp'; 
// [수정] getCountFromServer 임포트 추가 (효율적인 개수 계산을 위해)
import { collection, getDocs, query, where, Timestamp, getCountFromServer } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// [추가] Chart.js 관련 모듈 임포트
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboardPage() {
  const router = useRouter();
  
  const [stats, setStats] = useState({
    requests: { total: 0, today: 0 },
    reviews: { total: 0, today: 0 },
  });
  // [추가] 차트 데이터를 위한 상태
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(auth.currentUser);

  const todayString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.replace('/admin');
      }
    });

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // --- 1. 카드 통계 데이터 불러오기 ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfToday = Timestamp.fromDate(today);

        const requestsCol = collection(db, 'requests');
        const reviewsCol = collection(db, 'reviews');

        const totalRequestsQuery = query(requestsCol);
        const todayRequestsQuery = query(requestsCol, where("createdAt", ">=", startOfToday));
        const totalReviewsQuery = query(reviewsCol);
        const todayReviewsQuery = query(reviewsCol, where("createdAt", ">=", startOfToday));
        
        // --- 2. 최근 7일간의 견적 요청 데이터 불러오기 ---
        const weeklyRequestCounts = [];
        const dateLabels = [];
        const queryPromises = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          // X축 라벨 생성 (예: "6/10")
          dateLabels.push(`${date.getMonth() + 1}/${date.getDate()}`);

          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          const dailyQuery = query(
            requestsCol,
            where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
            where("createdAt", "<=", Timestamp.fromDate(endOfDay))
          );
          // getCountFromServer를 사용하여 문서 전체를 가져오지 않고 개수만 효율적으로 가져옴
          queryPromises.push(getCountFromServer(dailyQuery));
        }

        // --- 3. 모든 데이터 요청을 병렬로 실행 ---
        const [
          totalRequestsSnap,
          todayRequestsSnap,
          totalReviewsSnap,
          todayReviewsSnap,
          ...weeklySnapshots // 나머지 Promise 결과들을 배열로 받음
        ] = await Promise.all([
          getDocs(totalRequestsQuery),
          getDocs(todayRequestsQuery),
          getDocs(totalReviewsQuery),
          getDocs(todayReviewsQuery),
          ...queryPromises // 7일치 쿼리 Promise들을 펼쳐서 전달
        ]);
        
        // --- 4. 상태 업데이트 ---
        setStats({
          requests: { total: totalRequestsSnap.size, today: todayRequestsSnap.size },
          reviews: { total: totalReviewsSnap.size, today: todayReviewsSnap.size },
        });

        // 차트 데이터 상태 업데이트
        const weeklyCounts = weeklySnapshots.map(snap => snap.data().count);
        setChartData({
          labels: dateLabels,
          datasets: [{
            label: '일일 견적 요청 수',
            data: weeklyCounts,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          }],
        });

      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    return () => unsubscribe();
  }, [router]);

  // [추가] 차트 옵션 설정
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '최근 7일간 견적 요청 현황',
        font: {
            size: 16
        }
      },
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 1 // Y축 눈금을 1 단위로 설정
            }
        }
    }
  };
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/admin');
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      setError("로그아웃 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>관리자 대시보드</h1>
        <button onClick={handleLogout}>로그아웃</button>
      </div>
      {user ? <p>환영합니다, {user.email || '관리자'} 님!</p> : <p>사용자 정보를 불러오는 중...</p>}
      
      <hr style={{ margin: '20px 0' }} />

      <h2>실시간 현황</h2>
      {loading ? (
        <p>통계 데이터를 불러오는 중...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
          {/* ==================== 요청 카드 (수정됨) ==================== */}
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', minWidth: '250px' }}>
            <h3 style={{ marginTop: 0 }}>견적 요청</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
              <Link href="/admin/requests/pending" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                {stats.requests.total}
              </Link>
              <span style={{fontSize: '16px', fontWeight: 'normal'}}> 건</span>
            </p>
            <p style={{ color: '#555', margin: 0 }}>
              오늘: 
              <Link href={`/admin/requests/pending?date=${todayString}`} style={{ textDecoration: 'none', color: '#007bff', cursor: 'pointer', fontWeight: 'bold', marginLeft: '4px' }}>
                +{stats.requests.today} 건
              </Link>
            </p>
          </div>
          {/* ========================================================== */}

          {/* ==================== 리뷰 카드 (수정됨) ==================== */}
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', minWidth: '250px' }}>
            <h3 style={{ marginTop: 0 }}>리뷰</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
              <Link href="/admin/reviews/list" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                {stats.reviews.total}
              </Link>
              <span style={{fontSize: '16px', fontWeight: 'normal'}}> 건</span>
            </p>
            <p style={{ color: '#555', margin: 0 }}>
              오늘: 
              <Link href={`/admin/reviews/list?date=${todayString}`} style={{ textDecoration: 'none', color: '#007bff', cursor: 'pointer', fontWeight: 'bold', marginLeft: '4px' }}>
                +{stats.reviews.today} 건
              </Link>
            </p>
          </div>
          {/* ========================================================== */}
        </div>
      )}

      <hr style={{ margin: '20px 0' }} />
      {/* [추가] 차트 컨테이너 */}
          <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {chartData.labels.length > 0 ? (
              <Bar options={chartOptions} data={chartData} />
            ) : (
              <p>차트 데이터를 불러올 수 없습니다.</p>
            )}
          </div>
      {/* <p>이곳에 다른 관리자 기능을 추가로 구현합니다.</p> */}
      
    </div>
  );
}