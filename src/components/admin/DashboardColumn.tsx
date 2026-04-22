"use client";

import type { DashboardBooking } from "./types";
import { DashboardCard } from "./DashboardCard";

type Props = {
  title: string;
  accent: "amber" | "cyan";
  items: DashboardBooking[];
  emptyText: string;
};

export function DashboardColumn({ title, accent, items, emptyText }: Props) {
  const dot =
    accent === "amber" ? "bg-amber-400" : "bg-cyan-400";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col min-h-[200px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        <span className="text-xs text-gray-400">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-400">{emptyText}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((b) => (
            <DashboardCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}
