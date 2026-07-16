import React from "react";

type ReportSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function ReportSection({
  title,
  children,
}: ReportSectionProps) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">
        {title}
      </h2>

      <div className="overflow-x-auto rounded-2xl border print:overflow-visible">
        {children}
      </div>
    </section>
  );
}
