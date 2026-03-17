import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AttendPro - Employee Attendance Management System",
  description: "Modern employee attendance management solution. Digital clock-in/out, leave management, and real-time reports in one intuitive platform.",
  keywords: ["attendance", "employee", "HR", "time-tracking", "leave-management", "workforce", "clock-in", "clock-out"],
  authors: [{ name: "AttendPro Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AttendPro - Employee Attendance Management System",
    description: "Modern employee attendance management solution",
    url: "https://attendpro.app",
    siteName: "AttendPro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AttendPro - Employee Attendance Management System",
    description: "Modern employee attendance management solution",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
