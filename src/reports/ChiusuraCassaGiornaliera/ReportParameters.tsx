import React, { useState } from "react";
import { Button } from "@/components/ui/button";

type ChiusuraCassaGiornalieraParametersProps = {
  onCancel: () => void;
  onGenerate: (params: { dataReport: string }) => void;
};

export function ChiusuraCassaGiornalieraParameters({
  onCancel,
  onGenerate,
}: ChiusuraCassaGiornalieraParametersProps) {
  const [dataReport, setDataReport] = useState(
    new Date().toISOString().slice(0, 10)
  );

  return (
    <>
      <div className="mt-5 space-y-4">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Data report
          </span>

          <input
            type="date"
            className="w-full rounded-2xl border px-3 py-2"
            value={dataReport}
            onChange={(e) => setDataReport(e.target.value)}
          />
        </label>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Genera la chiusura cassa giornaliera per la data selezionata.
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          className="rounded-2xl"
          onClick={onCancel}
        >
          Annulla
        </Button>

        <Button
          className="rounded-2xl"
          onClick={() => {
            onGenerate({ dataReport });
          }}
        >
          Genera report
        </Button>
      </div>
    </>
  );
}
