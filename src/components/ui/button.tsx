import React from "react";

export function Button({
  className = "",
  children,
  variant,
  size,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  variant?: string;
  size?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center border px-4 py-2 text-sm font-medium hover:bg-slate-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
