# ESTADO DEL PROYECTO — Starlink Venezuela

> Documento de continuidad. Se actualiza al terminar cada tarea para no perder el foco.
> Última actualización: **2026-06-08**

## Snapshot actual
- **Rama:** `main` (todo fusionado y **desplegado en producción**).
- **Producción:** https://starlink2.vercel.app (Vercel, proyecto `starlink2`, DB Neon). Deploy automático al pushear `main`.
- **Push a GitHub:** requiere token fine-grained con permiso *Contents: Read/write* sobre `starlink2` (se usó uno temporal; revisar que esté revocado).

## ✅ Sesión 2026-06-08 — completado y desplegado
1. **Feature costo por lote + ganancia + pago multi-método** (ver más abajo). Migración aplicada en local (5435) y en Neon producción.
2. **Optimización de navegación (UX):** sidebar reagrupado por modelo mental (Principal · Ventas y cobros · Catálogo e inventario · Clientes · Marketing · Configuración), secciones **colapsables** (solo abre la activa), tipografía más liviana. `src/components/layout/sidebar.tsx`.
3. **Productos simplificado:** quitado el campo "Costo" manual (se calcula desde Compras/Lotes); API inicializa costPrice en 0.
4. **Aviso Telegram de suscripciones por vencer (próx. 5 días):** `src/jobs/expiring-subscriptions.ts` + `src/app/api/cron/expiring-subscriptions/route.ts` (protegido CRON_SECRET, acepta `?days=` y `?secret=`) + cron diario 13:30 UTC en `vercel.json`. **Probado en producción: Telegram entrega OK** (token/adminChat/canal habilitados en Vercel). Define "vencer" = `billingDay` dentro de la ventana.
   - Para disparar manual: `GET /api/cron/expiring-subscriptions?secret=$CRON_SECRET&days=5`.
   - Endpoint temporal de seed de prueba: creado, usado y **eliminado** (datos demo limpiados).

## 🆕 Sesión 2026-06-08 (cont.) — Edición y borrado de equipos
- **`/equipos` ahora permite editar y borrar** los registros ya cargados (antes la tabla era solo lectura).
  - **API** `src/app/api/equipos/[id]/route.ts`: añadido `DELETE` (rol **ADMIN**, con audit; bloquea 409 si el equipo está asociado a una venta `saleItemId`, o FK P2003 → sugiere desactivar). `PATCH` ahora también audita y maneja serial duplicado (P2002 → 409).
  - **UI** nuevo client component `src/app/(admin)/equipos/equipment-table.tsx` (reemplaza la tabla inline de `page.tsx`): columna "Acciones" con **Editar** (panel inline expandible reutilizando los campos del alta) y **Borrar** (con `confirm()`). `page.tsx` pasa `equipment`/`clients` serializados.
  - Verificado: `tsc --noEmit` ✓ y `next build` ✓.
  - **Pendiente desplegar**: push a `main` (requiere token GitHub) para que Vercel lo publique en producción.

## ✅ Decisión: se trabaja TODO sobre PRODUCCIÓN (Neon)
- El usuario confirmó (2026-06-08) que la data operativa real vive en **Neon producción**, NO en la DB local 5435 (esa es demo may-4: 5 clientes ficticios — Carlos R., Ana **Pérez**, Luis M., Patricia H., Ricardo L. — y 0 equipos).
- Para operar sobre Neon (p.ej. asignar el equipo serial **KIT4M01116507RDD** a la clienta **Ana Covadonga**, que no existen en local) hace falta el `DATABASE_URL` de Neon. **No hay `vercel` CLI ni `.env.production.local` aquí** → pedido al usuario que lo provea (Vercel → starlink2 → Settings → Environment Variables → DATABASE_URL) en un `.env.production.local` temporal. **Tarea KIT4M…→Ana Covadonga queda en espera de ese acceso.**

## Entorno (resuelto)
- **DB del proyecto levantada:** contenedor `starlink_postgres` (postgres:16-alpine) corriendo en **host 5435** (el 5433 lo ocupa el compartido `pg-shared`), datos en bind-mount `./data/postgres`, arrancado con `-u $(id -u):$(id -g)`. `.env` actualizado a **5435** + `DIRECT_URL`.
- **Migración aplicada ✓:** `prisma migrate deploy` aplicó 9 migraciones pendientes (la DB estaba atrasada en may-4: faltaban 8 de mayo + la nueva `20260608120000_cost_profit_overhaul`). `Database schema is up to date`. Backfill OK (10 PaymentSplit para 10 pagos existentes).
- Datos actuales (prueba): users=3, clients=5, products=4, payments=10, sales=0, equipment=0, purchaselots=0.
- El entorno tiene Node v12 en el sistema (sirve solo Docker `node:22`). Para correr Prisma/Next se usó `docker run ... node:22`.
- ⚠️ Si tu data "real" de mayo (equipos/ventas/marketing) estaba en otro postgres (p.ej. pg-shared con otras credenciales), avísame: esta `./data/postgres` estaba en estado may-4 y ahora quedó al día con el código.

