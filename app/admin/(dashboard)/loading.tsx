import { FoodLoader } from "@/components/ui/food-loader";

export default function DashboardLoading() {
  return (
    <div className="min-h-[50vh]">
      <FoodLoader fullScreen={false} tone="dark" label="Loading page…" />
    </div>
  );
}
