import React from "react";

import type { CassaGiornataReport } from "@/types/reportTypes";
import { ReportSection } from "@/reports/components/ReportSection";

type ReportViewerProps = {
  report: CassaGiornataReport;
};

function euro(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

function totaleTitoli(rows: CassaGiornataReport["sezioni"]["titoliCip100"]) {
  return rows.reduce(
    (acc, row) => ({
      lordo: acc.lordo + row.importo,
      incassato: acc.incassato + row.incassato,
      sospeso: acc.sospeso + row.sospeso,
    }),
    { lordo: 0, incassato: 0, sospeso: 0 }
  );
}

function totaleImporti<T extends { importo: number }>(rows: T[]) {
  return rows.reduce((sum, row) => sum + row.importo, 0);
}

export function ChiusuraCassaGiornalieraViewer({
  report,
}: ReportViewerProps) {
  const totaliCip100 = totaleTitoli(report.sezioni.titoliCip100);

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

        {report.alert.length > 0 && (
          <section className="mt-4 space-y-2">
        
            {report.alert.map((alert, index) => (
              <div
                key={index}
                className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900"
              >
                ⚠ {alert}
              </div>
            ))}
        
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-lg border">
          <div className="border-b bg-slate-100 px-4 py-2">
            <h2 className="text-sm font-bold uppercase tracking-wide">
              Riepilogo della giornata
            </h2>
          </div>

          <div className="grid grid-cols-2">
            <div className="border-r p-4">
              <h3 className="mb-3 font-semibold">Cassa fisica</h3>

              <div className="space-y-2 text-sm">
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

                <div className="flex justify-between">
                  <span>Versamento</span>
                  <strong>- {euro(report.cassaFisica.versamento)}</strong>
                </div>

                <hr />

                <div className="flex justify-between text-base font-bold">
                  <span>Cassa teorica</span>
                  <span>{euro(report.cassaFisica.cassaTeorica)}</span>
                </div>
              </div>
            </div>

            <div className="p-4">
              <h3 className="mb-3 font-semibold">Produzione CIP100</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Lordo registrato</span>
                  <strong>{euro(report.produzioneCip100.totaleLordo)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Incassato</span>
                  <strong>
                    {euro(report.produzioneCip100.totaleIncassato)}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span>Movimenti</span>
                  <strong>{report.header.numeroTitoliCip100}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-lg border">
          <div className="grid grid-cols-2">
            <div className="border-r p-4">
              <h3 className="mb-3 font-semibold">Qualità giornata</h3>
        
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sospesi creati</span>
                  <strong>{euro(report.qualitaGiornata.totaleSospesiCreati)}</strong>
                </div>
        
                <div className="flex justify-between">
                  <span>Recuperi sospesi</span>
                  <strong>{euro(report.qualitaGiornata.totaleRecuperiSospesi)}</strong>
                </div>
                
                <hr />
        
                <div className="flex justify-between text-base font-bold">
                  <span>Saldo sospesi</span>
                  <span>{euro(report.qualitaGiornata.saldoSospesi)}</span>
                </div>
        
                <div className="flex justify-between">
                  <span>Sconti concessi</span>
                  <strong>{euro(report.produzioneCip100.totaleSconti)}</strong>
                </div>
        
                <div className="pt-2 text-xs text-slate-500">
                  Sospesi: {report.qualitaGiornata.numeroSospesiCreati} · Recuperi:{" "}
                  {report.qualitaGiornata.numeroRecuperiSospesi} · Postdatati:{" "}
                  {report.qualitaGiornata.numeroPostdatati}
                </div>
                <div className="mt-3"></div>
              </div>
            </div>
        
            <div className="p-4">
              <h3 className="mb-3 font-semibold">Subagenzie</h3>
        
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Chiusure subagenti</span>
                  <strong>{report.header.numeroVersamentiSubagenti}</strong>
                </div>
        
                <div className="flex justify-between">
                  <span>Totale versamenti</span>
                  <strong>
                    {euro(
                      report.sezioni.versamentiSubagenti.reduce(
                        (sum, row) => sum + row.importo,
                        0
                      )
                    )}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

       <ReportSection title="Titoli CIP100">
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

                {report.sezioni.titoliCip100.length > 0 && (
                  <tr className="border-t bg-slate-50 font-bold">
                    <td className="px-3 py-2" colSpan={5}>
                      Totale titoli CIP100
                    </td>
                    <td className="px-3 py-2 text-right">
                      {euro(totaliCip100.lordo)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {euro(totaliCip100.incassato)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {euro(totaliCip100.sospeso)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </ReportSection>

        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Titoli altri CIP
          </h2>
        
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Ora</th>
                  <th className="px-3 py-2">Operatore</th>
                  <th className="px-3 py-2">CIP</th>
                  <th className="px-3 py-2">Contraente</th>
                  <th className="px-3 py-2">Polizza</th>
                  <th className="px-3 py-2">Mod.</th>
                  <th className="px-3 py-2 text-right">Lordo</th>
                  <th className="px-3 py-2 text-right">Incassato</th>
                  <th className="px-3 py-2 text-right">Sospeso</th>
                </tr>
              </thead>
        
              <tbody>
                {report.sezioni.titoliAltriCip.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2">{m.ora}</td>
                    <td className="px-3 py-2">{m.utente}</td>
                    <td className="px-3 py-2">{m.sub}</td>
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
        
                {report.sezioni.titoliAltriCip.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={9}>
                      Nessun titolo altri CIP.
                    </td>
                  </tr>
                )}
        
                {report.sezioni.titoliAltriCip.length > 0 && (
                  <tr className="border-t bg-slate-50 font-bold">
                    <td className="px-3 py-2" colSpan={6}>
                      Totale titoli altri CIP
                    </td>
                    <td className="px-3 py-2 text-right">
                      {euro(totaleTitoli(report.sezioni.titoliAltriCip).lordo)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {euro(totaleTitoli(report.sezioni.titoliAltriCip).incassato)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {euro(totaleTitoli(report.sezioni.titoliAltriCip).sospeso)}
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
