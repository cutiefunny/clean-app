'use client';

import { useState } from 'react';

/**
 * Solapi를 통해 카카오톡 메시지를 발송하는 커스텀 훅.
 * API 키 등 민감 정보는 Next.js API 라우트를 통해 안전하게 처리됩니다.
 */
export default function useKakaoTalkSend() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * 카카오톡 메시지를 발송합니다.
   * @param {string} to - 수신자 전화번호 ('-' 포함 또는 미포함)
   * @param {string} templateId - 발송할 카카오톡 템플릿 ID
   * @param {Object} [templateVariables] - 템플릿 내 변수 객체 (예: { "#{이름}": "홍길동" })
   * @returns {Promise<Object|null>} 발송 성공 시 결과 데이터, 실패 시 null
   */
  const sendKakaoTalk = async (to, templateId, templateVariables = {}) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Next.js API 라우트 호출
      const response = await fetch('/api/send-kakaotalk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          templateId,
          templateVariables,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '카카오톡 발송 요청에 실패했습니다.');
      }

      setData(result); // { success: true, message: '...', solapiResponse: {...} }
      return result;

    } catch (err) {
      setError(err.message);
      console.error('Failed to send KakaoTalk:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { sendKakaoTalk, loading, error, data };
}