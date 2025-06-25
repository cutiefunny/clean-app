import { NextResponse } from 'next/server';

// Solapi SDK 또는 직접 fetch 사용
// 여기서는 직접 fetch를 사용하여 Solapi API를 호출하는 예시를 보여드립니다.
// 실제 운영 환경에서는 'solapi' npm 패키지를 설치하여 사용하는 것이 더 안정적입니다.
// npm install solapi-sdk 또는 npm install axios (fetch 대체용)

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_SECRET_KEY = process.env.SOLAPI_SECRET_KEY;
const SOLAPI_MESSAGING_SERVICE_ID = process.env.SOLAPI_MESSAGING_SERVICE_ID; // Solapi에 등록된 발신번호/채널 ID (보통 비즈니스 채널 ID)

export async function POST(request) {
  if (!SOLAPI_API_KEY || !SOLAPI_SECRET_KEY || !SOLAPI_MESSAGING_SERVICE_ID) {
    console.error("Solapi API keys or Service ID are not configured in environment variables.");
    return NextResponse.json({ message: 'Server configuration error: Missing Solapi credentials.' }, { status: 500 });
  }

  try {
    const { to, templateId, templateVariables } = await request.json(); // 클라이언트로부터 받은 데이터

    if (!to || !templateId) {
      return NextResponse.json({ message: '`to` (recipient phone number) and `templateId` are required.' }, { status: 400 });
    }

    // Solapi 알림톡 발송 API 엔드포인트
    const solapiEndpoint = 'https://api.solapi.com/messages/v4/send';

    // Solapi 인증 헤더 생성 (Base64 인코딩)
    // Solapi SDK를 사용하면 이 부분을 직접 구현할 필요 없음
    const authorization = `Basic ${Buffer.from(`${SOLAPI_API_KEY}:${SOLAPI_SECRET_KEY}`).toString('base64')}`;

    const messagePayload = {
      message: {
        to: to.replace(/-/g, ''), // '-' 제거하여 숫자만 남김
        from: SOLAPI_MESSAGING_SERVICE_ID, // Solapi에 등록된 발신 채널 ID
        kakaoOptions: {
          pfId: SOLAPI_MESSAGING_SERVICE_ID, // 친구톡/알림톡 발송 시 사용되는 카카오 채널 ID
          templateId: templateId, // 발송할 알림톡 템플릿 ID
          variables: templateVariables, // 템플릿 변수 (예: { "#{이름}": "홍길동", "#{상품명}": "청소 서비스" })
          // disableSms: true, // 알림톡 실패 시 SMS 전환을 막으려면 true
          // adFlag: 'N', // 광고성 메시지 여부 (알림톡은 'N', 친구톡은 'Y')
          // buttonName: '버튼명', // 버튼이 있다면
          // buttonUrl: '버튼URL', // 버튼이 있다면
        }
      }
    };

    const response = await fetch(solapiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(messagePayload),
    });

    const solapiResult = await response.json();

    if (!response.ok) {
      // Solapi API 응답이 성공이 아닌 경우
      console.error('Solapi API Error:', solapiResult);
      throw new Error(solapiResult.errorMessage || '카카오톡 발송에 실패했습니다 (Solapi API 오류).');
    }

    // Solapi API 호출 성공
    console.log('Solapi API Response:', solapiResult);
    return NextResponse.json({ success: true, message: '카카오톡이 성공적으로 발송되었습니다.', solapiResponse: solapiResult }, { status: 200 });

  } catch (error) {
    console.error('Error sending KakaoTalk message:', error);
    return NextResponse.json({ message: error.message || '카카오톡 발송 중 서버 오류가 발생했습니다.' }, { status: 500 });
  }
}