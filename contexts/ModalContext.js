'use client';

import React, { useState, useContext, createContext, useCallback } from 'react';
import AlertModal from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';

// 1. Context 생성
const ModalContext = createContext();

// 2. Provider 컴포넌트 생성
export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    alert: { isOpen: false, message: '', title: '' },
    confirm: { isOpen: false, message: '', title: '' },
  });

  // confirm의 결과를 비동기적으로 처리하기 위한 Promise의 resolve 함수를 저장
  const [resolver, setResolver] = useState(null);

  // alert를 여는 함수 (기존과 유사)
  const showAlert = useCallback((message, title = '알림') => {
    setModalState(prev => ({ ...prev, alert: { isOpen: true, message, title } }));
  }, []);

  const closeAlert = useCallback(() => {
    setModalState(prev => ({ ...prev, alert: { isOpen: false } }));
  }, []);

  // confirm을 열고, 사용자의 응답을 기다리는 Promise를 반환하는 함수
  const showConfirm = useCallback((message, title = '확인') => {
    setModalState(prev => ({ ...prev, confirm: { isOpen: true, message, title } }));
    // Promise를 생성하고, resolve 함수를 state에 저장해 둠
    return new Promise((resolve) => {
      setResolver(() => resolve); // 나중에 호출할 수 있도록 resolve 함수 저장
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolver) {
      resolver(true); // 사용자가 '확인'을 누르면 true를 반환
    }
    setModalState(prev => ({ ...prev, confirm: { isOpen: false } }));
  }, [resolver]);

  const handleCancel = useCallback(() => {
    if (resolver) {
      resolver(false); // 사용자가 '취소'를 누르면 false를 반환
    }
    setModalState(prev => ({ ...prev, confirm: { isOpen: false } }));
  }, [resolver]);

  // 자식들에게 제공할 함수들
  const value = { showAlert, showConfirm };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <AlertModal
        isOpen={modalState.alert.isOpen}
        message={modalState.alert.message}
        title={modalState.alert.title}
        onClose={closeAlert}
      />
      <ConfirmModal
        isOpen={modalState.confirm.isOpen}
        message={modalState.confirm.message}
        title={modalState.confirm.title}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ModalContext.Provider>
  );
}

// 3. 사용하기 쉬운 커스텀 훅 생성
export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};