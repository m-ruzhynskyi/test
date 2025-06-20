import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Система обліку оргтехніки",
  description: "Централізований облік та контроль за розміщенням та станом оргтехніки на підприємстві",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto p-4">
              {children}
            </main>
            <footer className="border-t py-4 text-center text-sm text-gray-500">
              <div className="container mx-auto">
                © {new Date().getFullYear()} Система обліку оргтехніки
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
