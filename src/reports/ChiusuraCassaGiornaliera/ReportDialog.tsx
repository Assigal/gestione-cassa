import React, { useState } from "react";

import { ChiusuraCassaGiornalieraParameters } from "./ReportParameters";
import { ChiusuraCassaGiornalieraViewer } from "./ReportViewer";
import type { CassaGiornataReport } from "@/types/reportTypes";
import type { Movimento, Sospeso } from "@/types";
import { buildCassaGiornataReport } from "@/reports/buildCassaGiornataReport";

type ChiusuraCassaGiornalieraDialogProps = {
  onClose: () => void;
  movimenti: Movimento[];
  sospesi: Sospeso[];
  giornataCorrente: string;
  statoGiornata: string;
  supervisore?: string;
  cassaFisicaIniziale: number;
  versamento: number;
};

export function ChiusuraCassaGiornalieraDialog({
  onClose,
  movimenti,
  sospesi,
  giornataCorrente,
  statoGiornata,
  supervisore,
  cassaFisicaIniziale,
  versamento,
}: ChiusuraCassaGiornalieraDialogProps) {
  
  const [report, setReport] =
    useState<CassaGiornataReport | null>(null);
  
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
          onGenerate={(params) => {
            
            console.log("ON GENERATE DIALOG", params, {
              movimenti,
              sospesi,
              giornataCorrente,
              statoGiornata,
              supervisore,
              cassaFisicaIniziale,
              versamento,
            });

            const report = buildCassaGiornataReport({
              movimenti,
              sospesi,
              giornataCorrente,
              statoGiornata,
              supervisore,
              cassaFisicaIniziale,
              versamento,
            });
            console.log("REPORT GENERATO", report);
            setReport(report);
          }}
        />
        
        {report && (
          <ChiusuraCassaGiornalieraViewer
            report={report}
          />
        )}
        
      </div>
    </div>
  );
}
