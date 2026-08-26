import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  weight: ["600", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fluen — Belajar Bahasa Inggris Harian",
  description: "Platform pembelajaran bahasa Inggris harian untuk karyawan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${nunito.variable} antialiased`}>{children}</body>
    </html>
  );
}
