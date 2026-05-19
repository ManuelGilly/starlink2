-- CreateEnum
CREATE TYPE "EquipmentCondition" AS ENUM ('NUEVO', 'USADO', 'DANADO', 'DADO_DE_BAJA');
CREATE TYPE "TicketStatus" AS ENUM ('ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO');
CREATE TYPE "TicketType" AS ENUM ('TECNICO', 'FACTURACION', 'CONSULTA', 'OTRO');
CREATE TYPE "TicketPriority" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateTable Equipment
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT,
    "model" TEXT NOT NULL,
    "condition" "EquipmentCondition" NOT NULL DEFAULT 'NUEVO',
    "clientId" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(12,2),
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Equipment_serialNumber_key" ON "Equipment"("serialNumber");
CREATE INDEX "Equipment_clientId_idx" ON "Equipment"("clientId");
CREATE INDEX "Equipment_serialNumber_idx" ON "Equipment"("serialNumber");
CREATE INDEX "Equipment_condition_idx" ON "Equipment"("condition");

ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable SupportTicket
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "TicketType" NOT NULL DEFAULT 'TECNICO',
    "status" "TicketStatus" NOT NULL DEFAULT 'ABIERTO',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIA',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportTicket_clientId_status_idx" ON "SupportTicket"("clientId", "status");
CREATE INDEX "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority");
CREATE INDEX "SupportTicket_assignedTo_idx" ON "SupportTicket"("assignedTo");

ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ClientNote
CREATE TABLE "ClientNote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientNote_clientId_createdAt_idx" ON "ClientNote"("clientId", "createdAt");

ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
