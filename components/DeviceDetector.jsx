// components/DeviceDetector.js
'use client';

import { useEffect } from 'react';

export default function DeviceDetector() {
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (isMobile) {
      document.documentElement.classList.add('mobile_mode');
    }
  }, []);

  return null;
}