import { validateEnv } from '@/utils/env';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Validate environment variables
validateEnv();

export const metadata: Metadata = {
  title: "Fly App - Real-time Flight Tracking",
  description: "Track flights in real-time with OpenSky Network data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
