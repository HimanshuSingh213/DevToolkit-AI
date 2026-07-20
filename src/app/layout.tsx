import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap"
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://dev-toolkit-ai.vercel.app"),
  title: {
    default: "DevToolkit.AI - AI-Powered Developer Workspace & Tools",
    template: "%s | DevToolkit.AI"
  },
  description: "Supercharge your shipping workflow. Generate comprehensive READMEs, validate JSON, write semantic conventional git commit messages, and build regex expressions with high-performance AI tools.",
  keywords: [
    "developer tools", "AI coding assistant", "readme generator", 
    "conventional commits helper", "regex sandbox", "json validator", 
    "shipping utilities", "Next.js dev tools"
  ],
  authors: [{ name: "Himanshu Singh" }],
  creator: "Himanshu Singh",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dev-toolkit-ai.vercel.app",
    title: "DevToolkit.AI - AI Developer Workspace",
    description: "Automate the parts of shipping nobody enjoys. Standardize commit logs, generate specifications, test regex, and audit configuration schemas.",
    siteName: "DevToolkit.AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevToolkit.AI - AI Developer Workspace",
    description: "Automate the parts of shipping nobody enjoys. Standardize commit logs, generate specifications, test regex, and audit configuration schemas.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
