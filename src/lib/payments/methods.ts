import type { PaymentMethod } from "@prisma/client";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "ZELLE",
  "PAYPAL",
  "BINANCE",
  "EFECTIVO_USD",
  "TRANSFERENCIA_USD",
  "PAGO_MOVIL",
  "OTRO",
];

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  ZELLE: "Zelle",
  PAYPAL: "PayPal",
  BINANCE: "Binance",
  EFECTIVO_USD: "Efectivo USD",
  TRANSFERENCIA_USD: "Transferencia USD",
  PAGO_MOVIL: "Pago Móvil",
  OTRO: "Otro",
};

// Métodos que se cobran en bolívares: piden monto en Bs + tasa del día.
export const BOLIVAR_METHODS: PaymentMethod[] = ["PAGO_MOVIL"];

export function isBolivarMethod(m: PaymentMethod): boolean {
  return BOLIVAR_METHODS.includes(m);
}

// Clave del AppSetting con la tasa Bs/USD (paralelo).
export const VES_RATE_KEY = "BINANCE_PARALELO_VES_USD";
