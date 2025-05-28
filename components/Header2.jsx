
import React from 'react';

const Header2 = ({ title, onBack }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', height: '50px', backgroundColor: '#ffffff' }}>
            <img src="/images/chevron-left.png" alt="Back" onClick={onBack} style={{ height: '17px', margin: '10px', zIndex: 1 }} />
            <div style={{ textAlign: 'center', position: 'absolute', left: 0, right: 0, zIndex: 0 }}>
                {title}
            </div>
        </div>
    );
};

export default Header2;