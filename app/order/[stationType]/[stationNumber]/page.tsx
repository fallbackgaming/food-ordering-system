import { OrderMenu } from "@/components/client/order-menu";
import { listMenuForCustomer } from "@/lib/catalog";
import { formatStation } from "@/lib/format";
import type { StationType } from "@/lib/types";
import { notFound } from "next/navigation";

type OrderPageProps = {
  params: Promise<{
    stationType: string;
    stationNumber: string;
  }>;
};

function parseStationType(value: string): StationType | null {
  if (value === "pc" || value === "ps") return value;
  return null;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { stationType: rawType, stationNumber: rawNumber } = await params;
  const stationType = parseStationType(rawType.toLowerCase());
  const stationNumber = Number(rawNumber);

  if (!stationType || !Number.isInteger(stationNumber) || stationNumber < 1) {
    notFound();
  }

  const stationLabel = formatStation(stationType, stationNumber);
  const menuItems = await listMenuForCustomer();

  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden bg-canvas">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,_rgba(30,202,211,0.16),_transparent_55%),linear-gradient(180deg,_#0f0f0f_0%,_#111111_42%,_#ffffff_42%)]"
        aria-hidden
      />

      <header className="relative z-10 px-4 pb-8 pt-6 text-canvas">
        <div className="mx-auto w-full max-w-xl lg:max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
            Fallback Gaming Cafe
          </p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Menu
              </h1>
              <p className="mt-2 text-sm text-canvas/65">
                Snacks and drinks delivered to your station.
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-canvas/15 bg-canvas/5 px-3 py-2 text-right backdrop-blur-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-accent">
                Delivering to
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {stationLabel}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-xl flex-1 px-4 pb-36 pt-2 lg:max-w-3xl lg:pb-12">
        {menuItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink/15 px-4 py-10 text-center text-sm text-ink/55">
            Menu is empty. Ask staff to add items in admin.
          </p>
        ) : (
          <OrderMenu
            items={menuItems}
            stationLabel={stationLabel}
            stationType={stationType}
            stationNumber={stationNumber}
          />
        )}
      </main>
    </div>
  );
}
