import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GauntletAI Email Forwarding",
  description: "Email forwarding service for GauntletAI students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          /* Hide large SVG icons */
          body > svg,
          #__next > svg,
          svg:not([class]),
          svg[width="100%"],
          svg[height="100%"] {
            display: none !important;
          }
          
          /* Hide duplicate layout elements */
          body > div:first-child:not(.admin-layout):not(.dashboard) {
            display: none !important;
          }
          
          /* Hide any navigation elements that aren't part of our layout */
          body > nav,
          body > header:not(.admin-header) {
            display: none !important;
          }
          
          /* Hide any unwanted text elements */
          body > div:not(.admin-layout):not(.dashboard) > h1,
          body > div:not(.admin-layout):not(.dashboard) > h2 {
            display: none !important;
          }
        `}</style>
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
