'use client';

import React, { useState } from 'react';

function CheckModal() {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const handleSendCode = () => {
        // SMS 인증번호 발송 로직 (API 호출 등)
        console.log('Sending verification code to:', phoneNumber);
        setIsCodeSent(true);
    };

    const handleVerifyCode = () => {
        // 인증번호 확인 로직 (API 호출 등)
        console.log('Verifying code:', verificationCode);
        setIsVerified(true);
    };

    return (
        <div>
            <h2>본인인증</h2>
            <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                type="tel"
                placeholder="전화번호"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button onClick={handleSendCode} disabled={isCodeSent}>
                {isCodeSent ? '인증번호 재전송' : '인증번호 발송'}
            </button>

            {isCodeSent && (
                <div>
                    <input
                        type="text"
                        placeholder="인증번호"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <button onClick={handleVerifyCode} disabled={isVerified}>
                        {isVerified ? '인증 완료' : '인증하기'}
                    </button>
                </div>
            )}

            {isVerified && <p>본인인증이 완료되었습니다.</p>}
        </div>
    );
}

export default CheckModal;