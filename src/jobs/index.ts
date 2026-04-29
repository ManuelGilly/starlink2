import cron from "node-cron";
import { runDeficitProjection } from "./deficit-projection";
import { runPaymentReminders } from "./payment-reminders";

/**
 * Proceso en background que corre los jobs programados.
 * Ejecutar con: npm run jobs
 */
function schedule() {
  // Proyección de déficit: todos los días a las 08:00 (zona del host)
  cron.schedule("0 8 * * *", async () => {
    console.log("[cron] deficit-projection iniciando…");
    try { await runDeficitProjection({ windowDays: 30, projectionDays: 30 }); }
    catch (e) { console.error("[cron] deficit falló:", e); }
  });

  // Recordatorios de cobro: todos los días a las 09:00
  cron.schedule("0 9 * * *", async () => {
    console.log("[cron] payment-reminders iniciando…");
    try { await runPaymentReminders(); }
    catch (e) { console.error("[cron] reminders falló:", e); }
  });

  console.log("✓ Jobs programados. Esperando…");
}

// Permitir correr on-demand:  tsx src/jobs/index.ts deficit | reminders
async function main() {
  const arg = process.argv[2];
  if (arg === "deficit") {
    await runDeficitProjection();
    process.exit(0);
  }
  if (arg === "reminders") {
    await runPaymentReminders();
    process.exit(0);
  }
  schedule();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
