import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 auto-rows-auto md:auto-rows-[200px]", className)}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  span?: "col-1" | "col-2" | "col-3" | "col-4" | "row-1" | "row-2";
  colSpan?: number;
  rowSpan?: number;
}

export function BentoCard({ 
  children, 
  className, 
  colSpan = 1, 
  rowSpan = 1 
}: BentoCardProps) {
  const colSpanClass = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
  }[colSpan];

  const rowSpanClass = {
    1: "md:row-span-1",
    2: "md:row-span-2",
    3: "md:row-span-3",
  }[rowSpan];

  return (
    <div 
      className={cn(
        "relative rounded-3xl overflow-hidden glass p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group",
        colSpanClass,
        rowSpanClass,
        className
      )}
    >
      {children}
    </div>
  );
}
