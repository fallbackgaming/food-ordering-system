import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { MENU_ITEMS } from "../lib/menu";

const connectionString =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL required for seed");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const categoryOrder = ["Snacks", "Drinks", "Desserts"];

async function main() {
  for (let i = 0; i < categoryOrder.length; i++) {
    const name = categoryOrder[i]!;
    await prisma.category.upsert({
      where: { name },
      create: { name, sortOrder: i, isActive: true },
      update: { sortOrder: i, isActive: true },
    });
  }

  const categories = await prisma.category.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name, c.id]));

  for (const item of MENU_ITEMS) {
    const categoryId = categoryByName.get(item.category);
    if (!categoryId) continue;

    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name, categoryId },
    });

    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          price: item.price,
          emoji: item.emoji,
          isAvailable: item.isAvailable,
        },
      });
    } else {
      await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          emoji: item.emoji,
          isAvailable: item.isAvailable,
          categoryId,
        },
      });
    }
  }

  for (let n = 1; n <= 10; n++) {
    await prisma.station.upsert({
      where: { type_number: { type: "pc", number: n } },
      create: {
        type: "pc",
        number: n,
        name: `PC-${n}`,
        isActive: true,
      },
      update: {},
    });
  }

  for (let n = 1; n <= 4; n++) {
    await prisma.station.upsert({
      where: { type_number: { type: "ps", number: n } },
      create: {
        type: "ps",
        number: n,
        name: `PS-${n}`,
        isActive: true,
      },
      update: {},
    });
  }

  console.log("Seeded categories, menu items, and stations");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
