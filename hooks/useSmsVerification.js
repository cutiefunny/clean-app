// /hooks/useSmsVerification.js
'use client';

import { useState } from 'react';

export default function useSmsVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * 지정된 전화번호로 인증번호 SMS를 발송합니다.
   * @param {string} phoneNumber - 수신자 전화번호 ('-' 포함 또는 미포함)
   */
  const sendVerificationCode = async (phoneNumber) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: phoneNumber }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '인증번호 발송에 실패했습니다.');
      }
      
      setData(result); // { success: true, verificationCode: '123456' }
      return result;

    } catch (err) {
      setError(err.message);
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { sendVerificationCode, loading, error, data };
}
