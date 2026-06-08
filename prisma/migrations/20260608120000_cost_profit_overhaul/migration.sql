-- =====================================================================
-- Cost/Profit overhaul: costo real por lote, unidades serializadas,
-- pago multi-método (splits) con Bs+tasa.
-- Todas las columnas nuevas son nullable o con default → sin pérdida de datos.
-- Al final se hace backfill de filas existentes.
-- =====================================================================

-- CreateEnum
CREATE TYPE "ChargeMode" AS ENUM ('FIXED', 'PERCENT');

-- CreateEnum
CREATE TYPE "UnitAvailability" AS ENUM ('DISPONIBLE', 'RESERVADO', 'VENDIDO', 'DEVUELTO', 'BAJA');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "serialized" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "saleId" TEXT;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "costTotal" DECIMAL(12,2),
ADD COLUMN     "unitCostSnapshot" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "availability" "UnitAvailability" NOT NULL DEFAULT 'DISPONIBLE',
ADD COLUMN     "landedCost" DECIMAL(12,2),
ADD COLUMN     "lotId" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "saleItemId" TEXT;

-- CreateTable
CREATE TABLE "PurchaseLot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "reference" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL,
    "baseUnitCost" DECIMAL(12,2) NOT NULL,
    "baseTotal" DECIMAL(12,2) NOT NULL,
    "freightApplies" BOOLEAN NOT NULL DEFAULT false,
    "freightMode" "ChargeMode",
    "freightValue" DECIMAL(12,2),
    "freightTotalUSD" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxApplies" BOOLEAN NOT NULL DEFAULT false,
    "taxMode" "ChargeMode",
    "taxValue" DECIMAL(12,2),
    "taxTotalUSD" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "landedTotal" DECIMAL(12,2) NOT NULL,
    "landedUnitCost" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "movementId" TEXT,

    CONSTRAINT "PurchaseLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSplit" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amountUSD" DECIMAL(12,2) NOT NULL,
    "amountVes" DECIMAL(14,2),
    "vesRate" DECIMAL(14,4),
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseLot_movementId_key" ON "PurchaseLot"("movementId");

-- CreateIndex
CREATE INDEX "PurchaseLot_productId_purchasedAt_idx" ON "PurchaseLot"("productId", "purchasedAt");

-- CreateIndex
CREATE INDEX "PaymentSplit_paymentId_idx" ON "PaymentSplit"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentSplit_method_idx" ON "PaymentSplit"("method");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_saleId_key" ON "Payment"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_saleItemId_key" ON "Equipment"("saleItemId");

-- CreateIndex
CREATE INDEX "Equipment_productId_availability_idx" ON "Equipment"("productId", "availability");

-- AddForeignKey
ALTER TABLE "PurchaseLot" ADD CONSTRAINT "PurchaseLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseLot" ADD CONSTRAINT "PurchaseLot_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "InventoryMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSplit" ADD CONSTRAINT "PaymentSplit_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "PurchaseLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- BACKFILL de filas existentes (idempotente)
-- =====================================================================

-- Equipment: las unidades ya asignadas a un cliente se consideran VENDIDAS;
-- el costo legacy (purchasePrice) pasa a ser el landedCost de la unidad.
UPDATE "Equipment" SET "availability" = 'VENDIDO' WHERE "clientId" IS NOT NULL;
UPDATE "Equipment" SET "landedCost" = "purchasePrice" WHERE "purchasePrice" IS NOT NULL AND "landedCost" IS NULL;

-- SaleItem: snapshot del costo histórico usando el costPrice actual del producto
-- (mejor proxy disponible para ventas anteriores a este cambio).
UPDATE "SaleItem" si
SET "unitCostSnapshot" = p."costPrice",
    "costTotal" = p."costPrice" * si."quantity"
FROM "Product" p
WHERE si."productId" = p."id" AND si."unitCostSnapshot" IS NULL;

-- Payment: cada pago existente obtiene un split equivalente (método+monto),
-- de modo que los splits son el modelo de lectura uniforme hacia adelante.
INSERT INTO "PaymentSplit" ("id", "paymentId", "method", "amountUSD", "reference", "createdAt")
SELECT 'ps_' || replace(gen_random_uuid()::text, '-', ''),
       pay."id", pay."method", pay."amount", pay."reference", pay."createdAt"
FROM "Payment" pay
WHERE NOT EXISTS (SELECT 1 FROM "PaymentSplit" ps WHERE ps."paymentId" = pay."id");
