// components/ConfirmModal.jsx
'use client';

import React from 'react';
import styles from './ConfirmModal.module.css';

export default function ConfirmModal({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttonGroup}>
          <button className={`${styles.button} ${styles.cancelButton}`} onClick={onCancel}>
            취소
          </button>
          <button className={`${styles.button} ${styles.confirmButton}`} onClick={onConfirm}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}