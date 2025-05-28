import React from 'react';

const Header = () => {
  return (
    <header style={{ width: '100%', backgroundColor: 'white', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.1)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flexShrink: '0' }}>
              {/* Logo Image */}
              <img
                src="/images/logo.png"
                alt="Logo"
                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#4A5568' }}>
              똑똑한 선택, 빠른 견적
            </span>
          </div>

          {/* Right Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flexShrink: '0' }}>
              {/* File Icon Image */}
              <img
                src="/images/file-02.png"
                alt="File Icon"
                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#4A5568' }}>
              내 신청내역
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
