// components/CustomizableCard.jsx
import React from 'react';

const CustomizableCard = ({
    title,
    description,
    imageUrl,
    imageAlt = "Card image",
    backgroundColor,
    titleStyle = { fontSize: '14px', fontWeight: 'bold', color: 'white', marginBottom: '4px' },
    descriptionStyle = { fontSize: '12px', color: 'white', marginBottom: '16px' },
    imageContainerStyle = { width: '50px', height: '50px' },
}) => {
    const cardStyle = {
        position: 'relative',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        backgroundColor: backgroundColor,
    };

    return (
        <div style={cardStyle}>
            {/* 텍스트 컨텐츠 */}
            <div style={{ position: 'relative', zIndex: 10 }}>
                <h3 style={titleStyle}>
                    {title}
                </h3>
                <p style={descriptionStyle}>
                    {description}
                </p>
            </div>

            {/* 우측 하단 이미지 */}
            {imageUrl && (
                <div style={{ position: 'absolute', bottom: '16px', right: '16px', ...imageContainerStyle }}>
                    <img
                        src={imageUrl}
                        alt={imageAlt}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: '4px',
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default CustomizableCard;