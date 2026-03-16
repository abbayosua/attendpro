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
  title: "AbsenKu - Aplikasi Absensi Karyawan Modern",
  description: "Solusi modern untuk manajemen kehadiran karyawan. Clock-in/out digital, pengajuan cuti, dan laporan real-time dalam satu platform yang intuitif.",
  keywords: ["absensi", "karyawan", "HR", "kehadiran", "cuti", "manajemen", "attendance", "employee"],
  authors: [{ name: "AbsenKu Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AbsenKu - Aplikasi Absensi Karyawan Modern",
    description: "Solusi modern untuk manajemen kehadiran karyawan",
    url: "https://absensiku.id",
    siteName: "AbsenKu",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AbsenKu - Aplikasi Absensi Karyawan Modern",
    description: "Solusi modern untuk manajemen kehadiran karyawan",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
