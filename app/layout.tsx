import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; // <-- Importamos el Provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kahoot Web3",
  description: "DApp Integradora - TP2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Envolvemos toda la app con el Provider */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}