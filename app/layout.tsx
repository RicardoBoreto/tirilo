import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-poppins",
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "SaaS Tirilo - Admin",
    description: "Sistema de gestão de clínicas",
};

import { EnvironmentBanner } from "@/components/EnvironmentBanner"
import { cookies } from "next/headers"

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies()
    const env = cookieStore.get('tirilo-env')?.value || 'prod'

    return (
        <html lang="pt-BR">
            <body className={`${poppins.variable} ${inter.variable} font-sans antialiased bg-[#F8FBFF]`}>
                <EnvironmentBanner env={env} />
                {children}
                <Toaster />
            </body>
        </html>
    );
}
