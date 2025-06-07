// /app/context/AuthContext.js
"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/clientApp'; // 경로 확인 필요

// Context 생성
const AuthContext = createContext();

// Context를 사용하기 위한 커스텀 훅
export const useAuth = () => useContext(AuthContext);

// Context를 제공하는 Provider 컴포넌트
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          const claims = idTokenResult.claims;
          setIsSuperAdmin(claims.superAdmin === true);
          setPermissions(claims.permissions || {});
        } catch (error) {
          console.error("Error getting user claims:", error);
          setIsSuperAdmin(false);
          setPermissions({}); // 에러 시 빈 권한으로 설정
        }
      } else {
        setUser(null);
        setIsSuperAdmin(false);
        setPermissions(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loadingAuth,
    isSuperAdmin,
    permissions,
    // 필요하다면 다른 값들도 추가 가능
  };

  // loadingAuth 중에는 아무것도 렌더링하지 않거나 로딩 스피너를 보여줄 수 있습니다.
  // 여기서는 children을 바로 렌더링하여 각 페이지에서 로딩 상태를 처리하도록 합니다.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}