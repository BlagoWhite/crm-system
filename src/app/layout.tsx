import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ConfigError from "@/components/ConfigError";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "CRM System",
  description: "A powerful CRM system for managing customers and deals",
};

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params?: { locale?: string };
}>) {
  // Default to 'en' if no locale is provided
  const lang = params?.locale || 'en';
  
  return (
    <html lang={lang}>
      <body className={inter.className}>
        <AuthProvider>
          <ConfigError />
          <div className="min-h-screen bg-gray-50">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
} 