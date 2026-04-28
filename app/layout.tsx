import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = { title: "Branch Dashboard", description: "Multi-branch financial dashboard" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body className="bg-background text-text-main font-sans antialiased">
        <AuthProvider>
          <QueryProvider>
            {children}
            <Toaster theme="dark" position="top-right" />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
