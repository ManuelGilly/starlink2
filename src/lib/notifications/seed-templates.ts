import type { NotificationChannelType } from "@prisma/client";

export type TemplateSeed = {
  code: string;
  name: string;
  subject: string | null;
  body: string;
  channelType: NotificationChannelType;
};

export const notificationTemplates: TemplateSeed[] = [
  {
    code: "NEW_USER_PASSWORD",
    name: "Credenciales de acceso para nuevo usuario",
    subject: "Tus credenciales de acceso — Starlink Venezuela",
    body: "Hola {{name}}, tu cuenta ha sido creada. Email: {{email}}. Contraseña temporal: {{password}}. Debes cambiarla al iniciar sesión. URL: {{loginUrl}}",
    channelType: "EMAIL",
  },
  {
    code: "PAYMENT_REMINDER",
    name: "Recordatorio de cobro mensual",
    subject: "Recordatorio de pago — Starlink Venezuela",
    body: "Hola {{clientName}}, te recordamos tu pago del plan {{planName}} por {{amount}} USD con fecha de corte {{dueDate}}. Reporta tu pago en {{portalUrl}}.",
    channelType: "WHATSAPP",
  },
  {
    code: "PAYMENT_CONFIRMED",
    name: "Pago confirmado",
    subject: "Pago confirmado — Starlink Venezuela",
    body: "Hola {{clientName}}, tu pago de {{amount}} USD fue confirmado. Gracias.",
    channelType: "WHATSAPP",
  },
  {
    code: "STOCK_DEFICIT",
    name: "Alerta de déficit de inventario",
    subject: "Alerta: stock proyectado bajo",
    body: "Producto {{productName}} (SKU {{sku}}): stock actual {{currentStock}}, proyección en {{days}} días = {{projectedStock}}. Mínimo {{minStock}}.",
    channelType: "EMAIL",
  },
  {
    code: "WARRANTY_EXPIRING",
    name: "Garantía por vencer",
    subject: "Tu garantía vence pronto",
    body: "Hola {{clientName}}, tu garantía del producto {{productName}} vence el {{endsAt}}.",
    channelType: "EMAIL",
  },
  {
    code: "WELCOME_CLIENT",
    name: "Bienvenida a cliente nuevo (Telegram)",
    subject: null,
    body: "Hola {{firstName}}, bienvenido a Starlink Venezuela.\n\nAcabamos de registrarte en nuestro sistema. A partir de ahora vas a recibir aquí las notificaciones sobre tus compras, pagos y garantías.\n\nCualquier consulta, escribinos por este mismo medio.",
    channelType: "TELEGRAM",
  },
  {
    code: "SALE_REGISTERED_CLIENT",
    name: "Confirmación de compra al cliente (Telegram)",
    subject: null,
    body: "Hola {{firstName}}, registramos tu compra:\n\n{{itemsList}}\n\nTotal: {{total}} USD\nFecha: {{date}}\n\nGracias por elegirnos.",
    channelType: "TELEGRAM",
  },
  {
    code: "SALE_REGISTERED_ADMIN",
    name: "Aviso interno de venta registrada (Telegram admin)",
    subject: null,
    body: "Nueva venta registrada\nCliente: {{clientName}}\nTotal: {{total}} USD\nProductos: {{itemsList}}\nFecha: {{date}}",
    channelType: "TELEGRAM",
  },
  {
    code: "PLAN_ASSIGNED_CLIENT",
    name: "Confirmación de plan asignado al cliente (Telegram)",
    subject: null,
    body: "Hola {{firstName}}, tu plan {{planName}} fue activado.\n\nPrecio mensual: {{amount}} USD\nDía de cobro: {{billingDay}} de cada mes\n\nA partir del próximo corte recibirás recordatorios de pago.",
    channelType: "TELEGRAM",
  },
  {
    code: "PLAN_ASSIGNED_ADMIN",
    name: "Aviso interno de plan asignado (Telegram admin)",
    subject: null,
    body: "Nueva suscripción activada\nCliente: {{clientName}}\nPlan: {{planName}}\nPrecio: {{amount}} USD\nDía de corte: {{billingDay}}",
    channelType: "TELEGRAM",
  },
];
