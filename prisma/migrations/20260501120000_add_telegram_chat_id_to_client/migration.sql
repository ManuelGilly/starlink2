-- AlterTable
ALTER TABLE "Client" ADD COLUMN "telegramChatId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_telegramChatId_key" ON "Client"("telegramChatId");
