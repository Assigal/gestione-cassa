import React, { useState } from "react";

import { ChiusuraCassaGiornalieraParameters } from "./ReportParameters";
import { ChiusuraCassaGiornalieraViewer } from "./ReportViewer";
import type { CassaGiornataReport } from "@/types/reportTypes";

type ChiusuraCassaGiornalieraDialogProps = {
  onClose: () => void;
};

export function ChiusuraCassaGiornalieraDialog({
  onClose,
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
            setReport({
              header: {
                dataGiornata: params.dataReport,
                stato: "Aperta",
                supervisore: "Alessandro",
                ultimaModifica: "",
                totaleMovimenti: 3,
                numeroTitoliCip100: 2,
                numeroTitoliAltriCip: 0,
                numeroRecuperiSospesi: 1,
                numeroVersamentiSubagenti: 0,
                numeroAltriMovimenti: 0,
              },
          
              produzioneCip100: {
                totaleLordo: 500,
                totaleIncassato: 430,
                totaleSconti: 20,
                totaleSospesiCreati: 50,
                perModalita: [],
              },
          
              qualitaGiornata: {
                totaleSospesiCreati: 50,
                totaleRecuperiSospesi: 100,
                saldoSospesi: 50,
                numeroSospesiCreati: 1,
                numeroRecuperiSospesi: 1,
                numeroPostdatati: 0,
                numeroMovimentiExtra: 0,
              },
          
              cassaFisica: {
                avanzoPrecedente: 200,
                totaleContanti: 300,
                totaleAssegni: 100,
                disponibilita: 600,
                versamento: 400,
                cassaTeorica: 200,
              },
          
              quadraturaCassa: undefined,
          
              sezioni: {
                titoliCip100: [
                  {
                    id: "1",
                    ora: "09:12",
                    dataInserimento: "",
                    utente: "alex.gabellone@gmail.com",
                    contraente: "ROSSI MARIO",
                    polizza: "030/123456",
                    tipoPagamento: "C",
                    importo: 300,
                    incassato: 250,
                    sconto: 0,
                    sospeso: 50,
                    cip: "100",
                    note: "",
                  },
                  {
                    id: "2",
                    ora: "10:35",
                    dataInserimento: "",
                    utente: "linda@example.com",
                    contraente: "BIANCHI LUCA",
                    polizza: "030/654321",
                    tipoPagamento: "J",
                    importo: 200,
                    incassato: 180,
                    sconto: 20,
                    sospeso: 0,
                    cip: "100",
                    note: "Sconto autorizzato",
                  },
                ],
                titoliAltriCip: [],
                recuperiSospesi: [],
                versamentiSubagenti: [],
                altriMovimenti: [],
              },
          
              alert: [
                "Presenti 2 movimenti extra da verificare.",
                "Presenti 1 assegno postdatato.",
                "Saldo sospesi positivo: la giornata ha recuperato più sospesi di quanti ne ha creati.",
              ],
              
            });
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
