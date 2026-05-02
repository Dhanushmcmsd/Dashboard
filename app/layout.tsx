import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Supra Pacific — Branch Dashboard",
  description: "Supra Pacific Financial Services — Management Information System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${GeistSans.className} ${GeistMono.variable}`}>
      <body className="bg-background text-text-primary min-h-screen antialiased">
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
