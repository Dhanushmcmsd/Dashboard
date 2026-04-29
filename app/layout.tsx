import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "BranchSync Dashboard",
  description: "Financial branch management and analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${GeistSans.className}`}>
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
