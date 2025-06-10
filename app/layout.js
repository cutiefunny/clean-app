// layout.js

import './globals.css';
import DeviceDetector from '@/components/DeviceDetector';

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <DeviceDetector />
        <main>
          {children}
        </main>
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