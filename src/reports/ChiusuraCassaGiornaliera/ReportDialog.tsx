import React from "react";

import { ChiusuraCassaGiornalieraParameters } from "./ReportParameters";
import { ChiusuraCassaGiornalieraViewer } from "./ReportViewer";

type ChiusuraCassaGiornalieraDialogProps = {
  onClose: () => void;
};

export function ChiusuraCassaGiornalieraDialog({
  onClose,
}: ChiusuraCassaGiornalieraDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">
            Chiusura cassa giornaliera
          </h3>

          <p className="text-sm text-slate-500">
            Documento ufficiale della giornata di cassa.
          </p>
        </div>

        <ChiusuraCassaGiornalieraParameters
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
