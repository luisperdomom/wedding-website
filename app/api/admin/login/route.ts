import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password !== "string" || !verifyAdminPassword(body.password)) {
      return NextResponse.json(
        { error: "Contraseña incorrecta." },
        { status: 401 },
      );
    }

    const session = createAdminSession();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE_NAME, session.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: session.maxAge,
    });
    return response;
  } catch (error) {
    console.error("No se pudo iniciar la sesión administrativa:", error);
    return NextResponse.json(
      { error: "El acceso administrativo no está configurado correctamente." },
      { status: 500 },
    );
  }
}
