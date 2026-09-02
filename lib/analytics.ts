import { prisma } from "@/lib/db";

export type AnalyticsRange = 7 | 30 | 90;

export type AnalyticsPayload = {
  rangeDays: number;
  generatedAt: string;
  summary: {
    revenuePaise: number;
    orderCount: number;
    avgOrderPaise: number;
    cancelledCount: number;
    cancelRate: number;
    activeStations: number;
    menuItems: number;
  };
  previous: {
    revenuePaise: number;
    orderCount: number;
  };
  daily: Array<{
    date: string;
    label: string;
    revenuePaise: number;
    orderCount: number;
  }>;
  byStatus: Array<{ status: string; count: number }>;
  byPayment: Array<{ method: string; count: number; revenuePaise: number }>;
  topItems: Array<{
    name: string;
    quantity: number;
    revenuePaise: number;
  }>;
  byStation: Array<{
    stationName: string;
    orderCount: number;
    revenuePaise: number;
  }>;
  byHour: Array<{ hour: number; orderCount: number }>;
};

function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export async function getAnalytics(
  rangeDays: AnalyticsRange = 30
): Promise<AnalyticsPayload> {
  const now = new Date();
  const rangeStart = startOfLocalDay(now);
  rangeStart.setDate(rangeStart.getDate() - (rangeDays - 1));

  const prevEnd = new Date(rangeStart);
  prevEnd.setMilliseconds(-1);
  const prevStart = startOfLocalDay(prevEnd);
  prevStart.setDate(prevStart.getDate() - (rangeDays - 1));

  const paidWhere = {
    status: { not: "CANCELLED" as const },
    createdAt: { gte: rangeStart },
  };

  const [
    orders,
    prevOrders,
    statusGroups,
    activeStations,
    menuItems,
    lineItems,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        totalAmount: true,
        createdAt: true,
        station: { select: { name: true } },
      },
    }),
    prisma.order.findMany({
      where: {
        status: { not: "CANCELLED" },
        createdAt: { gte: prevStart, lte: prevEnd },
      },
      select: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: rangeStart } },
      _count: { _all: true },
    }),
    prisma.station.count({ where: { deletedAt: null, isActive: true } }),
    prisma.menuItem.count({ where: { deletedAt: null } }),
    prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: rangeStart },
          status: { not: "CANCELLED" },
        },
      },
      select: { name: true, quantity: true, unitPrice: true },
    }),
  ]);

  const nonCancelled = orders.filter((o) => o.status !== "CANCELLED");
  const cancelledCount = orders.length - nonCancelled.length;
  const revenuePaise = nonCancelled.reduce((s, o) => s + o.totalAmount, 0);
  const orderCount = nonCancelled.length;
  const avgOrderPaise = orderCount > 0 ? Math.round(revenuePaise / orderCount) : 0;
  const cancelRate =
    orders.length > 0 ? cancelledCount / orders.length : 0;

  const prevRevenue = prevOrders.reduce((s, o) => s + o.totalAmount, 0);

  // Daily series
  const dailyMap = new Map<string, { revenuePaise: number; orderCount: number }>();
  for (let i = 0; i < rangeDays; i++) {
    const d = new Date(rangeStart);
    d.setDate(rangeStart.getDate() + i);
    dailyMap.set(dayKey(d), { revenuePaise: 0, orderCount: 0 });
  }
  for (const o of nonCancelled) {
    const key = dayKey(o.createdAt);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;
    bucket.revenuePaise += o.totalAmount;
    bucket.orderCount += 1;
  }
  const daily = Array.from(dailyMap.entries()).map(([date, v]) => {
    const d = new Date(date + "T12:00:00");
    return {
      date,
      label: dayLabel(d),
      revenuePaise: v.revenuePaise,
      orderCount: v.orderCount,
    };
  });

  // Payment split
  const payMap = new Map<string, { count: number; revenuePaise: number }>();
  for (const o of nonCancelled) {
    const method = o.paymentMethod ?? "unknown";
    const cur = payMap.get(method) ?? { count: 0, revenuePaise: 0 };
    cur.count += 1;
    cur.revenuePaise += o.totalAmount;
    payMap.set(method, cur);
  }

  // Top items
  const itemMap = new Map<string, { quantity: number; revenuePaise: number }>();
  for (const line of lineItems) {
    const cur = itemMap.get(line.name) ?? { quantity: 0, revenuePaise: 0 };
    cur.quantity += line.quantity;
    cur.revenuePaise += line.unitPrice * line.quantity;
    itemMap.set(line.name, cur);
  }
  const topItems = Array.from(itemMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  // By station
  const stationMap = new Map<
    string,
    { orderCount: number; revenuePaise: number }
  >();
  for (const o of nonCancelled) {
    const name = o.station.name;
    const cur = stationMap.get(name) ?? { orderCount: 0, revenuePaise: 0 };
    cur.orderCount += 1;
    cur.revenuePaise += o.totalAmount;
    stationMap.set(name, cur);
  }
  const byStation = Array.from(stationMap.entries())
    .map(([stationName, v]) => ({ stationName, ...v }))
    .sort((a, b) => b.revenuePaise - a.revenuePaise)
    .slice(0, 12);

  // By hour
  const hourCounts = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    orderCount: 0,
  }));
  for (const o of nonCancelled) {
    hourCounts[o.createdAt.getHours()]!.orderCount += 1;
  }

  return {
    rangeDays,
    generatedAt: now.toISOString(),
    summary: {
      revenuePaise,
      orderCount,
      avgOrderPaise,
      cancelledCount,
      cancelRate,
      activeStations,
      menuItems,
    },
    previous: {
      revenuePaise: prevRevenue,
      orderCount: prevOrders.length,
    },
    daily,
    byStatus: statusGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
    })),
    byPayment: Array.from(payMap.entries()).map(([method, v]) => ({
      method,
      ...v,
    })),
    topItems,
    byStation,
    byHour: hourCounts,
  };
}
