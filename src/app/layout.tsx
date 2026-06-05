import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "PoolFC",
  description: "Soccer prediction pool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
