import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { StationType } from "@/lib/generated/prisma/client";
import { NextResponse } from "next/server";

function defaultStationName(type: StationType, number: number) {
  return `${type.toUpperCase()}-${number}`;
}

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stations = await prisma.station.findMany({
    where: { deletedAt: null },
    orderBy: [{ type: "asc" }, { number: "asc" }],
  });

  return NextResponse.json({ stations });
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    type?: string;
    number?: number;
    name?: string;
  };

  const type = body.type?.toLowerCase();
  const number = body.number;

  if (
    (type !== "pc" && type !== "ps") ||
    !Number.isInteger(number) ||
    !number ||
    number < 1
  ) {
    return NextResponse.json(
      { error: "Choose PC or PS and a valid station number" },
      { status: 400 }
    );
  }

  const name =
    body.name?.trim() || defaultStationName(type as StationType, number);

  try {
    const station = await prisma.station.upsert({
      where: {
        type_number: { type: type as StationType, number },
      },
      create: {
        type: type as StationType,
        number,
        name,
        isActive: true,
      },
      update: {
        name,
        isActive: true,
        deletedAt: null,
      },
    });

    return NextResponse.json({ station }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not create station QR" },
      { status: 500 }
    );
  }
}
