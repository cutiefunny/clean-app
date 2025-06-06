// /functions/scripts/setSuperAdmin.js

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// --- (✅ 사용자 설정 영역) ---

// 1. 서비스 계정 키 파일의 경로를 지정하세요.
//    아래 코드는 현재 스크립트 파일 위치를 기준으로 상위 폴더(functions)에 있는 키 파일을 찾습니다.
//    만약 키 파일 위치가 다르다면 이 경로를 수정해주세요.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVICE_ACCOUNT_KEY_PATH = resolve(__dirname, '../clean-app-2337a-firebase-adminsdk-fbsvc-47cf782a01.json');

// 2. 최종 관리자 권한을 부여할 사용자의 UID를 여기에 입력하세요.
//    (Firebase 콘솔 > Authentication 에서 확인 가능)
const UID_TO_MAKE_SUPER_ADMIN = 'u7e3yTC3UYRS3auVlqqKm03F0VG3'; // 이전에 제공된 UID 예시

// --- (설정 영역 끝) ---


/**
 * 지정된 UID의 사용자에게 superAdmin 커스텀 클레임을 부여하는 메인 함수
 */
async function grantSuperAdminRole() {
  console.log(`스크립트 시작: UID '${UID_TO_MAKE_SUPER_ADMIN}'에게 superAdmin 권한을 부여합니다...`);

  // 서비스 계정 키 파일을 읽고 Admin SDK 초기화
  try {
    const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_KEY_PATH, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK 초기화 성공.');
  } catch (error) {
    console.error('오류: 서비스 계정 키 파일을 읽거나 Admin SDK를 초기화하는 데 실패했습니다.');
    console.error(`확인된 경로: ${SERVICE_ACCOUNT_KEY_PATH}`);
    console.error('파일이 해당 경로에 올바르게 위치해 있는지, 파일 내용이 유효한 JSON인지 확인해주세요.');
    console.error('원본 오류:', error.message);
    return; // 키 파일 오류 시 스크립트 중단
  }

  // UID 유효성 확인
  if (!UID_TO_MAKE_SUPER_ADMIN) {
    console.error('오류: UID가 지정되지 않았습니다. 스크립트 상단의 UID_TO_MAKE_SUPER_ADMIN 변수를 확인해주세요.');
    await admin.app().delete();
    return;
  }
  
  // 커스텀 클레임 설정 실행
  try {
    // 사용자에게 { superAdmin: true, admin: true } 클레임을 설정합니다.
    await admin.auth().setCustomUserClaims(UID_TO_MAKE_SUPER_ADMIN, { superAdmin: true, admin: true });
    console.log(`✅ 성공: 사용자(UID: ${UID_TO_MAKE_SUPER_ADMIN})에게 'superAdmin' 권한이 부여되었습니다.`);
    
    // 확인을 위해 설정된 클레임 다시 가져오기
    const userRecord = await admin.auth().getUser(UID_TO_MAKE_SUPER_ADMIN);
    console.log('현재 적용된 커스텀 클레임:', userRecord.customClaims);

  } catch (error) {
    console.error('오류: 커스텀 클레임 설정 중 에러가 발생했습니다.');
    if (error.code === 'auth/user-not-found') {
      console.error(`지정한 UID '${UID_TO_MAKE_SUPER_ADMIN}'에 해당하는 사용자를 찾을 수 없습니다.`);
    } else {
      console.error('원본 오류:', error);
    }
  } finally {
    // 스크립트 실행이므로 프로세스를 완전히 종료합니다.
    await admin.app().delete();
  }
}

// 스크립트 실행
grantSuperAdminRole();