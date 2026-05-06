-- DropIndex
DROP INDEX IF EXISTS "Client_documentId_key";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN IF EXISTS "documentId";
