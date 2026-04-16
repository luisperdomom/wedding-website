import type { Metadata } from "next";
import "./globals.css";
import "aos/dist/aos.css"

import { Parisienne, Playfair_Display, Inter, Josefin_Sans } from "next/font/google"

import { Cormorant_Garamond } from "next/font/google"

const serifFont = Cormorant_Garamond({
  subsets:["latin"],
  weight:["300","400","500"],
  variable:"--font-serif"
})

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

const elegantFont = Josefin_Sans({
  subsets:["latin"],
  weight:["300","400"],
  variable:"--font-elegant"
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
      <body className={`${bodyFont.variable} ${scriptFont.variable} ${titleFont.variable} ${elegantFont.variable} ${serifFont.variable}`}>
        {children}
      </body>
    </html>
  );
}