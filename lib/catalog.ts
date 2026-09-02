import { prisma } from "@/lib/db";
import type { StationType } from "@/lib/generated/prisma/client";

export async function ensureStation(type: StationType, number: number) {
  const name = `${type.toUpperCase()}-${number}`;
  return prisma.station.upsert({
    where: { type_number: { type, number } },
    create: { type, number, name, isActive: true },
    update: {},
  });
}

export async function getStationLabel(type: StationType, number: number) {
  const station = await prisma.station.findUnique({
    where: { type_number: { type, number } },
  });
  return station?.name ?? `${type.toUpperCase()}-${number}`;
}

export async function listMenuForCustomer() {
  const items = await prisma.menuItem.findMany({
    where: {
      deletedAt: null,
      category: { deletedAt: null, isActive: true },
    },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category.name,
    emoji: item.emoji,
    isAvailable: item.isAvailable,
  }));
}
