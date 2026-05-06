import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { sendFromTemplate } from "@/lib/notifications";

const CODE_TTL_MS = 5 * 60 * 1000;

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function createAndSendCode(userId: string, telegramChatId: string): Promise<void> {
  const now = new Date();
  await prisma.twoFactorCode.deleteMany({
    where: {
      userId,
      OR: [{ expiresAt: { lt: now } }, { consumedAt: { not: null } }],
    },
  });

  const code = generateCode();
  await prisma.twoFactorCode.create({
    data: {
      userId,
      codeHash: hashCode(code),
      expiresAt: new Date(now.getTime() + CODE_TTL_MS),
    },
  });

  await sendFromTemplate({
    templateCode: "ADMIN_2FA_CODE",
    recipient: telegramChatId,
    channelOverride: "TELEGRAM",
    vars: { code },
    relatedType: "User",
    relatedId: userId,
  });
}

export async function consumeCode(userId: string, code: string): Promise<boolean> {
  const hash = hashCode(code);
  const now = new Date();
  const record = await prisma.twoFactorCode.findFirst({
    where: {
      userId,
      codeHash: hash,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return false;

  await prisma.twoFactorCode.update({
    where: { id: record.id },
    data: { consumedAt: now },
  });
  return true;
}
