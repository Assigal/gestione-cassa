import React from "react";

type SidebarMetricProps = {
  icon: React.ElementType;
  label: string;
  value: string;
  note?: string;
  highlight?: boolean;
};

export function SidebarMetric({
  icon: Icon,
  label,
  value,
  note,
  highlight = false,
}: SidebarMetricProps) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-medium uppercase tracking-wide ${
              highlight ? "text-slate-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-1 font-semibold tracking-tight ${
              highlight ? "text-2xl" : "text-xl"
            }`}
          >
            {value}
          </p>

          {note && (
            <p
              className={`mt-1 text-xs ${
                highlight ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {note}
            </p>
          )}
        </div>

        <div
          className={`rounded-2xl p-2 ${
            highlight ? "bg-white/10" : "bg-slate-100"
          }`}
        >
          <Icon
            className={`h-4 w-4 ${
              highlight ? "text-white" : "text-slate-700"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
