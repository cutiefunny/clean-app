// components/Accordion.js
'use client';

import React, { useState } from 'react';
import styles from './Accordion.module.css';

const AccordionItem = ({ item, isOpen, onToggle }) => {
return (
    <div className={styles.accordionItem}>
        <button className={styles.accordionTitle} onClick={onToggle}>
            {item.title}
            <span className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`}>
                {isOpen ? <img src="/images/chevron-up.png" alt="Close" /> : <img src="/images/chevron-down.png" alt="Open" />}
            </span>
        </button>
        {/*
            CSS transition을 사용하기 위해 contentWrapper div를 추가하고,
            isOpen 상태에 따라 content에 다른 클래스를 부여하거나 max-height를 조절합니다.
        */}
        <div
            className={`${styles.contentWrapper} ${isOpen ? styles.contentWrapperOpen : ''}`}
            // style={{ maxHeight: isOpen ? '1000px' : '0px' }} // 인라인 스타일로 max-height 조절도 가능
        >
            <div className={styles.accordionContent}>
                {/* 줄바꿈을 위해 white-space: pre-line; 사용 가능 또는 <p> 태그 등 사용 */}
                {item.content.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                        {line}
                        <br />
                    </React.Fragment>
                ))}
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