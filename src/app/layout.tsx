"use client"

import { Inter as FontSans } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import NextAuthProvider from "@/lib/context/NextAuthProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Navbar } from "@/components/Nav"
import { Toaster } from "@/components/ui/toaster"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const queryClient = new QueryClient()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <NextAuthProvider>
          <QueryClientProvider client={queryClient}>
            <Navbar />
            <main className="max-w-screen-lg mx-auto min-h-screen py-8 px-6">
              {children}
            </main>
            <Toaster />
          </QueryClientProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
