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

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <h2 className="font-semibold text-slate-900">Cassa fisica</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Avanzo precedente</span>
                <strong>{euro(report.cassaFisica.avanzoPrecedente)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Contanti</span>
                <strong>{euro(report.cassaFisica.totaleContanti)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Assegni</span>
                <strong>{euro(report.cassaFisica.totaleAssegni)}</strong>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Versamento</span>
                <strong>- {euro(report.cassaFisica.versamento)}</strong>
              </div>
              <div className="flex justify-between border-t pt-2 text-base">
                <span>Cassa teorica</span>
                <strong>{euro(report.cassaFisica.cassaTeorica)}</strong>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <h2 className="font-semibold text-slate-900">Produzione CIP100</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Lordo</span>
                <strong>{euro(report.produzioneCip100.totaleLordo)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Incassato</span>
                <strong>{euro(report.produzioneCip100.totaleIncassato)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Sconti</span>
                <strong>{euro(report.produzioneCip100.totaleSconti)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Sospesi creati</span>
                <strong>{euro(report.produzioneCip100.totaleSospesiCreati)}</strong>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <h2 className="font-semibold text-slate-900">Qualità giornata</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Recuperi sospesi</span>
                <strong>{euro(report.qualitaGiornata.totaleRecuperiSospesi)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Sospesi creati</span>
                <strong>{euro(report.qualitaGiornata.totaleSospesiCreati)}</strong>
              </div>
              <div className="flex justify-between border-t pt-2 text-base">
                <span>Saldo sospesi</span>
                <strong>{euro(report.qualitaGiornata.saldoSospesi)}</strong>
              </div>
              <div className="pt-2 text-xs text-slate-500">
                Sospesi: {report.qualitaGiornata.numeroSospesiCreati} · Recuperi:{" "}
                {report.qualitaGiornata.numeroRecuperiSospesi} · Postdatati:{" "}
                {report.qualitaGiornata.numeroPostdatati}
              </div>
            </div>
          </div>
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
