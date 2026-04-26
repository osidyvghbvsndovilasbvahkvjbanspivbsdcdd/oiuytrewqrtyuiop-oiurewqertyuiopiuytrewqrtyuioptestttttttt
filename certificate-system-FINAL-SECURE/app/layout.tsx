import type { Metadata } from 'next';
import { Inter, Tajawal } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const tajawal = Tajawal({ 
  weight: ['400', '500', '700', '800', '900'],
  subsets: ['arabic'],
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'نظام إصدار الشهادات | Certificate System',
  description: 'نظام آمن لإصدار وتحقق الشهادات',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.variable} ${tajawal.variable} font-arabic`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
