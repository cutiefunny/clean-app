// layout.js
'use client';
import './globals.css';
import Header from '@/components/Header';

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      {/* <html> 태그의 설명은 여기에 */}
      <body>
        {/* <body> 태그의 설명은 여기에 */}
        <Header />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}