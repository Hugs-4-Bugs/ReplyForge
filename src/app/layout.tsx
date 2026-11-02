import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReplyForge - Answer security questionnaires in minutes",
  description:
    "ReplyForge drafts defensible answers to security questionnaires and RFPs from your own approved content library - with source citations on every line. The same workflow Loopio charges $30K+/yr for, at $99/mo.",
  keywords: [
    "security questionnaire",
    "RFP response",
    "RFP software",
    "Loopio alternative",
    "RFPIO alternative",
    "Conveyor alternative",
    "vendor security questionnaire",
    "security questionnaire automation",
    "SaaS RFP tool",
  ],
  authors: [{ name: "ReplyForge" }],
  applicationName: "ReplyForge",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "ReplyForge - Answer security questionnaires in minutes",
    description:
      "Drafts defensible answers from your approved content library - with source citations. $99/mo instead of Loopio's $30K/yr.",
    url: "https://replyforge.app",
    siteName: "ReplyForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplyForge - Security questionnaire response for SMB SaaS",
    description:
      "Same workflow Loopio charges $30K+/yr for. $99-$799/mo. No seat traps, no contract, no implementation fee.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // suppressHydrationWarning on both <html> and <body> so that
  // browser-extension-injected attributes (e.g. bis_skin_checked from
  // Bitdefender/Bitwarden, data-lt-installed from Grammarly, etc.) don't
  // trigger Next.js hydration mismatch errors. This is the recommended
  // fix per Next.js docs for third-party attribute injection.
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
