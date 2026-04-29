# Deploy en Vercel — checklist

## 1. Cuentas (haces tú)

1. **GitHub** — https://github.com/signup (si no tienes)
2. **Vercel** — https://vercel.com/signup → "Continue with GitHub"
3. **Repo nuevo en GitHub** — vacío, sin README ni .gitignore (lo aporta este proyecto)

## 2. Push del código a GitHub

Cuando tengas el repo creado, copia su URL HTTPS y dime el nombre. Te paso los comandos exactos para `git remote add` y `git push`.

## 3. En Vercel — importar y configurar

1. **New Project → Import Git Repository** → selecciona el repo recién pusheado.
2. **Framework Preset**: Next.js (lo autodetecta).
3. **Build Command**: dejar el default (`npm run build`, ya hace `prisma generate && prisma migrate deploy && next build`).
4. **Storage tab del proyecto**:
   - **Marketplace → Neon** → Create → conectar al proyecto. Esto inyecta `DATABASE_URL` automáticamente.
   - **Marketplace → Vercel Blob** → Create store → conectar al proyecto. Inyecta `BLOB_READ_WRITE_TOKEN`.
5. **Settings → Environment Variables** — pegar las de abajo (apartado "Variables a pegar").
6. **Deploy**.

## 4. Variables a pegar en Vercel

> Ya inyectadas por las integraciones (no las pegues manual): `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`.

```
NEXTAUTH_SECRET=Cs2DoNZ9Pe3Xt9io4kA0rydQdX71M3CFF8/t2fTffZo=
NEXTAUTH_URL=https://TU-DOMINIO.vercel.app
CRON_SECRET=0KtnmmxhmNi2SDOqA9aH1txS1NLCxtI1r7mmCG2ZzUI=

SEED_ADMIN_EMAIL=admin@starlink.ve
SEED_ADMIN_PASSWORD=0ojw5bPonYF0pSM8PR7Q!Aa1
SEED_ADMIN_NAME=Administrador Starlink

APP_NAME=Starlink Venezuela
APP_TIMEZONE=America/Caracas

CONTACT_WHATSAPP=+584141234567
CONTACT_INSTAGRAM=starlink.venezuela
CONTACT_EMAIL=ventas@starlink.ve
CONTACT_CITY=Caracas, Venezuela
```

**`NEXTAUTH_URL`** — sustituir `TU-DOMINIO.vercel.app` por el dominio real que te asigne Vercel después del primer deploy. Luego volver y editar la variable, y redeploy.

### Opcionales (rellenar cuando quieras activar esos canales)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=Starlink Venezuela <no-reply@starlink.ve>

WHATSAPP_PHONE_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_API_VERSION=v20.0

TELEGRAM_BOT_TOKEN=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_ACCOUNT_ID=

ADMIN_NOTIFY_EMAIL=
```

## 5. Después del primer deploy

1. **Sembrar el admin** — en local, apuntando a la DB de Neon (puedes copiar `DATABASE_URL` de Vercel a un `.env.production.local` temporal):
   ```
   DATABASE_URL="postgresql://...neon..." npm run db:seed
   ```
   O alternativa: añadir un endpoint protegido `/api/admin/seed` y llamarlo una vez. Te lo armo si prefieres.
2. **Login** con `admin@starlink.ve` / la `SEED_ADMIN_PASSWORD` de arriba. Cambiarla al primer login (el sistema ya lo fuerza por `mustChangePassword=true`).
3. **Verificar cron** — Vercel Dashboard → Project → Cron Jobs. Verás los 2 schedules. Puedes dispararlos manual desde ahí para probar.

## Notas

- **Horarios cron**: Vercel cron usa **UTC**. Configurado a 12:00 UTC y 13:00 UTC = 8:00 y 9:00 en Caracas (UTC-4).
- **Hobby (free)** permite 2 cron jobs por proyecto — cabe justo.
- **Vercel Blob free**: 1 GB storage, suficiente para empezar.
- **Neon free**: 0.5 GB storage, 1 DB, suspende tras 5 min sin uso (re-arranca solo en ~1 s).
- **`node-cron`**: queda en `package.json` y el script `npm run jobs` sigue existiendo por si quieres correrlos local. En Vercel no se usan: los reemplazan los endpoints `/api/cron/*`.
