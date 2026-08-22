import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuestros Momentos | Luis & Ailyn",
  description: "Álbum privado y compartido de nuestra boda.",
  robots: { index: false, follow: false },
};

export default function MomentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
