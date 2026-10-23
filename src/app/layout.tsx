import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "UpForge OS",
  description: "Internal lead-generation workspace for UpForge Consulting.",
};

// Runs before hydration so there is no light/dark flash. next/script with beforeInteractive is
// injected into the server HTML, which avoids React's "script tag inside a component" warning.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-right" richColors closeButton />
        <Script id="theme" strategy="beforeInteractive">{themeScript}</Script>
      </body>
    </html>
  );
}
