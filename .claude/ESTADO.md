# ESTADO DEL PROYECTO — Starlink Venezuela

> Documento de continuidad. Se actualiza al terminar cada tarea para no perder el foco.
> Última actualización: **2026-06-09**

## Snapshot actual
- **Rama:** `main` (todo fusionado y **desplegado en producción**). Último commit: `84ed558`.
- **Producción:** https://starlink2.vercel.app (Vercel, proyecto `starlink2`, DB Neon). Deploy automático al pushear `main`.
- **Push a GitHub:** YA NO pide token — quedó en el git credential store (`~/.git-credentials` 600 + `credential.helper store`). `git push origin main` funciona solo. Ver [[starlink-ve-deploy]].

## 🔜 PRÓXIMO AL RETOMAR (pendiente abierto)
- **Corregir datos de planes invertidos en Neon (producción).** El usuario cargó los planes al revés: su costo en "Precio" y la venta en "Costo". Los rótulos del form ya se aclararon (commit `04ed685`), pero la DATA existente sigue invertida. Opciones: (a) el usuario intercambia los valores desde `/planes`; (b) yo lo corrijo por SQL en Neon (intercambiar `price`↔`cost`) — necesita `DATABASE_URL` de Neon (no disponible localmente). ⚠️ Por el modelo de **snapshots**, corregir el plan NO recalcula suscripciones activas (usan `priceLocked`) ni pagos/ventas ya registrados; solo afecta nuevas asignaciones. Si se quiere aplicar a suscripciones activas, actualizar su `priceLocked` aparte.

## ✅ Sesión 2026-06-08/09 — completado y desplegado (cobros/dashboard/equipos/planes)
- **Cobros — filtro por fecha de activación** (commit `84ed558`): la lista solo muestra suscripciones cuya `startDate <= fin del mes navegado`. Ya no aparecen clientes en meses anteriores a la activación de su plan. `src/app/(admin)/cobros/page.tsx` (`where: { status: "ACTIVA", startDate: { lte: periodoFin } }`).

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
  - **DESPLEGADO ✓** (2026-06-08): commit `72a728d` pusheado a `main` (`331bc88..72a728d`) → Vercel auto-construye. Producción HTTP 200.
  - **Push sin fricción a futuro:** el token GitHub quedó en el git credential store (`~/.git-credentials` 600 + `credential.helper store`); `git push origin main` ya no pide token. Ver [[starlink-ve-deploy]].

## 🆕 Sesión 2026-06-08 (cont.) — Ocultar secciones en ficha de cliente
- En `/clientes/[id]` se **ocultaron de pantalla** las secciones **"Tickets de soporte"** y **"Notas e historial CRM"**.
  - `src/app/(admin)/clientes/[id]/page.tsx`: flags `SHOW_TICKETS_SECTION` y `SHOW_CRM_SECTION` (ambos `false`) envuelven cada `<Card>`. Para reactivar, poner el flag en `true` (la lógica/queries siguen intactas).
  - Verificado `tsc` ✓ + `next build` ✓. **DESPLEGADO ✓**: commit `ecb421c` (`72a728d..ecb421c`) pusheado a `main` (push ya sin pedir token, credential store OK).

## 🆕 Sesión 2026-06-08 (cont.) — Dashboard: atribución mensual por fecha real
- **Problema:** el dashboard sumaba en el mes en curso pagos/ventas de otros meses cargados ahora (usaba `Payment.confirmedAt` y `Sale.createdAt` = fecha de registro).
- **Fix (decisión del usuario: "período que cubre / fecha de venta"):**
  - Pagos (`src/lib/metrics.ts`): atribución por **`periodStart ?? paidAt ?? confirmedAt`**. Afecta facturación mes/año/30d/prev30, ganancia bruta mes y serie mensual 12m. Se eliminaron los 4 `aggregate` por `confirmedAt` y se calcula en JS sobre `confirmedPayments12m` (query ampliada con `periodStart`/`paidAt` y `OR` de fechas).
  - Ventas (`src/app/(admin)/dashboard/page.tsx`): "Ventas mes" por **`paidAt ?? createdAt`** (findMany + reduce en vez de aggregate por createdAt).
  - `tsc` ✓ + `next build` ✓. **DESPLEGADO ✓** commit `a487360`.
  - Nota: el form de venta ya acepta fechas pasadas (occurredAt→createdAt/paidAt); cobros fija `periodStart` según el mes navegado. Para que lo histórico caiga en su mes, registrar con la fecha real.

## ✅ Feature cobros: mes de compra + primer mes gratis (DESPLEGADO, commit `cac2a33`)
- `Subscription.firstMonthFree` + migración `20260608140000_subscription_first_month_free` (local 5435 ✓; Neon se aplica en el deploy). Checkbox "Primer mes gratis" en `assign-plan.tsx` → API `api/clientes/[id]/subscripciones`.
- Cobros (`page.tsx`/`workspace.tsx`): columna **"Mes compra"** (=`startDate`), orden por fecha de compra; el primer mes (mes de `startDate`) muestra **"MES GRATIS"** ($0) automático, no pide cobro ni cuenta como "sin pago". Decisiones del usuario aplicadas: listado = columna+orden; fecha base = `startDate`; mes gratis = solo check al activar.

## ✅ Planes: rótulos aclarados (DESPLEGADO, commit `04ed685`)
- Form de plan (`planes/[id]/edit-form.tsx` y `planes/nuevo`): ahora **"Precio de venta (USD)" = lo que cobras al cliente** y **"Costo (USD)" = lo que te cuesta (a Starlink)**, con texto de ayuda. Evita invertir los campos.
- ⚠️ PENDIENTE (data en producción): el usuario tenía los valores invertidos en Neon. Para corregir: intercambiar `price`↔`cost` en los planes afectados y decidir si actualizar `priceLocked` de suscripciones activas. **Recordar el modelo de snapshots:** cambiar el plan NO recalcula suscripciones (usan `priceLocked`) ni pagos/ventas ya registrados (guardan su monto); solo afecta nuevas asignaciones. Requiere acceso a Neon o que lo haga el usuario.

## ✅ Decisión: se trabaja TODO sobre PRODUCCIÓN (Neon)
- El usuario confirmó (2026-06-08) que la data operativa real vive en **Neon producción**, NO en la DB local 5435 (esa es demo may-4: 5 clientes ficticios — Carlos R., Ana **Pérez**, Luis M., Patricia H., Ricardo L. — y 0 equipos).
- Para operar directamente sobre Neon haría falta su `DATABASE_URL` (no hay `vercel` CLI ni `.env.production.local` aquí). De momento no se necesita: el flujo de trabajo es **editar código → push a `main` → Vercel despliega**.
- ~~Tarea KIT4M01116507RDD → Ana Covadonga~~: **descartada por el usuario (no continuar).**

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
