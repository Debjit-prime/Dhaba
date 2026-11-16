import type { Metadata } from 'next';
import { Inter_Tight } from 'next/font/google';
import Script from 'next/script';
import { SiteBackground } from '@/components/shared/SiteBackground';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import './globals.css';

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter-tight',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DhabaOS — Restaurant Management System',
  description:
    'Unified four-portal Restaurant Management System for high-volume dhabas, with Customer Ordering, Kitchen Display System (KDS), Valet Queue, and Admin AI Inventory & Forecasting.',
  openGraph: {
    title: 'DhabaOS — Restaurant Management System',
    description:
      'Unified four-portal Restaurant Management System for high-volume dhabas, with Customer Ordering, Kitchen Display System (KDS), Valet Queue, and Admin AI Inventory & Forecasting.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${interTight.variable}`} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${interTight.className} bg-transparent text-ink font-body-md min-h-screen selection:bg-bowl-rim selection:text-ink antialiased relative`}
      >
        <Script id="dhabaos-theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('dhabaos-theme');if(t==='dark'){document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}}catch(e){}`}
        </Script>
        <ThemeProvider>
          <SiteBackground />
          <div className="relative z-10 min-h-screen flex flex-col">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
