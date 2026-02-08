import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Serif } from "next/font/google";
import { LenisProvider } from "@/lib/lenis-provider";
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
  title: "HSFX - Build faster. Ship cleaner.",
  description:
    "A component-driven Webflow framework with 40+ attribute modules, CMS automation, and a complete developer toolkit.",
  keywords: [
    "Webflow",
    "framework",
    "components",
    "developer tools",
    "CMS",
    "web development",
  ],
  authors: [{ name: "HSFX" }],
  openGraph: {
    title: "HSFX - Build faster. Ship cleaner.",
    description:
      "A component-driven Webflow framework with 40+ attribute modules, CMS automation, and a complete developer toolkit.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "HSFX - Build faster. Ship cleaner.",
    description:
      "A component-driven Webflow framework with 40+ attribute modules, CMS automation, and a complete developer toolkit.",
  },
  icons: {
    icon: [
      { url: "/favicon32x.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon256x.png", sizes: "256x256", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased bg-background text-text-primary`}
      >
        <LenisProvider>
          <div className="dot-grid min-h-screen">{children}</div>
        </LenisProvider>
      </body>
    </html>
  );
}
