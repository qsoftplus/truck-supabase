import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Truck Management System",
  description: "Manage trips, expenses, and payments efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <div className="flex h-screen overflow-hidden">
          <aside className="hidden w-64 flex-shrink-0 lg:block border-r border-slate-200 bg-white">
            <Sidebar />
          </aside>
          <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
