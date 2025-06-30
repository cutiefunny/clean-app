'use client';

import React, { useState } from 'react';
import styles from './Accordion.module.css';

// URL을 감지하고 링크로 변환하는 함수
const renderContentWithLinks = (content) => {
    // HTTP 또는 HTTPS로 시작하는 URL을 감지하는 정규 표현식
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // content를 줄바꿈 기준으로 먼저 분리합니다.
    const lines = content.split('\n');

    return lines.map((line, lineIndex) => (
        <React.Fragment key={`line-${lineIndex}`}>
            {line.split(urlRegex).map((part, partIndex) => {
                if (part.match(urlRegex)) {
                    // URL인 경우 링크로 렌더링
                    return (
                        <a
                            key={`part-${lineIndex}-${partIndex}`}
                            href={part}
                            target="_blank" // 새 탭에서 열기
                            rel="noopener noreferrer" // 보안을 위한 설정
                            className={styles.contentLink} // 필요하다면 링크 스타일링을 위한 클래스 추가
                        >
                            {part}
                        </a>
                    );
                }
                // URL이 아닌 경우 일반 텍스트로 렌더링
                return <span key={`part-${lineIndex}-${partIndex}`}>{part}</span>;
            })}
            {lineIndex < lines.length - 1 && <br />} {/* 마지막 줄이 아니면 줄바꿈 추가 */}
        </React.Fragment>
    ));
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
                // style={{ maxHeight: isOpen ? '1000px' : '0px' }} // 인라인 스타일로 max-height 조절도 가능
            >
                <div className={styles.accordionContent}>
                    {renderContentWithLinks(item.content)}
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