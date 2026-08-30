import { OrderMenu } from "@/components/client/order-menu";
import { StaffLoginLink } from "@/components/staff-login-link";
import { getStationLabel, listMenuForCustomer } from "@/lib/catalog";
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

  const [stationLabel, menuItems] = await Promise.all([
    getStationLabel(stationType, stationNumber),
    listMenuForCustomer(),
  ]);
  const stationKind = stationType === "pc" ? "PC station" : "PlayStation";

  return (
    <div className="flex min-h-full flex-col overflow-x-hidden bg-ink text-canvas">
      <header className="menu-hero relative z-10 px-4 pb-10 pt-7 text-canvas">
        <div className="mx-auto w-full max-w-2xl lg:max-w-4xl">
          <div className="mb-5 flex justify-end">
            <StaffLoginLink />
          </div>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <div className="animate-fade-up min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent">
                Food Ordering
              </p>

              <h1 className="brand-mark mt-3 max-w-xl text-[2.35rem] sm:text-5xl lg:text-[3.5rem]">
                <span className="block">Fallback</span>
                <span className="brand-mark-accent mt-1 block">
                  Gaming Cafe
                </span>
              </h1>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-canvas/55">
                Order snacks and drinks in a few taps — we deliver straight to
                your {stationKind}.
              </p>
            </div>

            <div
              className="animate-fade-up w-full shrink-0 rounded-2xl border border-canvas/12 bg-canvas/[0.06] px-4 py-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md sm:w-auto sm:min-w-[9.5rem] sm:text-right"
              style={{ animationDelay: "80ms" }}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-accent">
                Delivering to
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-canvas">
                {stationLabel}
              </p>
              <p className="mt-1 text-[11px] text-canvas/45">Stay seated</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-4 pb-36 pt-2 lg:max-w-4xl lg:pb-14">
        {menuItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-canvas/15 bg-fog px-4 py-14 text-center">
            <p className="text-sm text-canvas/55">
              Menu is empty. Ask staff to add items in admin.
            </p>
          </div>
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
