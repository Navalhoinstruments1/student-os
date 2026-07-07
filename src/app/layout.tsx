import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PwaSetup from "@/components/PwaSetup";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Student OS",
  description: "Sistema de gestão académica e financeira de elite",
  manifest: "/manifest.json", 
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // É esta a magia que desliga o zoom com os dedos
  themeColor: '#0f172a', // Opcional: pinta a barra de cima do telemóvel com a cor da tua app (ajusta o HEX se quiseres)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning translate="no" className="theme-dark">
      <head>
        {/* A ARMADILHA NATIVA: Vai forçar um popup no teu telemóvel com o erro */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.onerror = function(msg, url, line) {
            alert("🚨 ERRO FATAL: " + msg + "\\nLinha: " + line);
          };
          window.addEventListener("unhandledrejection", function(event) {
            alert("🚨 PROMESSA REJEITADA: " + event.reason);
          });
        `}} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-app-bg text-text-main flex flex-col min-h-screen transition-colors duration-300`}>
        <ThemeProvider>
          <PwaSetup />
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto pt-4 pb-24 md:pt-24 md:pb-8 transition-all duration-300">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}