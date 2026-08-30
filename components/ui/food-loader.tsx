type FoodLoaderProps = {
  label?: string;
  fullScreen?: boolean;
  tone?: "light" | "dark";
};

const BITES = ["🍔", "🍟", "🥤", "🍕", "☕"] as const;

export function FoodLoader({
  label = "Cooking things up…",
  fullScreen = true,
  tone = "light",
}: FoodLoaderProps) {
  const isDark = tone === "dark";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={
        fullScreen
          ? `flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16 ${
              isDark ? "bg-ink text-canvas" : "bg-panel text-ink"
            }`
          : "flex flex-col items-center justify-center py-10"
      }
    >
      <div className="food-loader relative flex h-28 w-28 items-center justify-center">
        <div
          className={`food-loader-ring absolute inset-0 rounded-full border-2 ${
            isDark ? "border-canvas/10" : "border-ink/8"
          }`}
          aria-hidden
        />
        <div
          className="food-loader-orbit absolute inset-2 rounded-full border-2 border-transparent border-t-accent border-r-accent/40"
          aria-hidden
        />
        <div
          className={`relative z-10 flex size-16 items-center justify-center rounded-full shadow-inner ${
            isDark ? "bg-canvas/10" : "bg-white"
          }`}
          aria-hidden
        >
          <div className="food-loader-plate absolute inset-1 rounded-full border border-accent/30" />
          {BITES.map((bite, index) => (
            <span
              key={bite}
              className="food-loader-bite absolute text-2xl"
              style={{ animationDelay: `${index * 0.55}s` }}
            >
              {bite}
            </span>
          ))}
        </div>
        <span
          className="food-loader-steam absolute -top-1 left-1/2 h-3 w-1 -translate-x-1/2 rounded-full bg-accent/50"
          aria-hidden
        />
        <span
          className="food-loader-steam absolute -top-2 left-[42%] h-3 w-1 rounded-full bg-accent/35"
          style={{ animationDelay: "0.35s" }}
          aria-hidden
        />
        <span
          className="food-loader-steam absolute -top-2 left-[56%] h-3 w-1 rounded-full bg-accent/35"
          style={{ animationDelay: "0.7s" }}
          aria-hidden
        />
      </div>

      <p
        className={`mt-6 text-sm font-medium ${
          isDark ? "text-canvas/70" : "text-ink/60"
        }`}
      >
        {label}
      </p>
      <span className="sr-only">Loading</span>
    </div>
  );
}
