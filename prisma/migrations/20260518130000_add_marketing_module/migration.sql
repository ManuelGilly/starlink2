-- CreateEnum
CREATE TYPE "SaleOrigin" AS ENUM ('ORGANICO', 'INSTAGRAM_ADS', 'RECOMENDADO');
CREATE TYPE "CampaignStatus" AS ENUM ('BORRADOR', 'ACTIVA', 'PAUSADA', 'FINALIZADA');

-- CreateTable AdCampaign
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(12,2) NOT NULL,
    "messagesReceived" INTEGER NOT NULL DEFAULT 0,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVA',
    "platform" TEXT NOT NULL DEFAULT 'Instagram',
    "adUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdCampaign_startDate_endDate_idx" ON "AdCampaign"("startDate", "endDate");
CREATE INDEX "AdCampaign_status_idx" ON "AdCampaign"("status");

-- AlterTable Sale: add origin + campaignId
ALTER TABLE "Sale" ADD COLUMN "origin" "SaleOrigin" NOT NULL DEFAULT 'ORGANICO';
ALTER TABLE "Sale" ADD COLUMN "campaignId" TEXT;

ALTER TABLE "Sale" ADD CONSTRAINT "Sale_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Sale_campaignId_idx" ON "Sale"("campaignId");

-- AlterTable Subscription: add origin + campaignId
ALTER TABLE "Subscription" ADD COLUMN "origin" "SaleOrigin" NOT NULL DEFAULT 'ORGANICO';
ALTER TABLE "Subscription" ADD COLUMN "campaignId" TEXT;

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Subscription_campaignId_idx" ON "Subscription"("campaignId");
