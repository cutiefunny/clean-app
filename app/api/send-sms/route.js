// /app/api/send-sms/route.js (디버깅 강화 버전)
import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

// NCP SENS API 시그니처 생성 함수 (동일)
function makeSignature(url, timestamp, accessKey, secretKey) {
  const space = ' ';
  const newLine = '\n';
  const method = 'POST';

  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
  hmac.update(method);
  hmac.update(space);
  hmac.update(url);
  hmac.update(newLine);
  hmac.update(timestamp);
  hmac.update(newLine);
  hmac.update(accessKey);

  const hash = hmac.finalize();
  return hash.toString(CryptoJS.enc.Base64);
}

export async function POST(req) {
  // 1. 환경 변수들을 먼저 확인하고, 하나라도 없으면 즉시 에러를 반환합니다.
  const accessKey = process.env.NEXT_PUBLIC_SMS_ACCESS_KEY;
  const secretKey = process.env.NEXT_PUBLIC_SMS_SECRET_KEY;
  const serviceId = process.env.NEXT_PUBLIC_SMS_SERVICE_ID;
  const from = process.env.NEXT_PUBLIC_SMS_FROM;

  if (!accessKey || !secretKey || !serviceId || !from) {
    console.error('환경 변수가 올바르게 설정되지 않았습니다.');
    return NextResponse.json(
      { success: false, message: '서버 환경 변수 설정에 오류가 있습니다.' },
      { status: 500 }
    );
  }

  try {
    const { to } = await req.json();
    
    if (!to) {
      return NextResponse.json(
        { message: 'Recipient phone number (to) is required.' },
        { status: 400 }
      );
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const content = `[클린앱] 인증번호 [${verificationCode}]를 입력해주세요.`;
    
    const url = `/sms/v2/services/${serviceId}/messages`;
    const timestamp = Date.now().toString();
    const signature = makeSignature(url, timestamp, accessKey, secretKey);

    const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': accessKey,
        'x-ncp-apigw-signature-v2': signature,
      },
      body: JSON.stringify({
        type: 'SMS',
        contentType: 'COMM',
        countryCode: '82',
        from: from,
        content: content,
        messages: [{ to: to.replace(/-/g, '') }],
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json({ success: true, verificationCode, result }, { status: 200 });
    } else {
      // NCP 서버에서 온 에러 메시지를 좀 더 명확하게 클라이언트에 전달
      console.error('NCP SENS API Error:', result);
      return NextResponse.json(
        { success: false, message: result.error?.message || 'SMS 발송에 실패했습니다.', result },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('SMS sending error:', error);
    return NextResponse.json(
      { success: false, message: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
