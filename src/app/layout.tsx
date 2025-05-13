import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
      <head>
        {/* Script to apply theme before page renders to prevent flash */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              function getTheme() {
                const storedTheme = localStorage.getItem('theme');
                if (storedTheme === 'dark') return 'dark';
                if (storedTheme === 'light') return 'light';
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              
              const theme = getTheme();
              document.documentElement.classList.toggle('dark', theme === 'dark');
            })();
          `
        }} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <ConfigError />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">{children}</div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 