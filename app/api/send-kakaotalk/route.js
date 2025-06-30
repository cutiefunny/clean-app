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
            // 솔라피 응답에 실패 메시지가 명확히 있는 경우 해당 메시지를 사용
            const errorMessage = solapiResponse.errorMessage || '카카오 알림톡 발송에 실패했습니다. 솔라피 응답을 확인하세요.';
            return NextResponse.json({
                success: false,
                message: errorMessage,
                solapiResponse,
            }, { status: 500 });
        }
    } catch (error) {
        console.error('API Error:', error);

        // 솔라피 API 호출 실패 시 에러 객체에 `message` 속성이 포함되어 있습니다.
        // 이 메시지는 솔라피 서버에서 직접 전달된 오류를 포함할 가능성이 높습니다.
        let displayMessage = '서버 오류가 발생했습니다.';
        if (error.message) {
            displayMessage = `API Error: ${error.message}`; // 솔라피에서 반환된 구체적인 오류 메시지 사용
        } else if (error.failedMessageList) {
             // failedMessageList가 있는 경우, 첫 번째 메시지의 에러를 표시
            console.error('솔라피 실패 메시지 목록:', JSON.stringify(error.failedMessageList, null, 2));
            if (error.failedMessageList.length > 0 && error.failedMessageList[0].error?.message) {
                displayMessage = `솔라피 전송 오류: ${error.failedMessageList[0].error.message}`;
            } else {
                displayMessage = '솔라피 전송 중 알 수 없는 오류가 발생했습니다.';
            }
        }

        return NextResponse.json({
            success: false,
            message: displayMessage,
            error: error.message || 'Unknown error', // `error` 필드에도 원본 에러 메시지 포함 (개발용)
        }, { status: 500 });
    }
}