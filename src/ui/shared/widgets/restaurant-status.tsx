import clsx from "clsx";

import { Restaurant } from "@/lib/data";

export default function RestaurantStatus({ className }: { className?: string }) {
  const status = Restaurant.status;

  return (
    <div
      className={clsx(
        "restaurant-status inline-block flex items-center rounded-3xl px-4 py-3 leading-1",
        { "open bg-green-100": status === 1, "closed bg-red-100": status === 0 },
        className,
      )}
    >
      <span className="text-xs font-bold leading-1 [.open_&]:text-green-600 [.closed_&]:text-red-500 before:relative before:bottom-[1px] before:mr-1 before:inline-block before:h-[6px] before:w-[6px] before:rounded-full before:content-[''] [.closed_&]:before:bg-red-500 [.open_&]:before:bg-green-600">
        {status === 1 ? "Abierto" : "Cerrado"}
      </span>
    </div>
  );
}
