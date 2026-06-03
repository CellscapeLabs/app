import type { Metadata } from "next";
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
  title: "Cellscape — Interactive Biology Learning",
  description:
    "Animated biology visualizations and virtual labs for high school and early college students.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Cellscape — Interactive Biology Learning",
    description:
      "Animated biology visualizations and virtual labs for high school and early college students.",
    url: "https://cellscape.app",
    siteName: "Cellscape",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cellscape — Interactive Biology Learning",
    description:
      "Animated biology visualizations and virtual labs for high school and early college students.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
