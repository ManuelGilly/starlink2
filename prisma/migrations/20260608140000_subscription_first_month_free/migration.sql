-- Beneficio "primer mes gratis" en suscripciones.
-- Columna con default → sin pérdida de datos ni backfill necesario.

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "firstMonthFree" BOOLEAN NOT NULL DEFAULT false;
