// app/layout.tsx
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Navbar from "./components/global/navbar";
import Footer from "./components/global/footer";
import Chatbot from "./Chatbot";
// Load fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata for SEO
export const metadata: Metadata = {
  title: "EcoScan – Evaluate Product Impact",
  description: "Scan, compare, and choose greener products with EcoScan.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased min-h-screen bg-gradient-to-b from-green-50 to-green-100">
        <Navbar />
        <main className="container mx-auto">{children}</main>
        <Footer />
            <Chatbot />

      </body>
    </html>
  );
}
