import type { Metadata } from "next";
import { DM_Sans, Nunito } from "next/font/google";
import "./globals.css";
import { Navbar } from "./components/Navbar";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ENKI",
  description: "Web3 Kahoot Clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${nunito.variable} min-h-screen antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-neo-bg relative">
        {/* Global scanline texture */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, #000 3px, #000 4px)" }}
        />
        <Toaster position="top-center" reverseOrder={false} />
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col w-full relative z-10 overflow-x-hidden">
            <Suspense fallback={<div className="p-8 text-center font-bold text-slate-500">Loading...</div>}>
              {children}
            </Suspense>
          </main>
        </Providers>
      </body>
    </html>
  );
}
