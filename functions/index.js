// functions/index.js

import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import admin from 'firebase-admin';

// Admin SDK는 함수가 초기화될 때 한 번만 실행됩니다.
// admin.initializeApp()이 이미 파일 상단에 있다면 이 줄은 생략합니다.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * 신규 직원을 생성하는 호출 가능 함수(Callable Function)
 * @param {object} data - 클라이언트에서 전달된 데이터. { email, password, staffId, staffName, phone, permissions } 포함.
 * @param {object} context - 호출한 사용자의 인증 정보.
 * @returns {object} - 성공 또는 실패 결과.
 */
export const createStaffUser = onCall(async (request) => {
  const { data, auth } = request;
  if (!auth || !auth.token.superAdmin) { /* ... (최종 관리자 확인) ... */ }
  const { email, password, staffId, staffName, phone, permissions } = data;
  if (!email || !password || !staffId || !staffName) { /* ... (유효성 검사) ... */ }

  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName: staffName });
    logger.info(`Successfully created new user: ${email} (UID: ${userRecord.uid})`);

    // *** 중요: 생성된 사용자에게 커스텀 클레임 설정 ***
    // 일반 관리자 권한과 함께 세부 권한(permissions) 객체를 클레임에 저장합니다.
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true, permissions: permissions });

    const staffDocRef = admin.firestore().collection('staffMembers').doc(userRecord.uid);
    await staffDocRef.set({
      staffId, staffName, email, phone, permissions,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: `직원 '${staffName}'이(가) 성공적으로 생성되었습니다.`, uid: userRecord.uid };

  } catch (error) {
    logger.error("Error creating new staff user:", error);
    // 이미 생성된 Auth 사용자가 있다면 롤백(삭제) 처리
    if (error.code === 'auth/email-already-exists' && userRecord) {
        await admin.auth().deleteUser(userRecord.uid);
    }
    throw new functions.https.HttpsError('internal', `직원 생성 중 오류가 발생했습니다: ${error.message}`);
  }
});

// 예시: 직원의 권한만 업데이트하는 함수
export const updateStaffPermissions = onCall(async (request) => {
    const { data, auth } = request;
    if (!auth || !auth.token.superAdmin) { /* ... (최종 관리자 확인) ... */ }
    const { uid, permissions } = data; // 권한을 변경할 직원의 UID와 새로운 permissions 객체

    try {
        // *** 중요: 기존 클레임에 덮어쓰기 ***
        await admin.auth().setCustomUserClaims(uid, { admin: true, permissions: permissions });

        // Firestore 문서도 업데이트
        const staffDocRef = admin.firestore().collection('staffMembers').doc(uid);
        await staffDocRef.update({ permissions });

        return { success: true, message: "직원 권한이 성공적으로 업데이트되었습니다." };
    } catch (error) {
        logger.error("Error updating permissions:", error);
        throw new functions.https.HttpsError('internal', `권한 업데이트 중 오류 발생: ${error.message}`);
    }
});