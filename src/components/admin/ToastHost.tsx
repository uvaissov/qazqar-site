"use client";

import { useEffect, useState } from "react";

export type ToastKind = "pending" | "return";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  body: string;
  onClick?: () => void;
};

type Props = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

const AUTO_DISMISS_MS = 6000;

export function ToastHost({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[320px] pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(() => onDismiss(item.id), 200);
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [item.id, onDismiss]);

  const accent =
    item.kind === "pending"
      ? "border-amber-400 bg-amber-50"
      : "border-cyan-400 bg-cyan-50";

  return (
    <div
      className={`pointer-events-auto rounded-lg border shadow-sm p-3 transition-all ${accent} ${
        leaving ? "opacity-0 translate-x-2" : "opacity-100"
      }`}
      onClick={item.onClick}
      role={item.onClick ? "button" : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 cursor-pointer">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {item.title}
          </p>
          <p className="text-xs text-gray-700 mt-0.5 truncate">{item.body}</p>
        </div>
        <button
          type="button"
          aria-label="Закрыть"
          className="text-gray-400 hover:text-gray-600 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setLeaving(true);
            window.setTimeout(() => onDismiss(item.id), 200);
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
