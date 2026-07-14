import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

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
  statoGiornata: "Aperta" | "Chiusa" | "Riaperta";
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

  const reportPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: reportPrintRef,
    documentTitle: report
      ? `Chiusura-cassa-${report.header.dataGiornata}`
      : "Chiusura-cassa-giornaliera",
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 10mm;
      }

      body {
        margin: 0;
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      thead {
        display: table-header-group;
      }

      tr, footer {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    `,
  });

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
          onGenerate={() => {
            const report = buildCassaGiornataReport({
              movimenti,
              sospesi,
              dataGiornata: giornataCorrente,
              statoGiornata,
              supervisore,
              cassaFisicaIniziale,
              versamento,
            });

            setReport(report);
          }}
        />

        {report && (
  <>
          <div className="mt-4 flex justify-end print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Stampa / Salva PDF
            </button>
          </div>

          <ChiusuraCassaGiornalieraViewer
            ref={reportPrintRef}
            report={report}
          />

        </>
      )}
      </div>
    </div>
  );
}
