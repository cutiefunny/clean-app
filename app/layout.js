// layout.js
'use client';
import './globals.css';
import Header from '@/components/Header';

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}