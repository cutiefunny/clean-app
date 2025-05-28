// layout.js

import './globals.css';

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

export const metadata = {
  applicationName: "PICK",
  title: {
    default: "PICK",
    template: "PICK",
  },
  description: "똑똑한 선택, 빠른 견적",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PICK",
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "PICK",
    title: {
      default: "PICK",
      template: "PICK",
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