import { PrismaClient, RoleName, NotificationChannelType } from "@prisma/client";
import bcrypt from "bcryptjs";

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

  // Plantillas base
  const templates = [
    {
      code: "NEW_USER_PASSWORD",
      name: "Credenciales de acceso para nuevo usuario",
      subject: "Tus credenciales de acceso — Starlink Venezuela",
      body: "Hola {{name}}, tu cuenta ha sido creada. Email: {{email}}. Contraseña temporal: {{password}}. Debes cambiarla al iniciar sesión. URL: {{loginUrl}}",
      channelType: "EMAIL" as NotificationChannelType,
    },
    {
      code: "PAYMENT_REMINDER",
      name: "Recordatorio de cobro mensual",
      subject: "Recordatorio de pago — Starlink Venezuela",
      body: "Hola {{clientName}}, te recordamos tu pago del plan {{planName}} por {{amount}} USD con fecha de corte {{dueDate}}. Reporta tu pago en {{portalUrl}}.",
      channelType: "WHATSAPP" as NotificationChannelType,
    },
    {
      code: "PAYMENT_CONFIRMED",
      name: "Pago confirmado",
      subject: "Pago confirmado — Starlink Venezuela",
      body: "Hola {{clientName}}, tu pago de {{amount}} USD fue confirmado. Gracias.",
      channelType: "WHATSAPP" as NotificationChannelType,
    },
    {
      code: "STOCK_DEFICIT",
      name: "Alerta de déficit de inventario",
      subject: "Alerta: stock proyectado bajo",
      body: "Producto {{productName}} (SKU {{sku}}): stock actual {{currentStock}}, proyección en {{days}} días = {{projectedStock}}. Mínimo {{minStock}}.",
      channelType: "EMAIL" as NotificationChannelType,
    },
    {
      code: "WARRANTY_EXPIRING",
      name: "Garantía por vencer",
      subject: "Tu garantía vence pronto",
      body: "Hola {{clientName}}, tu garantía del producto {{productName}} vence el {{endsAt}}.",
      channelType: "EMAIL" as NotificationChannelType,
    },
  ];
  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { code: t.code },
      update: { name: t.name, subject: t.subject, body: t.body, channelType: t.channelType },
      create: t,
    });
  }
  console.log("✓ Plantillas de notificación creadas");

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
