import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";

const geistSans = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Catálogo Virtual",
    template: "%s | Catálogo Virtual",
  },
  description: "Catálogo público y panel operativo para gestionar productos y pedidos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-[var(--foreground)]">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
