import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  subsets: ["latin"],
});

import QueryProvider from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "ECMS - Event Competition Management System",
  description: "Aplikasi manajemen perlombaan dan event",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
