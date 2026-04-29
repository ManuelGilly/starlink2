import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🎭 Cargando datos de prueba…");

  const [kitCat, accCat] = await Promise.all([
    prisma.productCategory.upsert({
      where: { name: "Kit Starlink" },
      update: {},
      create: { name: "Kit Starlink", description: "Equipos y accesorios Starlink" },
    }),
    prisma.productCategory.upsert({
      where: { name: "Accesorios" },
      update: {},
      create: { name: "Accesorios", description: "Cables, soportes, routers, etc." },
    }),
  ]);

  // Productos
  const products = [
    { sku: "SL-STD-GEN3", name: "Kit Starlink Standard (Gen 3)", features: "Antena gen 3, router WiFi 6, cable 15m, base", categoryId: kitCat.id, costPrice: 349, salePrice: 499, minStock: 5, warrantyDays: 365 },
    { sku: "SL-MINI",     name: "Kit Starlink Mini",              features: "Antena portable, WiFi integrado, cable 15m",      categoryId: kitCat.id, costPrice: 399, salePrice: 549, minStock: 3, warrantyDays: 365 },
    { sku: "SL-ROUTER-MESH", name: "Router Mesh Starlink",        features: "Extensor de red WiFi 6 mesh",                     categoryId: accCat.id, costPrice: 120, salePrice: 189, minStock: 4, warrantyDays: 180 },
    { sku: "SL-CABLE-30M",   name: "Cable Ethernet SPX 30m",      features: "Cable blindado exterior 30 metros",               categoryId: accCat.id, costPrice: 45,  salePrice: 79,  minStock: 8, warrantyDays: 90 },
    { sku: "SL-MAST-VOL",    name: "Mástil de volantín",          features: "Montaje techo con mástil 2m",                     categoryId: accCat.id, costPrice: 35,  salePrice: 69,  minStock: 5, warrantyDays: 30 },
  ];
  const productRows = [] as any[];
  for (const p of products) {
    const row = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    productRows.push(row);
  }
  console.log(`✓ ${productRows.length} productos`);

  // Movimientos de inventario — ENTRADAS iniciales y SALIDAS simuladas
  const now = new Date();
  const daysAgo = (d: number) => {
    const x = new Date(now);
    x.setDate(x.getDate() - d);
    return x;
  };

  // Solo añadir movimientos si no hay ninguno aún para el producto
  for (const p of productRows) {
    const existing = await prisma.inventoryMovement.count({ where: { productId: p.id } });
    if (existing > 0) continue;
    // ENTRADA grande
    await prisma.inventoryMovement.create({
      data: { productId: p.id, type: "ENTRADA", quantity: 20, unitCost: p.costPrice, reference: "COMPRA-INICIAL", occurredAt: daysAgo(45) },
    });
    // Salidas escalonadas
    await prisma.inventoryMovement.createMany({
      data: [
        { productId: p.id, type: "SALIDA", quantity: 2, occurredAt: daysAgo(28) },
        { productId: p.id, type: "SALIDA", quantity: 3, occurredAt: daysAgo(20) },
        { productId: p.id, type: "SALIDA", quantity: 2, occurredAt: daysAgo(12) },
        { productId: p.id, type: "SALIDA", quantity: 4, occurredAt: daysAgo(5) },
      ],
    });
    // Una merma pequeña para algún producto
    if (p.sku === "SL-CABLE-30M") {
      await prisma.inventoryMovement.create({
        data: { productId: p.id, type: "MERMA", quantity: 1, notes: "Daño en traslado", occurredAt: daysAgo(10) },
      });
    }
  }
  console.log("✓ Movimientos de inventario (entradas + salidas simuladas)");

  // Planes Starlink
  const plans = [
    { code: "RESIDENCIAL",     name: "Residencial Venezuela",      price: 99,  cost: 45, billingCycle: "MONTHLY" as const, description: "Internet residencial ilimitado",            details: "Velocidad 50-250 Mbps. Uso en domicilio registrado. Datos ilimitados." },
    { code: "ROAM-50GB",       name: "Roam 50 GB",                 price: 50,  cost: 22, billingCycle: "MONTHLY" as const, description: "Plan móvil con 50 GB",                      details: "Uso en cualquier ubicación. 50 GB/mes, adicional a velocidad reducida." },
    { code: "ROAM-UNLIMITED",  name: "Roam Ilimitado",             price: 165, cost: 75, billingCycle: "MONTHLY" as const, description: "Plan móvil ilimitado",                      details: "Uso en cualquier ubicación sin límite de datos. Prioridad media." },
    { code: "BUSINESS",        name: "Business 1 TB",              price: 250, cost: 110, billingCycle: "MONTHLY" as const, description: "Plan empresarial",                         details: "1 TB de datos prioritarios + ilimitados a velocidad estándar. IP dedicada opcional." },
  ];
  const planRows = [] as any[];
  for (const pl of plans) {
    const row = await prisma.plan.upsert({
      where: { code: pl.code },
      update: {},
      create: pl,
    });
    planRows.push(row);
  }
  console.log(`✓ ${planRows.length} planes Starlink`);

  // Clientes
  const clientsData = [
    { firstName: "María",   lastName: "González",   documentId: "V-12345678", email: "maria.gonzalez@demo.ve",   phone: "+584141234567", address: "Caracas, Av. Francisco de Miranda, Edif. X" },
    { firstName: "Carlos",  lastName: "Rodríguez",  documentId: "V-23456789", email: "carlos.rodriguez@demo.ve", phone: "+584242345678", address: "Valencia, Urb. La Viña" },
    { firstName: "Ana",     lastName: "Pérez",      documentId: "V-34567890", email: "ana.perez@demo.ve",        phone: "+584143456789", address: "Maracaibo, Av. 4 Bella Vista" },
    { firstName: "Luis",    lastName: "Martínez",   documentId: "V-45678901", email: "luis.martinez@demo.ve",    phone: "+584164567890", address: "Mérida, Urb. Santa María Norte" },
    { firstName: "Patricia", lastName: "Hernández", documentId: "V-56789012", email: "patricia.h@demo.ve",       phone: "+584125678901", address: "Barquisimeto, Zona Este" },
    { firstName: "Ricardo", lastName: "López",      documentId: "J-30123456-7", email: "ricardo@empresa.demo.ve", phone: "+584246789012", address: "Caracas, Centro Empresarial" },
  ];
  const clientRows = [] as any[];
  for (const c of clientsData) {
    const row = await prisma.client.upsert({
      where: { documentId: c.documentId },
      update: {},
      create: c,
    });
    clientRows.push(row);
  }
  console.log(`✓ ${clientRows.length} clientes`);

  // Suscripciones
  const subsPlan: Array<[number, string, number, number]> = [
    [0, "RESIDENCIAL",    99,  5],
    [1, "RESIDENCIAL",    99,  10],
    [2, "ROAM-50GB",      50,  15],
    [3, "ROAM-UNLIMITED", 165, 1],
    [4, "RESIDENCIAL",    99,  20],
    [5, "BUSINESS",       250, 28],
  ];
  const subRows = [] as any[];
  for (const [idx, code, price, day] of subsPlan) {
    const client = clientRows[idx];
    const plan = planRows.find((p) => p.code === code);
    if (!client || !plan) continue;
    const existing = await prisma.subscription.findFirst({ where: { clientId: client.id, planId: plan.id } });
    if (existing) { subRows.push(existing); continue; }
    const sub = await prisma.subscription.create({
      data: {
        clientId: client.id,
        planId: plan.id,
        priceLocked: price,
        billingDay: day,
        startDate: daysAgo(90),
      },
    });
    subRows.push(sub);
  }
  console.log(`✓ ${subRows.length} suscripciones`);

  // Pagos — mezcla de confirmados, reportados, pendientes y uno rechazado
  const paymentsSpec = [
    { subIdx: 0, amount: 99,  status: "CONFIRMADO", daysAgo: 60, method: "ZELLE" },
    { subIdx: 0, amount: 99,  status: "CONFIRMADO", daysAgo: 30, method: "ZELLE" },
    { subIdx: 0, amount: 99,  status: "CONFIRMADO", daysAgo: 1,  method: "ZELLE" },
    { subIdx: 1, amount: 99,  status: "CONFIRMADO", daysAgo: 59, method: "BINANCE" },
    { subIdx: 1, amount: 99,  status: "REPORTADO",  daysAgo: 2,  method: "BINANCE" },
    { subIdx: 2, amount: 50,  status: "CONFIRMADO", daysAgo: 55, method: "PAYPAL" },
    { subIdx: 2, amount: 50,  status: "CONFIRMADO", daysAgo: 25, method: "PAYPAL" },
    { subIdx: 3, amount: 165, status: "CONFIRMADO", daysAgo: 45, method: "TRANSFERENCIA_USD" },
    { subIdx: 3, amount: 165, status: "PENDIENTE",  daysAgo: 0,  method: "TRANSFERENCIA_USD" },
    { subIdx: 4, amount: 99,  status: "CONFIRMADO", daysAgo: 40, method: "EFECTIVO_USD" },
    { subIdx: 4, amount: 99,  status: "RECHAZADO",  daysAgo: 8,  method: "EFECTIVO_USD" },
    { subIdx: 5, amount: 250, status: "CONFIRMADO", daysAgo: 20, method: "ZELLE" },
    { subIdx: 5, amount: 250, status: "REPORTADO",  daysAgo: 3,  method: "ZELLE" },
  ];
  let paymentCount = 0;
  for (const p of paymentsSpec) {
    const sub = subRows[p.subIdx];
    if (!sub) continue;
    const exists = await prisma.payment.findFirst({
      where: { subscriptionId: sub.id, amount: p.amount, createdAt: { gte: daysAgo(p.daysAgo + 1), lte: daysAgo(p.daysAgo - 1 < 0 ? 0 : p.daysAgo - 1) } },
    });
    if (exists) continue;
    await prisma.payment.create({
      data: {
        clientId: sub.clientId,
        subscriptionId: sub.id,
        amount: p.amount,
        method: p.method as any,
        status: p.status as any,
        reference: p.method === "BINANCE" ? "0x" + Math.random().toString(16).slice(2, 14) : "REF-" + Math.floor(Math.random() * 100000),
        paidAt: daysAgo(p.daysAgo),
        confirmedAt: p.status === "CONFIRMADO" ? daysAgo(p.daysAgo) : null,
        createdAt: daysAgo(p.daysAgo),
      },
    });
    paymentCount++;
  }
  console.log(`✓ ${paymentCount} pagos`);

  // Garantías — asociadas a clientes con kits
  const warrantySpec = [
    { clientIdx: 0, sku: "SL-STD-GEN3", serial: "SL-STD-0001", daysAgo: 60 },
    { clientIdx: 1, sku: "SL-STD-GEN3", serial: "SL-STD-0002", daysAgo: 55 },
    { clientIdx: 2, sku: "SL-MINI",     serial: "SL-MINI-0001", daysAgo: 30 },
    { clientIdx: 3, sku: "SL-MINI",     serial: "SL-MINI-0002", daysAgo: 15 },
    { clientIdx: 5, sku: "SL-STD-GEN3", serial: "SL-STD-0003", daysAgo: 90 },
  ];
  let warCount = 0;
  for (const w of warrantySpec) {
    const client = clientRows[w.clientIdx];
    const product = productRows.find((p) => p.sku === w.sku);
    if (!client || !product) continue;
    const exists = await prisma.warranty.findFirst({ where: { clientId: client.id, productId: product.id, serialNumber: w.serial } });
    if (exists) continue;
    const starts = daysAgo(w.daysAgo);
    const ends = new Date(starts);
    ends.setDate(ends.getDate() + product.warrantyDays);
    await prisma.warranty.create({
      data: {
        clientId: client.id,
        productId: product.id,
        serialNumber: w.serial,
        startsAt: starts,
        endsAt: ends,
        status: ends < now ? "VENCIDA" : "VIGENTE",
      },
    });
    warCount++;
  }
  console.log(`✓ ${warCount} garantías`);

  // Vincular un cliente a un usuario CLIENTE para probar el dashboard de cliente
  const demoClient = clientRows[0];
  const clienteRole = await prisma.role.findUniqueOrThrow({ where: { name: "CLIENTE" } });
  const existingDemo = await prisma.user.findUnique({ where: { email: demoClient.email } });
  if (!existingDemo) {
    const hash = await bcrypt.hash("Cliente123!", 10);
    const user = await prisma.user.create({
      data: {
        email: demoClient.email,
        name: `${demoClient.firstName} ${demoClient.lastName}`,
        passwordHash: hash,
        mustChangePassword: false, // para poder entrar directo en demo
        roles: { create: { roleId: clienteRole.id } },
      },
    });
    await prisma.client.update({ where: { id: demoClient.id }, data: { userId: user.id } });
    console.log(`✓ Usuario demo cliente: ${user.email} / Cliente123!`);
  } else {
    console.log(`✓ Usuario demo cliente ya existe: ${existingDemo.email}`);
  }

  console.log("✅ Datos de prueba cargados");
}

main()
  .catch((e) => {
    console.error("❌ Demo falló:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
