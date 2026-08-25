import type { StationType } from "@/lib/types";

export function formatPrice(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatStation(
  stationType: StationType,
  stationNumber: number
): string {
  return `${stationType.toUpperCase()} ${stationNumber}`;
}
