import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'انتخاب واحد هوشمند KPU',
  description: 'یک سیستم انتخاب واحد هوشمند برای دانشگاه فرهنگیان',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
      </head>
      <body className="font-body antialiased bg-secondary/30">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
