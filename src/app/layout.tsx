import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
  title: "DevToolkit AI",
  description: "AI-powered developer utilities to generate READMEs, explain code, create commit messages, generate regex, and format JSON.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
