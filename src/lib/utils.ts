import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FUEL_TYPE_LABELS: Record<string, string> = {
  AI92: "АИ-92",
  AI95: "АИ-95",
  AI98: "АИ-98",
  DIESEL: "Дизель",
};

export const TRANSMISSION_LABELS: Record<string, string> = {
  AUTOMATIC: "Автомат",
  MANUAL: "Механика",
};

export function fuelTypeLabel(value: string): string {
  return FUEL_TYPE_LABELS[value] ?? value;
}

export function transmissionLabel(value: string): string {
  return TRANSMISSION_LABELS[value] ?? value;
}
