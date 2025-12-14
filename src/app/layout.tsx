import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Toaster } from "sonner";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Admin Panel | Web2Print",
    description: "Admin management console.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-gray-50/50`}>
                <div className="flex h-screen overflow-hidden">
                    {/* Sidebar */}
                    <Sidebar />

                    {/* Content Area */}
                    <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                        {/* Header */}
                        <Header />

                        {/* Main Content */}
                        <main className="w-full h-full max-w-screen-2xl p-4 md:p-6 2xl:p-10 mx-auto">
                            {children}
                        </main>
                    </div>
                </div>
                <Toaster />
            </body>
        </html>
    );
}
