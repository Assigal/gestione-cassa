import React from "react";

import type { CassaGiornataReport } from "@/types/reportTypes";

type ReportViewerProps = {
  report: CassaGiornataReport;
};

function euro(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

export function ChiusuraCassaGiornalieraViewer({
  report,
}: ReportViewerProps) {
  return (
    <div className="mt-6 max-h-[65vh] overflow-auto rounded-2xl border bg-slate-100 p-4">
      <div className="mx-auto w-full max-w-5xl rounded-xl bg-white p-6 shadow-sm">
        
        <header className="border-b pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Chiusura cassa giornaliera
          </p>

          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Report giornata
              </h1>
              <p className="text-sm text-slate-500">
                Data: {report.header.dataGiornata}
              </p>
            </div>

            <div className="text-right text-sm">
              <div className="font-semibold text-slate-900">
                Stato: {report.header.stato}
              </div>
              <div className="text-slate-500">
                Supervisore: {report.header.supervisore || "-"}
              </div>
            </div>
          </div>
        </header>

        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Titoli CIP100
          </h2>

          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Ora</th>
                  <th className="px-3 py-2">Operatore</th>
                  <th className="px-3 py-2">Contraente</th>
                  <th className="px-3 py-2">Polizza</th>
                  <th className="px-3 py-2">Mod.</th>
                  <th className="px-3 py-2 text-right">Lordo</th>
                  <th className="px-3 py-2 text-right">Incassato</th>
                  <th className="px-3 py-2 text-right">Sospeso</th>
                </tr>
              </thead>
              <tbody>
                {report.sezioni.titoliCip100.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2">{m.ora}</td>
                    <td className="px-3 py-2">{m.utente}</td>
                    <td className="px-3 py-2">{m.contraente}</td>
                    <td className="px-3 py-2">{m.polizza}</td>
                    <td className="px-3 py-2">{m.tipoPagamento}</td>
                    <td className="px-3 py-2 text-right">{euro(m.importo)}</td>
                    <td className="px-3 py-2 text-right">{euro(m.incassato)}</td>
                    <td className="px-3 py-2 text-right">
                      {m.sospeso > 0 ? euro(m.sospeso) : ""}
                    </td>
                  </tr>
                ))}

                {report.sezioni.titoliCip100.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={8}>
                      Nessun titolo CIP100.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
