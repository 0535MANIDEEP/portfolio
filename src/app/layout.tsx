import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Manideep Daram | Frontend & Full-Stack Developer",
    template: "%s | Manideep Daram",
  },
  description:
    "Frontend and full-stack developer building reliable web applications. Based in Hyderabad, open to remote roles across India.",
  keywords: [
    "Manideep Daram",
    "Frontend Developer",
    "Full-Stack Developer",
    "TypeScript",
    "React",
    "Vue",
    "Node.js",
    "Hyderabad",
    "Software Engineer",
  ],
  authors: [{ name: "Manideep Daram" }],
  creator: "Manideep Daram",
  openGraph: {
    title: "Manideep Daram | Frontend & Full-Stack Developer",
    description:
      "Frontend and full-stack developer building reliable web applications.",
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://manideep-portfolio-navy.vercel.app",
    siteName: "Manideep Daram",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://manideep-portfolio-navy.vercel.app"),
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-[#fafaf9] text-[#1c1917]`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-[#1c1917] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#fafaf9]"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
