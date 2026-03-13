import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ticket Visa Travel Portal - Human Resource Management System",
  description: "Modern HR Management System for Ticket Visa Travel, built with Next.js, TypeScript, and Tailwind CSS.",
  keywords: ["Ticket Visa Travel", "HR", "Human Resources", "Next.js", "TypeScript", "Tailwind CSS", "Employee Management"],
  authors: [{ name: "Ticket Visa Travel IT Team" }],
  openGraph: {
    title: "Ticket Visa Travel Portal - Manage Your Workspace",
    description: "Enjoy your workspace. Access Ticket Visa Travel's employee dashboard to view payslips, claim expenses, and submit leave requests natively.",
    url: "https://ticketvisatravel.com",
    siteName: "Ticket Visa Travel HRMS",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Ticket Visa Travel Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ticket Visa Travel Portal - Human Resource Management System",
    description: "Modern HR Management System for Ticket Visa Travel. Enjoy your workspace.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
