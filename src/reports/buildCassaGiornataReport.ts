import type {
  CassaGiornataReport,
  ReportMovimento,
  ReportRecuperoSospeso,
  ReportChiusuraSubagente,
} from "../types/reportTypes";

import type { Movimento, Sospeso } from "../types";

import { buildStatisticheGiornata } from "./buildStatisticheGiornata";

interface BuildReportParams {
  movimenti: Movimento[];
  sospesi: Sospeso[];

  dataGiornata: string;
  statoGiornata: string;

  supervisore?: string;
  ultimaModifica?: string;

  cassaFisicaIniziale: number;
  versamento: number;

  quadraturaCassa?: {
    cassaTeorica: number;
    cassaReale: number;
    differenza: number;
    isQuadrata: boolean;
  };
}

function importoSospeso(m: Movimento): number {
  return Math.max(
    Number(m.importo || 0) -
      Number(m.sconto || 0) -
      Number(m.incassato || 0),
    0
  );
}

function toReportMovimento(m: Movimento): ReportMovimento {
  return {
    id: String(m.id),
    ora: m.createdAt
      ? new Date(m.createdAt).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    dataInserimento: m.createdAt || "",
    utente: m.createdByEmail || "",

    contraente: m.contraente || "",
    polizza: m.polizza || "",

    tipoPagamento: m.modalita,

    importo: m.importo,
    incassato: m.incassato,
    sconto: m.sconto,
    sospeso: importoSospeso(m),

    cip: m.sub || "",

    note: m.note || "",

    isPostdatato: m.isPostdatato,
  };
}

export function buildCassaGiornataReport({
  movimenti,
  cassaFisicaIniziale,
  versamento,
  totaleCompagnia,
}: BuildReportParams): CassaGiornataReport {
  
  const titoliCip100 = movimenti
    .filter((m) => isTitoloDelGiorno(m) && isCip100(m))
    .map(toReportMovimento);
  
  const titoliAltriCip = movimenti
    .filter((m) => isTitoloDelGiorno(m) && !isCip100(m))
    .map(toReportMovimento);
  
  const recuperiSospesi = movimenti
    .filter(isRecuperoSospeso)
    .map(toReportMovimento);
  
  const versamentiSubagenti = movimenti.filter(isVersamentoSubagente);

  const totaleTitoliCip100 = sumBy(titoliCip100, (m) => m.importo);

  const totaleIncassatoCip100 = sumBy(
    titoliCip100,
    (m) => m.incassato
  );
  
  const totaleCompagniaSafe =
    totaleCompagnia !== undefined ? Number(totaleCompagnia) : undefined;
  
  const differenzaCompagnia =
    totaleCompagniaSafe !== undefined
      ? totaleTitoliCip100 - totaleCompagniaSafe
      : undefined;

  const quadraturaCompagnia = {
    totaleTitoliCip100,
    totaleCompagnia: totaleCompagniaSafe,
    differenza: differenzaCompagnia,
    isQuadrata:
      differenzaCompagnia !== undefined
        ? Math.abs(differenzaCompagnia) < 0.01
        : undefined,
  };

  const totaleSconti = sumBy(titoliCip100, (m) => m.sconto);

  const postdatati = titoliCip100.filter((m) => m.isPostdatato);
  
  const indicatori = {
    totaleSconti,
    totaleIncassatoCip100,
    totaleSospesiCreati: sumBy(
      movimenti.filter((m) => isTitoloDelGiorno(m) && !!m.sospeso_id),
      (m) => Number(m.importo_lordo ?? 0)
    ),
    numeroSospesiCreati: movimenti.filter(
      (m) => isTitoloDelGiorno(m) && !!m.sospeso_id
    ).length,
    totaleSospesiCreati: sumBy(titoliCip100, (m) =>
      Math.max(m.importo - m.sconto - m.incassato, 0)
    ),
    
    numeroSospesiCreati: titoliCip100.filter(
      (m) => m.importo - m.sconto - m.incassato > 0
    ).length,
    numeroRecuperiSospesi: recuperiSospesi.length,
    numeroAltriCip: titoliAltriCip.length,
    numeroPostdatati: postdatati.length,
  };
  
  console.log({
    titoliCip100: titoliCip100.length,
    titoliAltriCip: titoliAltriCip.length,
    recuperiSospesi: recuperiSospesi.length,
    versamentiSubagenti: versamentiSubagenti.length,
  });

  throw new Error("Report builder non ancora completato");
}
