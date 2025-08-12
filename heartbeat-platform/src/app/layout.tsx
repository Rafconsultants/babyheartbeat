import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "Baby Heartbeat Audio Recreation Platform",
  description: "Convert your ultrasound images into realistic heartbeat audio. Upload your baby scan and hear your baby's heartbeat in beautiful audio format.",
  keywords: ["baby heartbeat", "ultrasound", "audio", "pregnancy", "heartbeat sound", "baby scan"],
  authors: [{ name: "Baby Heartbeat Platform" }],
  creator: "Baby Heartbeat Platform",
  publisher: "Baby Heartbeat Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://baby-heartbeat-platform.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Baby Heartbeat Audio Recreation Platform",
    description: "Convert your ultrasound images into realistic heartbeat audio. Upload your baby scan and hear your baby's heartbeat in beautiful audio format.",
    url: 'https://baby-heartbeat-platform.vercel.app',
    siteName: 'Baby Heartbeat Platform',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Baby Heartbeat Audio Recreation Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Baby Heartbeat Audio Recreation Platform",
    description: "Convert your ultrasound images into realistic heartbeat audio. Upload your baby scan and hear your baby's heartbeat in beautiful audio format.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Baby Heartbeat" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
