// layout.js

import './globals.css';
import DeviceDetector from '@/components/DeviceDetector';
import { ModalProvider } from '@/contexts/ModalContext';

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta name="naver-site-verification" content="59e2ea0050231cea4deef4e052fe323fa8e618bb" />
      </head>
      <body>
        <DeviceDetector />
        <ModalProvider>
          <main>
            {children}
          </main>
        </ModalProvider>
      </body>
    </html>
  );
}

export const metadata = {
  applicationName: "PICKQ",
  title: {
    default: "PICKQ",
    template: "PICKQ",
  },
  description: "똑똑한 선택, 빠른 견적",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PICKQ",
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "PICKQ",
    title: {
      default: "PICKQ",
      template: "PICKQ",
    },
    description: "똑똑한 선택, 빠른 견적",
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFFFFF",
};