import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ReportDefinition = {
  id: string;
  categoria: string;
  titolo: string;
  descrizione: string;
  disponibile: boolean;
};

const reports: ReportDefinition[] = [
  {
    id: "chiusura-cassa-giornaliera",
    categoria: "Cassa",
    titolo: "Chiusura cassa giornaliera",
    descrizione: "Documento ufficiale della giornata di cassa.",
    disponibile: true,
  },
  {
    id: "report-cassa-mensile",
    categoria: "Cassa",
    titolo: "Report cassa mensile",
    descrizione: "Riepilogo mensile dei KPI di cassa.",
    disponibile: false,
  },
  {
    id: "sospesi-aperti",
    categoria: "Sospesi",
    titolo: "Sospesi aperti",
    descrizione: "Elenco dei sospesi ancora da recuperare.",
    disponibile: false,
  },
  {
    id: "sospesi-chiusi",
    categoria: "Sospesi",
    titolo: "Sospesi chiusi",
    descrizione: "Sospesi chiusi in un intervallo di date.",
    disponibile: false,
  },
  {
    id: "chiusure-subagente",
    categoria: "Subagenzie",
    titolo: "Chiusure subagente",
    descrizione: "Report delle chiusure per CIP e periodo.",
    disponibile: false,
  },
  {
    id: "esposizione-subagenti",
    categoria: "Subagenzie",
    titolo: "Esposizione subagenti",
    descrizione: "Situazione aperta e warning finanziari.",
    disponibile: false,
  },
  {
    id: "attivita-operatori",
    categoria: "Controllo",
    titolo: "Attività operatori / supervisor",
    descrizione: "Analisi operativa per utente e ruolo.",
    disponibile: false,
  },
  {
    id: "audit",
    categoria: "Controllo",
    titolo: "Audit operazioni",
    descrizione: "Storico modifiche, cancellazioni e operazioni critiche.",
    disponibile: false,
  },
];

const categorie = Array.from(new Set(reports.map((r) => r.categoria)));

export function ReportPanel() {
  const [selectedReport, setSelectedReport] =
  useState<ReportDefinition | null>(null);
  
  function handleOpenReport(report: ReportDefinition) {
    if (!report.disponibile) {
      alert("Report in preparazione.");
      return;
    }
  
    setSelectedReport(report);
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="space-y-6 p-4">
        <div>
          <h2 className="text-lg font-semibold">Centro Report</h2>
          <p className="text-sm text-slate-500">
            Stampe, controlli e analisi operative del gestionale
          </p>
        </div>

        {categorie.map((categoria) => (
          <div key={categoria} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {categoria}
            </h3>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {reports
                .filter((report) => report.categoria === categoria)
                .map((report) => (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => handleOpenReport(report)}
                    className="flex min-h-32 flex-col justify-between rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-slate-400 hover:shadow-md disabled:opacity-70"
                  >
                    <div className="space-y-2">
                      <div className="text-base font-semibold text-slate-900">
                        {report.titolo}
                      </div>

                      <p className="text-sm text-slate-500">
                        {report.descrizione}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        {report.disponibile ? "Disponibile" : "In preparazione"}
                      </span>

                      <span className="text-sm font-semibold text-slate-700">
                        Apri
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ))}

        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedReport.titolo}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedReport.descrizione}
                </p>
              </div>
        
              <div className="mt-5 space-y-4">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-500">
                    Data report
                  </span>
                  <input
                    type="date"
                    className="w-full rounded-2xl border px-3 py-2"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </label>
        
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  La prima versione genererà la chiusura della giornata selezionata.
                  In seguito aggiungeremo anteprima, stampa e PDF.
                </div>
              </div>
        
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => setSelectedReport(null)}
                >
                  Annulla
                </Button>
        
                <Button
                  className="rounded-2xl"
                  onClick={() => {
                    alert(`Genera report: ${selectedReport.titolo}`);
                  }}
                >
                  Genera report
                </Button>
              </div>
            </div>
          </div>
        )}
        
      </CardContent>
    </Card>
  );
}
