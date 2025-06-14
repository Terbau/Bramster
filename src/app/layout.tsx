"use client"

import { Inter as FontSans } from "next/font/google"
import "./globals.css"
import 'katex/dist/katex.min.css';
import { cn } from "@/lib/utils"
import NextAuthProvider from "@/lib/context/NextAuthProvider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Navbar } from "@/components/Nav"
import { Toaster } from "@/components/ui/toaster"
import { Footer } from "@/components/Footer"
import { usePathname } from "next/navigation"

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
  const currentHref = usePathname()
  const isDashboard = currentHref.startsWith("/dashboard")

  return (
    <html lang="en">
      <NextAuthProvider>
        <NuqsAdapter>
          <QueryClientProvider client={queryClient}>
            <head>
              <title>Bramster</title>
            </head>
            <body
              className={cn(
                "min-h-screen bg-background font-sans antialiased flex flex-col w-full",
                fontSans.variable
              )}
            >
              <Navbar />
              <main
                className={cn(
                  "w-full mx-auto py-8 px-6 mb-10",
                  isDashboard ? "max-w-screen-2xl" : "max-w-screen-lg"
                )}
              >
                {children}
              </main>
              <Toaster />
              <Footer />
            </body>
          </QueryClientProvider>
        </NuqsAdapter>
      </NextAuthProvider>
    </html>
  )
}
