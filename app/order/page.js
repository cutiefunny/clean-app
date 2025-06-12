'use client';

import React, { useState } from 'react';
import { useModal } from '@/contexts/ModalContext';

// /app/order.js

function OrderForm() {
    const [service, setService] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const { showAlert } = useModal();

    const handleSubmit = (event) => {
        event.preventDefault();
        // Handle form submission logic here
        console.log('Service:', service);
        console.log('Date:', date);
        console.log('Time:', time);
        showAlert('신청이 완료되었습니다!');
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="service">희망 서비스:</label>
                <select id="service" value={service} onChange={(e) => setService(e.target.value)}>
                    <option value="">선택하세요</option>
                    <option value="청소">청소</option>
                    <option value="소독">소독</option>
                    <option value="이사">이사</option>
                </select>
            </div>

            <div>
                <label htmlFor="date">희망일:</label>
                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div>
                <label htmlFor="time">희망시간:</label>
                <input type="time" id="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>

            <button type="submit">신청하기</button>
        </form>
    );
}

export default OrderForm;