import { ClerkProvider } from '@clerk/nextjs'
import { UserButton } from "@clerk/nextjs";
import { MainNav } from "@/components/main-nav";
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="font-liter">
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Liter:wght@400&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="font-light">
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center justify-center">
                <MainNav className="mx-auto" />
                <div className="absolute right-6">
                  <UserButton />
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
