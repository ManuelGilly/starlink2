# Starlink Venezuela — Sistema de Reportes de Pago

Sistema web integral para gestión de productos, planes, clientes, inventario, pagos y notificaciones multicanal de Starlink Venezuela.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **PostgreSQL 16** + **Prisma**
- **NextAuth** (credenciales, RBAC)
- **Tailwind CSS** + **shadcn/ui**
- **node-cron** (jobs de proyección de déficit y recordatorios de cobro)
- Notificaciones: WhatsApp Cloud API, Telegram Bot, Twilio SMS, SMTP, Instagram Graph

## Requisitos

- Node 20+
- Docker (para Postgres local)

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env
# editar .env con tus valores

# 3. Levantar Postgres
docker compose up -d

# 4. Aplicar migraciones y sembrar datos iniciales
npm run db:migrate
npm run db:seed

# 5. Iniciar dev server
npm run dev
```

Abrir http://localhost:3000

Credenciales iniciales: las definidas en `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` de tu `.env`.

## Scripts

- `npm run dev` — Next.js en modo desarrollo
- `npm run build && npm start` — producción
- `npm run db:migrate` — crear/aplicar migraciones
- `npm run db:seed` — sembrar roles y admin inicial
- `npm run db:studio` — abrir Prisma Studio
- `npm run jobs` — correr procesos en background (cron de proyección y cobros)

## Estructura

```
src/
  app/
    (auth)/login         Login
    (admin)/*            Rutas protegidas por rol ADMIN/INVENTARIO
    (cliente)/*          Rutas del rol CLIENTE
    api/*                API routes
  lib/
    db.ts                Cliente Prisma singleton
    auth.ts              Config NextAuth
    rbac.ts              Guards por rol
    notifications/       Abstracción multicanal
    inventory/           Lógica de stock y proyección
  jobs/                  Tareas programadas (node-cron)
  components/ui          Componentes shadcn
prisma/
  schema.prisma          Modelo de datos
  seed.ts                Datos iniciales
```

## Roles

- **ADMIN** — acceso total; métricas del negocio, usuarios, configuración
- **INVENTARIO** — productos, planes, inventario, movimientos
- **CLIENTE** — dashboard personal: pagos, garantías, productos, reportar pago

Un usuario puede tener múltiples roles.

## Notificaciones

Todos los canales usan una interfaz común (`NotificationChannel`). Cada canal tiene una implementación stub (logger) hasta que se configuren las credenciales en `.env`. El recordatorio de cobro mensual se envía por WhatsApp vía job cron.
