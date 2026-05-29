import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "El Juicio",
  description:
    "Juego interactivo de debate jurídico — Facultad de Derecho UNAM",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground relative">
        {/* Imagen de fondo global */}
        <div className="fixed inset-0 opacity-[0.07] bg-[url('/fondo.jpg')] bg-center bg-no-repeat bg-cover pointer-events-none z-0" />
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
          <footer className="py-4 text-center">
            <p className="text-xs text-text-muted">
              Creado y diseñado por Enrique Vázquez Mondragón
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
