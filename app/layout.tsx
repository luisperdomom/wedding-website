import type { Metadata } from "next";
import "./globals.css";
import "aos/dist/aos.css"

import { Parisienne, Playfair_Display, Inter } from "next/font/google"

const bodyFont = Inter({
  subsets:["latin"],
  variable:"--font-body"
})

const scriptFont = Parisienne({
  weight:"400",
  subsets:["latin"],
  variable:"--font-script"
})

const titleFont = Playfair_Display({
  subsets:["latin"],
  variable:"--font-title"
})

export const metadata: Metadata = {
  title: "Luis & Ailyn | Nuestra Boda",
  description: "Invitación a nuestra boda",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${bodyFont.variable} ${scriptFont.variable} ${titleFont.variable}`}>
        {children}
      </body>
    </html>
  );
}