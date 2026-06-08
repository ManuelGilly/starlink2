# ESTADO DEL PROYECTO — Starlink Venezuela

> Documento de continuidad. Se actualiza al terminar cada tarea para no perder el foco.
> Última actualización: **2026-06-08**

## Snapshot actual
- **Rama:** `feat/costo-real-lote-ganancia` (trabajo en curso, basada en `main`)
- **Último commit en main:** `5c39ebb` (2026-05-18) — *feat: Notificaciones reales + Equipos/Antenas + Soporte/Tickets + Timeline CRM*

## Entorno (resuelto)
- **DB del proyecto levantada:** contenedor `starlink_postgres` (postgres:16-alpine) corriendo en **host 5435** (el 5433 lo ocupa el compartido `pg-shared`), datos en bind-mount `./data/postgres`, arrancado con `-u $(id -u):$(id -g)`. `.env` actualizado a **5435** + `DIRECT_URL`.
- **Migración aplicada ✓:** `prisma migrate deploy` aplicó 9 migraciones pendientes (la DB estaba atrasada en may-4: faltaban 8 de mayo + la nueva `20260608120000_cost_profit_overhaul`). `Database schema is up to date`. Backfill OK (10 PaymentSplit para 10 pagos existentes).
- Datos actuales (prueba): users=3, clients=5, products=4, payments=10, sales=0, equipment=0, purchaselots=0.
- El entorno tiene Node v12 en el sistema (sirve solo Docker `node:22`). Para correr Prisma/Next se usó `docker run ... node:22`.
- ⚠️ Si tu data "real" de mayo (equipos/ventas/marketing) estaba en otro postgres (p.ej. pg-shared con otras credenciales), avísame: esta `./data/postgres` estaba en estado may-4 y ahora quedó al día con el código.

## 🚧 Feature en curso: Costo real por lote + ganancia + pago multi-método
Plan: `~/.claude/plans/smooth-shimmying-breeze.md`. **Implementado y verificado** (tsc + `next build` + e2e a nivel de datos en shadow):
- **Schema + migración** con backfill (Product.serialized; PurchaseLot+ChargeMode; Equipment como unidad serializada con landedCost/availability/lot/saleItem; SaleItem.unitCostSnapshot/costTotal+unit; Payment.saleId + PaymentSplit).
- **Compras/Lotes** (`/compras`): API `api/compras` + form que resuelve flete/impuesto (fijo o %, % sobre base), calcula costo landed, crea unidades serializadas y cachea `Product.costPrice`. Nav nuevo "Compras / Lotes".
- **Editor de splits compartido** (`components/payments/payment-splits-editor.tsx`) + libs `lib/payments/{methods,splits,rate}.ts`. Métodos en Bs (Pago Móvil) piden monto Bs + tasa (snapshot).
- **Venta** (`api/ventas` + `new-sale-form`): selección de unidad por serial, COGS real, marca unidad VENDIDO, crea Payment+splits, muestra ganancia. DELETE libera la unidad.
- **Cobros** y **Pagos manual** usan el editor de splits. Detalle de pago muestra desglose + ganancia de la venta.
- **Métricas** (`lib/metrics`, `lib/marketing/metrics`) usan COGS real (snapshot/landed); valuación de inventario serializado por unidades. Contrato móvil `amount/starlinkCost/priceLocked` intacto.
- Flag `serialized` editable en alta/edición de producto.

### Próximo en este feature (follow-ups)
- [ ] Aplicar la migración a la DB real (ver pendiente operativo).
- [ ] Probar en navegador con el dev server (login admin → registrar lote → vender unidad con pago dividido → ver ganancia).
- [ ] (Opcional) Convertir `PlanRequest` (solicitud-activación) en Payment al procesarla — última pieza de consolidación, no hecha aún.
- [ ] (Opcional) `byMethod` en `metrics.ts` agrupa por `Payment.method`; con multi-método conviene `groupBy(PaymentSplit.method)`.

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
- [ ] (pendiente de definir — anotar aquí la próxima tarea al retomar)

## Notas / decisiones abiertas
- (vacío)

## Cómo arrancar
```bash
cd "claude starlink/claude starlink"   # el repo está anidado
npm install
docker compose up -d                   # Postgres local
npm run db:migrate && npm run db:seed
npm run dev                            # http://localhost:3000
npm run jobs                          # (opcional) cron en background
```
