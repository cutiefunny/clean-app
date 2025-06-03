// /app/admin/layout.jsx (2-depth 메뉴 적용)
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../../lib/firebase/clientApp';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// 아이콘 예시 (실제로는 SVG 아이콘 라이브러리 사용 권장)
const ChevronDownIcon = ({ size = 16, style,isOpen }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ ...style, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s'}}>
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
  </svg>
);
const MenuItemIcon = ({ size = 18, style}) => ( // 일반 메뉴 아이콘
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}><circle cx="12" cy="12" r="4"></circle></svg>
);


export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState({}); // 2-depth 메뉴 펼침 상태 관리

  // 2-depth 메뉴 구조 정의
  const menuItems = [
    {
      name: '회사정보',
      children: [
        { name: '정보표시', path: '/admin/company-info/display' },
        { name: '고객지원', path: '/admin/company-info/notices' },
      ],
    },
    {
      name: '청소업체관리',
      children: [
        { name: '회원내역', path: '/admin/cleaners/members' },
      ],
    },
    {
      name: '리뷰관리',
      children: [
        { name: '리뷰목록', path: '/admin/reviews/list' },
        { name: '리뷰 블라인드', path: '/admin/reviews/blind' },
      ],
    },
    {
      name: '청소신청 내역',
      children: [
        { name: '전송대기', path: '/admin/requests/pending' },
        { name: '전송', path: '/admin/requests/sent' },
      ],
    },
    {
      name: '포인트관리',
      children: [
        { name: '포인트 사용내역', path: '/admin/points/usage' },
        { name: '포인트 지급', path: '/admin/points/grant' },
      ],
    },
    {
      name: '직원관리',
      children: [
        { name: '직원내역', path: '/admin/staff/list' },
        { name: '변경내역', path: '/admin/staff/history' },
      ],
    },
    {
      name: '광고(배너)관리',
      path: '/admin/advertisements', // 1-depth 메뉴
    },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // 2-depth 메뉴 초기 펼침 상태 설정: 현재 활성화된 1-depth 메뉴를 펼침
        const activeParent = menuItems.find(item =>
          item.children && item.children.some(child => pathname.startsWith(child.path))
        );
        if (activeParent) {
          setOpenMenus(prev => ({ ...prev, [activeParent.name]: true }));
        }

      } else {
        if (pathname !== '/admin') {
          router.replace('/admin');
        }
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router, pathname]); // menuItems를 의존성 배열에서 제거 (렌더링 시 고정값으로 가정)

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/admin');
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  if (loadingAuth || (!user && pathname !== '/admin')) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><p>Loading...</p></div>;
  }
  if (pathname === '/admin') return <>{children}</>;


  // 스타일 정의
  const layoutStyle = { display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', maxWidth: '1280px' };
  const sidebarStyle = { width: '260px', backgroundColor: '#ffffff', borderRight: '1px solid #e0e0e0', padding: '20px', display: 'flex', flexDirection: 'column' };
  const appTitleStyle = { fontSize: '22px', fontWeight: 'bold', marginBottom: '35px', color: '#2c3e50' };
  const navStyle = { flexGrow: 1 };
  const logoutButtonStyle = { padding: '12px 15px', marginTop: 'auto', backgroundColor: '#f1f3f5', color: '#343a40', border: '1px solid #ced4da', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', fontWeight: '500' };
  const contentStyle = { flexGrow: 1, padding: '30px', backgroundColor: '#f8f9fa', overflowY: 'auto' };

  const depth1MenuItemStyle = (isActiveParent) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    marginBottom: '8px',
    borderRadius: '6px',
    textDecoration: 'none',
    color: isActiveParent ? '#ffffff' : '#2c3e50',
    backgroundColor: isActiveParent ? '#3498db' : 'transparent', // 활성 1-depth 부모 배경색
    fontWeight: isActiveParent ? '600' : '500',
    cursor: 'pointer', // children이 있을 경우 클릭 가능함을 표시
    fontSize: '15px',
  });

  const depth1MenuLinkStyle = (isActive) => ({ // 1-depth 단일 메뉴 (자식 없는)
    display: 'flex',
    alignItems: 'center',
    padding: '14px 18px',
    marginBottom: '8px',
    borderRadius: '6px',
    textDecoration: 'none',
    color: isActive ? '#ffffff' : '#2c3e50',
    backgroundColor: isActive ? '#3498db' : 'transparent',
    fontWeight: isActive ? '600' : '500',
    fontSize: '15px',
  });

  const depth2NavStyle = {
    paddingLeft: '15px', // 들여쓰기
    // maxHeight: isOpen ? '500px' : '0', // 애니메이션을 위한 높이 조절
    overflow: 'hidden', // maxHeight와 함께 사용
    // transition: 'max-height 0.3s ease-in-out', // 부드러운 펼침/닫힘
  };

  const depth2MenuItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '10px 18px',
    paddingLeft: '25px', // 아이콘 고려한 추가 들여쓰기
    marginBottom: '5px',
    borderRadius: '4px',
    textDecoration: 'none',
    color: isActive ? '#2980b9' : '#566573', // 활성 2-depth 색상
    backgroundColor: isActive ? '#eaf2f8' : 'transparent', // 활성 2-depth 배경색
    fontWeight: isActive ? '500' : 'normal',
    fontSize: '14px',
  });

  const iconStyle = { marginRight: '10px', opacity: 0.8 };


  return (
    <div style={layoutStyle}>
      <aside style={sidebarStyle}>
        <Link href="/admin" style={{ textDecoration: 'none', color: '#2c3e50' }}>
            <div style={appTitleStyle}>청소대행앱</div>
        </Link>
        <nav style={navStyle}>
          {menuItems.map((item) => {
            const isActiveParent = item.children ? item.children.some(child => pathname.startsWith(child.path)) : (item.path ? pathname.startsWith(item.path) : false);
            const isOpen = openMenus[item.name] || false;

            if (item.children) {
              return (
                <div key={item.name}>
                  <div
                    style={depth1MenuItemStyle(isActiveParent)}
                    onClick={() => toggleMenu(item.name)}
                  >
                    <span style={{display: 'flex', alignItems: 'center'}}>
                        {/* {item.icon && <span style={iconStyle}>{item.icon}</span>} */}
                        {item.name}
                    </span>
                    <ChevronDownIcon isOpen={isOpen} />
                  </div>
                  {isOpen && (
                    <div style={depth2NavStyle}>
                      {item.children.map((child) => {
                        const isActiveChild = pathname.startsWith(child.path);
                        return (
                          <Link
                            key={child.name}
                            href={child.path}
                            style={depth2MenuItemStyle(isActiveChild)}
                          >
                            {/* 2-depth 아이콘 추가 가능 */}
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else { // 1-depth 단일 메뉴
              return (
                <Link
                  key={item.name}
                  href={item.path || '#'} // path가 없는 경우 대비
                  style={depth1MenuLinkStyle(isActiveParent)}
                >
                  {item.icon && <span style={iconStyle}>{item.icon}</span>}
                  {item.name}
                </Link>
              );
            }
          })}
        </nav>
        <button onClick={handleLogout} style={logoutButtonStyle}>로그아웃</button>
      </aside>
      <main style={contentStyle}>{children}</main>
    </div>
  );
}