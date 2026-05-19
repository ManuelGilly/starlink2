import { prisma } from "@/lib/db";

export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  investment: number;
  messagesReceived: number;
  // Leads
  costPerLead: number;
  // Ventas
  totalConversions: number;
  productSalesCount: number;
  subscriptionSalesCount: number;
  // Revenue
  grossRevenue: number;
  cogs: number;
  netProfit: number;
  mySplit: number;
  partnerSplit: number;
  // Ratios
  conversionRate: number;
  roas: number;
  roi: number;
  // Desglose por tipo
  productRevenue: number;
  subscriptionRevenue: number;
}

export interface ProductBreakdown {
  productId: string;
  productName: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  cogs: number;
  profit: number;
}

export async function getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
  const campaign = await prisma.adCampaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      sales: {
        include: {
          items: { include: { product: true } },
        },
      },
      subscriptions: {
        include: {
          plan: true,
          payments: { where: { status: "CONFIRMADO" } },
        },
      },
    },
  });

  const investment = Number(campaign.budget);
  const messagesReceived = campaign.messagesReceived;

  // ── Ventas de productos
  let productRevenue = 0;
  let productCogs = 0;
  for (const sale of campaign.sales) {
    productRevenue += Number(sale.total);
    for (const item of sale.items) {
      productCogs += Number(item.product.costPrice) * item.quantity;
    }
  }

  // ── Ingresos por suscripciones (pagos confirmados de subs vinculadas a la campaña)
  let subscriptionRevenue = 0;
  let subscriptionCogs = 0;
  for (const sub of campaign.subscriptions) {
    for (const payment of sub.payments) {
      subscriptionRevenue += Number(payment.amount);
      const cost = payment.starlinkCost != null
        ? Number(payment.starlinkCost)
        : Number(sub.plan.cost ?? 0);
      subscriptionCogs += cost;
    }
  }

  const grossRevenue = productRevenue + subscriptionRevenue;
  const cogs = productCogs + subscriptionCogs;
  const netProfit = grossRevenue - cogs - investment;
  const totalConversions = campaign.sales.length + campaign.subscriptions.length;

  return {
    campaignId,
    campaignName: campaign.name,
    investment,
    messagesReceived,
    costPerLead: messagesReceived > 0 ? investment / messagesReceived : 0,
    totalConversions,
    productSalesCount: campaign.sales.length,
    subscriptionSalesCount: campaign.subscriptions.length,
    grossRevenue,
    cogs,
    netProfit,
    mySplit: netProfit / 2,
    partnerSplit: netProfit / 2,
    conversionRate: messagesReceived > 0 ? (totalConversions / messagesReceived) * 100 : 0,
    roas: investment > 0 ? grossRevenue / investment : 0,
    roi: investment > 0 ? (netProfit / investment) * 100 : 0,
    productRevenue,
    subscriptionRevenue,
  };
}

export async function getProductBreakdownByCampaign(campaignId: string): Promise<ProductBreakdown[]> {
  const sales = await prisma.sale.findMany({
    where: { campaignId },
    include: { items: { include: { product: true } } },
  });

  const map = new Map<string, ProductBreakdown>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const key = item.productId;
      const existing = map.get(key);
      const revenue = Number(item.subtotal);
      const cogs = Number(item.product.costPrice) * item.quantity;
      if (existing) {
        existing.unitsSold += item.quantity;
        existing.revenue += revenue;
        existing.cogs += cogs;
        existing.profit += revenue - cogs;
      } else {
        map.set(key, {
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          unitsSold: item.quantity,
          revenue,
          cogs,
          profit: revenue - cogs,
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

export async function getConsolidatedMetrics(startDate: Date, endDate: Date) {
  const campaigns = await prisma.adCampaign.findMany({
    where: {
      startDate: { gte: startDate },
      endDate: { lte: endDate },
    },
  });

  let totalInvestment = 0;
  let totalGrossRevenue = 0;
  let totalNetProfit = 0;
  let totalMessages = 0;
  let totalConversions = 0;

  const details = await Promise.all(
    campaigns.map((c) => getCampaignMetrics(c.id)),
  );

  for (const m of details) {
    totalInvestment += m.investment;
    totalGrossRevenue += m.grossRevenue;
    totalNetProfit += m.netProfit;
    totalMessages += m.messagesReceived;
    totalConversions += m.totalConversions;
  }

  return {
    campaigns: details,
    totalInvestment,
    totalGrossRevenue,
    totalNetProfit,
    totalMessages,
    totalConversions,
    overallRoas: totalInvestment > 0 ? totalGrossRevenue / totalInvestment : 0,
    overallRoi: totalInvestment > 0 ? (totalNetProfit / totalInvestment) * 100 : 0,
    overallConversionRate: totalMessages > 0 ? (totalConversions / totalMessages) * 100 : 0,
    splitEach: totalNetProfit / 2,
  };
}
