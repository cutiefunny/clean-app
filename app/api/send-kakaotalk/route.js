import { NextResponse } from 'next/server';
import { SolapiMessageService } from 'solapi';

// 환경 변수에서 API 키와 Secret을 가져옵니다.
// .env.local 파일에 SOLAPI_API_KEY와 SOLAPI_SECRET_KEY를 설정해야 합니다.
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_SECRET_KEY = process.env.SOLAPI_SECRET_KEY;
const SOLAPI_SENDER_KEY = process.env.SOLAPI_SENDER_KEY; // 솔라피에 등록된 발신 프로필 키
const SOLAPI_CHANNEL_ID = process.env.SOLAPI_CHANNEL_ID; // 솔라피 채널 아이디 (플러스 친구 ID)

// SolapiMessageService 인스턴스를 생성합니다.
const messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_SECRET_KEY);

export async function POST(req) {
  try {
    // 클라이언트로부터 전송된 JSON 데이터를 파싱합니다.
    const { to, templateId, templateVariables } = await req.json();

    if (!to || !templateId) {
      return NextResponse.json({ message: '`to`와 `templateId`는 필수 값입니다.' }, { status: 400 });
    }

    // 솔라피 알림톡 전송 API 호출
    const solapiResponse = await messageService.send({
          "to": to.replace(/-/g, ''), // 수신자 번호에서 '-' 제거
          "from": SOLAPI_SENDER_KEY,
          "kakaoOptions": {
            "pfId": SOLAPI_CHANNEL_ID,
            "templateId": templateId,
            "variables": templateVariables,
          },
    });

    // --- [솔라피 응답 로그] ---
    console.log('솔라피 API 응답 전문:', JSON.stringify(solapiResponse, null, 2));
    // --- [로그 추가 끝] ---

    // 솔라피 응답에서 성공/실패 여부를 확인하여 응답합니다.
    if (solapiResponse.groupInfo.status === 'SENDING' || solapiResponse.errorCount === 0) {
      console.log('알림톡 전송 성공:');
      return NextResponse.json({
        success: true,
        message: '카카오 알림톡이 성공적으로 발송되었습니다.',
        solapiResponse,
      });
    } else {
      console.error('알림톡 전송 실패 (solapiResponse):', solapiResponse);
      return NextResponse.json({
        success: false,
        message: '카카오 알림톡 발송에 실패했습니다. 솔라피 응답을 확인하세요.',
        solapiResponse,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API Error:', error);
    // [수정] failedMessageList를 포함한 전체 에러 객체를 출력
    if (error.failedMessageList) {
        console.error('솔라피 실패 메시지 목록:', JSON.stringify(error.failedMessageList, null, 2));
    }
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message,
    }, { status: 500 });
  }
}