## ✅ Feature: Costo real por lote + ganancia + pago multi-método (DESPLEGADO)
Plan: `~/.claude/plans/smooth-shimmying-breeze.md`. **Implementado, verificado y en producción** (tsc + `next build` + e2e a nivel de datos en shadow):
- **Schema + migración** con backfill (Product.serialized; PurchaseLot+ChargeMode; Equipment como unidad serializada con landedCost/availability/lot/saleItem; SaleItem.unitCostSnapshot/costTotal+unit; Payment.saleId + PaymentSplit).
- **Compras/Lotes** (`/compras`): API `api/compras` + form que resuelve flete/impuesto (fijo o %, % sobre base), calcula costo landed, crea unidades serializadas y cachea `Product.costPrice`. Nav nuevo "Compras / Lotes".
- **Editor de splits compartido** (`components/payments/payment-splits-editor.tsx`) + libs `lib/payments/{methods,splits,rate}.ts`. Métodos en Bs (Pago Móvil) piden monto Bs + tasa (snapshot).
- **Venta** (`api/ventas` + `new-sale-form`): selección de unidad por serial, COGS real, marca unidad VENDIDO, crea Payment+splits, muestra ganancia. DELETE libera la unidad.
- **Cobros** y **Pagos manual** usan el editor de splits. Detalle de pago muestra desglose + ganancia de la venta.
- **Métricas** (`lib/metrics`, `lib/marketing/metrics`) usan COGS real (snapshot/landed); valuación de inventario serializado por unidades. Contrato móvil `amount/starlinkCost/priceLocked` intacto.
- Flag `serialized` editable en alta/edición de producto.

### Follow-ups pendientes (opcionales)
- [ ] Probar el flujo completo en producción con datos reales (login admin → registrar lote → vender unidad con pago dividido → ver ganancia).
- [ ] Convertir `PlanRequest` (solicitud-activación) en Payment al procesarla — última pieza de consolidación.
- [ ] `byMethod` en `metrics.ts` agrupa por `Payment.method`; con multi-método conviene `groupBy(PaymentSplit.method)`.
- [ ] Más optimización UX si se pide: topbar/breadcrumbs, densidad del dashboard, aligerar forms de Venta y Lote.

## Qué hay funcionando (módulos)
- **Auth/RBAC** — NextAuth con roles ADMIN / INVENTARIO / CLIENTE
- **Productos, Planes, Inventario** — stock y proyección de déficit
- **Pagos / Cobros** — facturación mensual con ganancia por plan; métodos de pago configurables (tasa Bs/USD, comisiones); comprobantes en Blob privado servidos vía endpoint protegido
- **Notificaciones multicanal** — WhatsApp Cloud API y email con implementación real; Telegram / Twilio / Instagram vía stubs
- **Equipos / Antenas** — `/equipos` + API CRUD
- **Soporte / Tickets** — `/soporte` + acciones de ticket
- **CRM** — timeline y notas en ficha de cliente `/clientes/[id]`
- **Marketing / Ads** — módulo de rendimiento
- **Landing** — rediseño futurista con fotos lifestyle, secciones Asesorías/Sectores/FAQ
- **Mobile** — app Flutter `starlink_admin` para administradores (`mobile/`)
- **Jobs** — node-cron: proyección de déficit + recordatorios de cobro

## Próximos pasos / pendientes
- [ ] Aclarar dónde vive la data real de producción (Neon está casi vacío — 0 suscripciones).
- [ ] Follow-ups opcionales del feature (ver arriba).

## Notas / decisiones abiertas
- Telegram del admin **configurado y funcionando** en producción (token + chat id + canal habilitado en Vercel).

## Cómo arrancar (entorno real de este equipo)
```bash
# Node del sistema es v12 → usar Docker node:22 para Prisma/Next.
# La DB del proyecto corre en el contenedor starlink_postgres → host 5435
#   (el 5433 lo ocupa el compartido pg-shared). .env ya apunta a 5435.
cd "claude starlink/claude starlink"   # el repo está anidado

# arrancar la DB del proyecto (si el contenedor no está corriendo):
docker run -d --name starlink_postgres --restart unless-stopped \
  -u "$(id -u):$(id -g)" -e POSTGRES_DB=starlink_ve -e POSTGRES_USER=starlink \
  -e POSTGRES_PASSWORD=starlink -p 5435:5432 \
  -v "$PWD/data/postgres":/var/lib/postgresql/data postgres:16-alpine

# correr comandos Node vía Docker (red host para llegar a la DB):
docker run --rm --network host -u "$(id -u):$(id -g)" -e HOME=/tmp \
  -v "$PWD":/app -w /app node:22 npx next dev   # o: prisma migrate deploy / tsc --noEmit

# Deploy a producción: push a main → Vercel auto-despliega (corre prisma migrate deploy).
```
