import React, { forwardRef } from "react";

import type { CassaGiornataReport } from "@/types/reportTypes";
import { ReportSection } from "@/components/ReportSection";

type ReportViewerProps = {
  report: CassaGiornataReport;
};

function euro(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

function dataItaliana(value?: string): string {
  if (!value) return "-";

  const [anno, mese, giorno] = value.slice(0, 10).split("-");

  if (!anno || !mese || !giorno) return value;

  return `${giorno}/${mese}/${anno}`;
}

function percent(value: number): string {
  return `${(value || 0).toFixed(1)}%`;
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

export const ChiusuraCassaGiornalieraViewer = forwardRef<
  HTMLDivElement,
  ReportViewerProps
>(function ChiusuraCassaGiornalieraViewer({ report }, ref) {
  const totaliCip100 = totaleTitoli(report.sezioni.titoliCip100);

  return (
    <div className="mt-6 max-h-[65vh] overflow-auto rounded-2xl border bg-slate-100 p-4">
      <div
        ref={ref}
        className="mx-auto w-full max-w-5xl rounded-xl bg-white p-6 shadow-sm"
      >
        <header className="border-b pb-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Gestione Agenzia
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-950">
                Chiusura Cassa Giornaliera
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Riepilogo operativo e gestionale della giornata di agenzia
              </p>
            </div>

            <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-right text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Data giornata
              </div>

              <div className="mt-1 text-base font-bold text-slate-900">
                {dataItaliana(report.header.dataGiornata)}
              </div>

              <div className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                Stato
              </div>

              <div className="mt-1 font-semibold text-slate-900">
                {report.header.stato}
              </div>

              <div className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                Supervisore
              </div>

              <div className="mt-1 font-semibold text-slate-900">
                {report.header.supervisore || "-"}
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
            
            <div className="border-r p-4">
              <h3 className="mb-3 font-semibold">Qualità giornata</h3>
        
              <div className="space-y-2 text-sm">

                <div className="flex justify-between">
                  <span>Sospesi creati</span>
                    <strong>
                      {euro(report.qualitaGiornata.totaleSospesiCreati)}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        ({percent(report.produzioneCip100.incidenzaSospesi)})
                      </span>
                    </strong>
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
                    <strong>
                      {euro(report.produzioneCip100.totaleSconti)}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        ({percent(report.produzioneCip100.incidenzaSconti)})
                      </span>
                    </strong>
                </div>
        
                <div className="pt-2 text-xs text-slate-500">
                  Sospesi: {report.qualitaGiornata.numeroSospesiCreati} · Recuperi:{" "}
                  {report.qualitaGiornata.numeroRecuperiSospesi} · Postdatati:{" "}
                  {report.qualitaGiornata.numeroPostdatati}
                </div>
                <div className="mt-3"></div>
              </div>
            </div>
            

          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-lg border">
          <div className="grid grid-cols-2"> 

            <div className="p-4">
              <h3 className="mb-3 font-semibold">Movimentazione portafoglio diretto</h3>

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

                <div className="flex justify-between">
                  <span>Media per titolo</span>
                  <strong>{euro(report.produzioneCip100.mediaPerTitolo)}</strong>
                </div>

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

       <ReportSection title="Titoli del giorno - Portafoglio diretto">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="w-[7%] px-2 py-2">Ora</th>
                  <th className="w-[13%] px-2 py-2">Operatore</th>
                  <th className="w-[22%] px-2 py-2">Contraente</th>
                  <th className="w-[15%] px-2 py-2">Polizza</th>
                  <th className="w-[8%] px-2 py-2">Mod.</th>
                  <th className="w-[12%] px-2 py-2 text-right">Lordo</th>
                  <th className="w-[12%] px-2 py-2 text-right">Incassato</th>
                  <th className="w-[11%] px-2 py-2 text-right">Sospeso</th>
                </tr>
              </thead>

              <tbody>
                {report.sezioni.titoliCip100.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-2 py-2">{m.ora}</td>
                    <td className="break-words px-2 py-2">{m.utente}</td>
                    <td className="break-words px-2 py-2">{m.contraente}</td>
                    <td className="break-words px-2 py-2">{m.polizza}</td>
                    <td className="px-2 py-2">{m.tipoPagamento}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-right">
                      {euro(m.importo)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right">
                      {euro(m.incassato)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-right">
                      {m.sospeso > 0 ? euro(m.sospeso) : ""}
                    </td>
                  </tr>
                ))}

                {report.sezioni.titoliCip100.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={8}>
                      Nessun Titolo del giorno.
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
        
        {report.sezioni.titoliAltriCip.length > 0 && (
          <ReportSection title="Titoli altri CIP">
          
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
                      <td className="px-3 py-2">{m.cip}</td>
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
            </ReportSection>
          )}

          {report.sezioni.recuperiSospesi.length > 0 && (
            <ReportSection title="Recuperi sospesi">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Ora</th>
                    <th className="px-3 py-2">Operatore</th>
                    <th className="px-3 py-2">Contraente</th>
                    <th className="px-3 py-2">Polizza</th>
                    <th className="px-3 py-2">Mod.</th>
                    <th className="px-3 py-2">Origine sospeso</th>
                    <th className="px-3 py-2 text-right">Incassato</th>
                    <th className="px-3 py-2 text-right">Sconto</th>
                  </tr>
                </thead>

                <tbody>
                  {report.sezioni.recuperiSospesi.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-3 py-2">{m.ora}</td>
                      <td className="px-3 py-2">{m.utente}</td>
                      <td className="px-3 py-2">{m.contraente}</td>
                      <td className="px-3 py-2">{m.polizza}</td>
                      <td className="px-3 py-2">{m.tipoPagamento}</td>
                      <td className="px-3 py-2">{dataItaliana(m.dataOrigineSospeso)}</td>
                      <td className="px-3 py-2 text-right">{euro(m.incassato)}</td>
                      <td className="px-3 py-2 text-right">
                        {m.sconto > 0 ? euro(m.sconto) : ""}
                      </td>
                    </tr>
                  ))}

                  {report.sezioni.recuperiSospesi.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={8}>
                        Nessun recupero sospeso.
                      </td>
                    </tr>
                  )}

                  {report.sezioni.recuperiSospesi.length > 0 && (
                    <tr className="border-t bg-slate-50 font-bold">
                      <td className="px-3 py-2" colSpan={6}>
                        Totale recuperi sospesi
                      </td>
                      <td className="px-3 py-2 text-right">
                        {euro(
                          report.sezioni.recuperiSospesi.reduce(
                            (sum, row) => sum + row.incassato,
                            0
                          )
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {euro(
                          report.sezioni.recuperiSospesi.reduce(
                            (sum, row) => sum + row.sconto,
                            0
                          )
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ReportSection>
          )}

          {report.sezioni.versamentiSubagenti.length > 0 && (
            <ReportSection title="Versamenti subagenti">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Ora</th>
                    <th className="px-3 py-2">Operatore</th>
                    <th className="px-3 py-2">CIP</th>
                    <th className="px-3 py-2">Periodo</th>
                    <th className="px-3 py-2">Mod.</th>
                    <th className="px-3 py-2 text-right">Importo</th>
                  </tr>
                </thead>

                <tbody>
                  {report.sezioni.versamentiSubagenti.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-3 py-2">{m.ora}</td>
                      <td className="px-3 py-2">{m.utente}</td>
                      <td className="px-3 py-2">{m.cip}</td>
                      <td className="px-3 py-2">
                        {m.periodoDal} → {m.periodoAl}
                      </td>
                      <td className="px-3 py-2">{m.modalitaPagamento}</td>
                      <td className="px-3 py-2 text-right">
                        {euro(m.importo)}
                      </td>
                    </tr>
                  ))}

                  {report.sezioni.versamentiSubagenti.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={6}>
                        Nessun versamento subagente.
                      </td>
                    </tr>
                  )}

                  {report.sezioni.versamentiSubagenti.length > 0 && (
                    <tr className="border-t bg-slate-50 font-bold">
                      <td className="px-3 py-2" colSpan={5}>
                        Totale versamenti subagenti
                      </td>
                      <td className="px-3 py-2 text-right">
                        {euro(
                          report.sezioni.versamentiSubagenti.reduce(
                            (sum, row) => sum + row.importo,
                            0
                          )
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ReportSection>
          )}

          {report.sezioni.altriMovimenti.length > 0 && (
            <ReportSection title="Altri movimenti">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Ora</th>
                    <th className="px-3 py-2">Operatore</th>
                    <th className="px-3 py-2">Descrizione / Note</th>
                    <th className="px-3 py-2">Riferimento</th>
                    <th className="px-3 py-2">Mod.</th>
                    <th className="px-3 py-2 text-right">Importo</th>
                    <th className="px-3 py-2 text-right">Incassato</th>
                  </tr>
                </thead>

                <tbody>
                  {report.sezioni.altriMovimenti.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-3 py-2">{m.ora}</td>
                      <td className="px-3 py-2">{m.utente}</td>
                      <td className="px-3 py-2">
                        {m.note || m.contraente || "-"}
                      </td>

                      <td className="px-3 py-2">
                        {m.polizza || "-"}
                      </td>
                      <td className="px-3 py-2">{m.tipoPagamento}</td>
                      <td className="px-3 py-2 text-right">{euro(m.importo)}</td>
                      <td className="px-3 py-2 text-right">{euro(m.incassato)}</td>
                    </tr>
                  ))}

                  {report.sezioni.altriMovimenti.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-slate-500" colSpan={8}>
                        Nessun altro movimento.
                      </td>
                    </tr>
                  )}

                  {report.sezioni.altriMovimenti.length > 0 && (
                    <tr className="border-t bg-slate-50 font-bold">
                      <td className="px-3 py-2" colSpan={5}>
                        Totale altri movimenti
                      </td>
                      <td className="px-3 py-2 text-right">
                        {euro(
                          report.sezioni.altriMovimenti.reduce(
                            (sum, row) => sum + row.importo,
                            0
                          )
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {euro(
                          report.sezioni.altriMovimenti.reduce(
                            (sum, row) => sum + row.incassato,
                            0
                          )
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ReportSection>
          )}

        <footer className="mt-12 border-t pt-10">
          <div className="grid grid-cols-2 gap-16">
            <div className="text-center">
              <div className="mx-auto h-12 w-2/3 border-b border-slate-400" />

              <p className="mt-3 text-sm font-semibold text-slate-900">
                Verificato dal Supervisor
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Nome e firma
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-12 w-2/3 border-b border-slate-400" />

              <p className="mt-3 text-sm font-semibold text-slate-900">
                Approvato dall’Agente
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Nome e firma
              </p>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-slate-400">
            Documento generato dal sistema di gestione agenzia
          </p>
        </footer>
      </div>
    </div>
  );
});
