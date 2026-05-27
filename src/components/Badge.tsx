import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "ok" | "warn" | "blue" | "neutral" | "purple";
};

export function Badge({
  children,
  variant = "default",
}: BadgeProps) {
  const styles = {
    default: "bg-slate-100 text-slate-700",
    ok: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    neutral: "bg-slate-100 text-slate-700",
    purple: "bg-violet-100 text-violet-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
