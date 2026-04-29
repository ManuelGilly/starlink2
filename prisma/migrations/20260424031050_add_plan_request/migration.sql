-- CreateEnum
CREATE TYPE "PlanRequestStatus" AS ENUM ('PENDIENTE', 'PROCESADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "PlanRequest" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "antennaId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentReference" TEXT,
    "receiptUrl" TEXT NOT NULL,
    "notes" TEXT,
    "status" "PlanRequestStatus" NOT NULL DEFAULT 'PENDIENTE',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanRequest_status_createdAt_idx" ON "PlanRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PlanRequest_email_idx" ON "PlanRequest"("email");

-- CreateIndex
CREATE INDEX "PlanRequest_antennaId_idx" ON "PlanRequest"("antennaId");

-- CreateIndex
CREATE INDEX "PlanRequest_planId_idx" ON "PlanRequest"("planId");

-- AddForeignKey
ALTER TABLE "PlanRequest" ADD CONSTRAINT "PlanRequest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
