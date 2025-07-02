'use client';

import React, { useState } from 'react';
import styles from './Accordion.module.css';
import Image from 'next/image'; // Image 컴포넌트 임포트

// URL과 마크다운 이미지 링크를 감지하고 렌더링하는 함수
const renderContentWithImagesAndLinks = (content) => {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g; // ![alt text](image_url) 패턴 감지
    const urlRegex = /(https?:\/\/[^\s]+)/g; // HTTP 또는 HTTPS로 시작하는 URL 감지

    const parts = [];
    let lastIndex = 0;
    let match;

    // 1단계: 마크다운 이미지 링크를 먼저 분리
    while ((match = imageRegex.exec(content)) !== null) {
        const [fullMatch, altText, imageUrl] = match;
        const startIndex = match.index;
        const endIndex = imageRegex.lastIndex;

        // 이미지 앞에 있는 텍스트 추가 (있는 경우)
        if (startIndex > lastIndex) {
            parts.push({ type: 'text', value: content.substring(lastIndex, startIndex) });
        }

        // 이미지 추가
        parts.push({ type: 'image', alt: altText, src: imageUrl });
        lastIndex = endIndex;
    }

    // 마지막 이미지 이후의 남은 텍스트 추가
    if (lastIndex < content.length) {
        parts.push({ type: 'text', value: content.substring(lastIndex) });
    }

    // 2단계: 각 분리된 부분을 최종 렌더링 요소로 변환 (텍스트 부분은 URL 및 줄바꿈 처리)
    const finalRenderedElements = [];
    parts.forEach((part, partIndex) => {
        if (part.type === 'image') {
            finalRenderedElements.push(
                <div key={`img-${partIndex}`} style={{ textAlign: 'center', margin: '10px 0' }}>
                    <Image
                        src={part.src}
                        alt={part.alt}
                        width={500} // 기본 너비 (필요에 따라 조절)
                        height={300} // 기본 높이 (필요에 따라 조절)
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', objectFit: 'contain' }}
                        sizes="(max-width: 768px) 100vw, 50vw" // 반응형 이미지 사이즈
                    />
                </div>
            );
        } else {
            // 텍스트 부분을 줄바꿈 기준으로 분리
            const lines = part.value.split('\n');
            lines.forEach((line, lineIndex) => {
                // 각 줄을 URL 기준으로 다시 분리
                line.split(urlRegex).forEach((subPart, subPartIndex) => {
                    if (subPart.match(urlRegex)) {
                        // URL인 경우 링크로 렌더링
                        finalRenderedElements.push(
                            <a
                                key={`link-${partIndex}-${lineIndex}-${subPartIndex}`}
                                href={subPart}
                                target="_blank" // 새 탭에서 열기
                                rel="noopener noreferrer" // 보안을 위한 설정
                                className={styles.contentLink} // 링크 스타일링을 위한 클래스
                            >
                                {subPart}
                            </a>
                        );
                    } else {
                        // URL이 아닌 경우 일반 텍스트로 렌더링
                        finalRenderedElements.push(
                            <span key={`text-${partIndex}-${lineIndex}-${subPartIndex}`}>{subPart}</span>
                        );
                    }
                });
                // 마지막 줄이 아니면 줄바꿈 추가
                if (lineIndex < lines.length - 1) {
                    finalRenderedElements.push(<br key={`br-${partIndex}-${lineIndex}`} />);
                }
            });
        }
    });

    return finalRenderedElements;
};

const AccordionItem = ({ item, isOpen, onToggle }) => {
    return (
        <div className={styles.accordionItem}>
            <button className={styles.accordionTitle} onClick={onToggle}>
                {item.title}
                <span className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`}>
                    {isOpen ? <img src="/images/chevron-up.png" alt="Close" /> : <img src="/images/chevron-down.png" alt="Open" />}
                </span>
            </button>
            <div
                className={`${styles.contentWrapper} ${isOpen ? styles.contentWrapperOpen : ''}`}
            >
                <div className={styles.accordionContent}>
                    {/* 수정된 렌더링 함수 사용 */}
                    {renderContentWithImagesAndLinks(item.content)}
                </div>
            </div>
        </div>
    );
};

const Accordion = ({ items, sectionTitle }) => {
    const [openItemId, setOpenItemId] = useState(null); // 현재 열려있는 아이템의 ID

    const handleToggle = (itemId) => {
        setOpenItemId(openItemId === itemId ? null : itemId); // 이미 열려있으면 닫고, 아니면 열기
    };

    return (
        <div className={styles.accordionContainer}>
            {items.map((item) => (
                <AccordionItem
                    key={item.id}
                    item={item}
                    isOpen={openItemId === item.id}
                    onToggle={() => handleToggle(item.id)}
                />
            ))}
        </div>
    );
};

export default Accordion;
