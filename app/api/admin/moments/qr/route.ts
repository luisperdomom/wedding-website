import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const accessUrl = `${new URL(request.url).origin}/momentos`;
  const qrDataUrl = await QRCode.toDataURL(accessUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 700,
    color: { dark: "#3A2A23", light: "#FFFFFF" },
  });
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      <rect width="1080" height="1350" fill="#F5F1EA"/>
      <rect x="45" y="45" width="990" height="1260" rx="28" fill="none" stroke="#C7A27C" stroke-width="2"/>
      <text x="540" y="170" text-anchor="middle" fill="#3A2A23" font-family="Georgia, serif" font-size="62" letter-spacing="10">LUIS &amp; AILYN</text>
      <text x="540" y="235" text-anchor="middle" fill="#7A8468" font-family="Arial, sans-serif" font-size="20" letter-spacing="6">NUESTRO ÁLBUM COMPARTIDO</text>
      <line x1="430" y1="285" x2="650" y2="285" stroke="#C7A27C" stroke-width="2"/>
      <image href="${qrDataUrl}" x="190" y="340" width="700" height="700"/>
      <text x="540" y="1115" text-anchor="middle" fill="#3A2A23" font-family="Georgia, serif" font-size="34">Escanea y comparte un momento</text>
      <text x="540" y="1170" text-anchor="middle" fill="#786b62" font-family="Arial, sans-serif" font-size="22">Ayúdanos a guardar nuestra boda desde tus ojos.</text>
      <text x="540" y="1245" text-anchor="middle" fill="#C7A27C" font-family="Georgia, serif" font-size="30">12 · 12 · 2026</text>
    </svg>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": 'inline; filename="qr-momentos-luis-aylin.svg"',
      "Cache-Control": "private, no-store",
    },
  });
}
