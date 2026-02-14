import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Serif } from "next/font/google";
import { Suspense } from "react";
import { LenisProvider } from "@/lib/lenis-provider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { brand, messages } from "@/config";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: messages.metadata.title,
  description: brand.description,
  keywords: [
    "Webflow",
    "framework",
    "components",
    "developer tools",
    "CMS",
    "web development",
  ],
  authors: [{ name: brand.name }],
  openGraph: {
    title: messages.metadata.title,
    description: brand.description,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: messages.metadata.title,
    description: brand.description,
  },
  icons: {
    icon: [
      { url: brand.favicon.small, sizes: "32x32", type: "image/png" },
      { url: brand.favicon.large, sizes: "256x256", type: "image/png" },
    ],
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
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased bg-background text-text-primary`}
      >
        <ThemeProvider>
          <Suspense fallback={null}>
            <AuthProvider>
              <LenisProvider>
                <div className="dot-grid min-h-screen">{children}</div>
              </LenisProvider>
            </AuthProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
