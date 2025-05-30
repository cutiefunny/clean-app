// app/faq/page.js
'use client';

import React from 'react';
import Header2 from '@/components/Header2';
import styles from './FaqPage.module.css'; // CSS 모듈 생성 필요
import { useRouter } from 'next/navigation';
import Accordion from '@/components/Accordion';

const faqData = [
    {
      id: 'q1',
      title: '홈페이지 이용 관련 자주 묻는 질문입니다.',
      content: 'Q1. 회원가입은 어떻게 하나요?\nA1. 홈페이지 우측 상단의 "회원가입" 버튼을 클릭하여 진행할 수 있습니다.\n\nQ2. 비밀번호를 잊어버렸어요.\nA2. 로그인 페이지 하단의 "비밀번호 찾기" 기능을 이용해주세요.'
    },
    {
      id: 'q2',
      title: '서비스 신청 및 변경 안내입니다.',
      content: '서비스 신청은 "서비스 안내" 페이지에서 원하시는 플랜을 선택 후 진행할 수 있습니다.\n서비스 변경 및 해지는 마이페이지 > "나의 서비스" 메뉴에서 가능합니다.\n문의사항은 1:1 문의 게시판을 이용해주세요.'
    },
    {
      id: 'q3',
      title: '결제 및 환불 규정에 대한 내용입니다.',
      content: '결제는 신용카드, 계좌이체, 휴대폰 소액결제를 지원합니다.\n환불 규정은 서비스 이용 약관 제 X조 Y항을 참고해주시기 바랍니다.\n일반적으로 서비스 개시 전에는 100% 환불 가능하며, 개시 후에는 사용일수에 따라 차감 후 환불됩니다.'
    },
    {
      id: 'q4',
      title: '기타 문의사항입니다.',
      content: '기타 문의사항은 고객센터(1588-XXXX)로 연락 주시거나, 홈페이지의 1:1 문의를 통해 남겨주시면 신속하게 답변드리겠습니다.\n운영시간: 평일 09:00 ~ 18:00 (점심시간 12:00 ~ 13:00, 주말/공휴일 휴무)'
    }
  ];

export default function FaqPage() {
  const router = useRouter();

  return (
    <div className={styles.pageContainer}>
      <Header2 title="자주 묻는 질문" onBack={() => router.back()} />
      <main className={styles.contentArea}>
        <Accordion items={faqData} />
      </main>
    </div>
  );
}