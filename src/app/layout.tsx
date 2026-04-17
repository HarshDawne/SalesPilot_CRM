import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import ClientLayoutWrapper from "@/components/layout/ClientLayoutWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "HyperSell CRM | Strategic Sales OS",
  description: "Billion-dollar Real Estate Operating System for High-Velocity Teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.variable} font-sans bg-bg-base text-text-main antialiased selection:bg-ai-accent/30`}>
        <ToastProvider>
           <ClientLayoutWrapper>
             {children}
           </ClientLayoutWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
