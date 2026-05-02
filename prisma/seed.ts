import { PrismaClient, RoleName, NotificationChannelType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { notificationTemplates } from "../src/lib/notifications/seed-templates";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed iniciando…");

  // Roles
  const roles: { name: RoleName; description: string }[] = [
    { name: "ADMIN", description: "Administración total del sistema" },
    { name: "INVENTARIO", description: "Gestión de productos, planes e inventario" },
    { name: "CLIENTE", description: "Cliente final: ve sus pagos, productos y garantías" },
  ];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
  }
  console.log("✓ Roles listos");

  // Admin inicial
  const email = process.env.SEED_ADMIN_EMAIL || "admin@starlink.ve";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const name = process.env.SEED_ADMIN_NAME || "Administrador Starlink";
  const passwordHash = await bcrypt.hash(password, 10);

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "ADMIN" } });
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash,
      mustChangePassword: true,
      active: true,
      roles: { create: { roleId: adminRole.id } },
    },
  });
  console.log(`✓ Admin: ${admin.email}`);

  // Canales de notificación (deshabilitados hasta que se configuren creds)
  const channels: NotificationChannelType[] = [
    "WHATSAPP",
    "TELEGRAM",
    "INSTAGRAM",
    "EMAIL",
    "SMS",
  ];
  for (const c of channels) {
    await prisma.notificationChannel.upsert({
      where: { type: c },
      update: {},
      create: { type: c, enabled: false },
    });
  }
  console.log("✓ Canales de notificación creados (deshabilitados)");

  // Plantillas base (lista compartida en src/lib/notifications/seed-templates.ts)
  for (const t of notificationTemplates) {
    await prisma.notificationTemplate.upsert({
      where: { code: t.code },
      update: { name: t.name, subject: t.subject, body: t.body, channelType: t.channelType },
      create: t,
    });
  }
  console.log(`✓ Plantillas de notificación creadas (${notificationTemplates.length})`);

  // Categoría de producto ejemplo
  await prisma.productCategory.upsert({
    where: { name: "Kit Starlink" },
    update: {},
    create: { name: "Kit Starlink", description: "Equipos y accesorios Starlink" },
  });
  await prisma.productCategory.upsert({
    where: { name: "Accesorios" },
    update: {},
    create: { name: "Accesorios", description: "Cables, soportes, routers, etc." },
  });
  console.log("✓ Categorías de ejemplo creadas");

  console.log("✅ Seed completado");
}

main()
  .catch((e) => {
    console.error("❌ Seed falló:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
