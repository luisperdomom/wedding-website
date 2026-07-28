# Luis & Ailyn — Invitación de boda

Aplicación Next.js con invitaciones privadas, confirmación RSVP y panel
administrativo protegido mediante una sesión firmada en el servidor.

## Configuración privada

Copia `.env.example` a `.env.local` y reemplaza todos los valores. Ninguna de
estas variables debe usar el prefijo `NEXT_PUBLIC_`.

- `ADMIN_PASSWORD`: contraseña única del panel.
- `ADMIN_SESSION_SECRET`: secreto aleatorio de 32 caracteres o más. Puedes
  generarlo con `openssl rand -base64 48`.
- Las variables `FIREBASE_ADMIN_*`: credenciales de una cuenta de servicio
  obtenidas en Firebase Console, en **Configuración del proyecto → Cuentas de
  servicio → Generar nueva clave privada**.

En Vercel se recomienda `FIREBASE_ADMIN_PRIVATE_KEY_BASE64`, que evita problemas
con saltos de línea. Si está configurada, tiene prioridad sobre
`FIREBASE_ADMIN_PRIVATE_KEY`.

Configura los mismos valores en Vercel, dentro de **Project Settings →
Environment Variables**, para Production, Preview y Development según
corresponda. No guardes el archivo JSON de la cuenta de servicio en el repo.

## Reglas de Firestore

Después de configurar Firebase CLI, publica las reglas cerradas:

```bash
npx firebase-tools login
npx firebase-tools use wedding-rsvp-88df0
npx firebase-tools deploy --only firestore:rules
```

Haz el despliegue de las reglas solamente cuando la versión con las nuevas rutas
del servidor también esté lista para producción; las reglas bloquean el acceso
directo desde el navegador.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
