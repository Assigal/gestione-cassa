import { CassaGiornataReport } from "../types/reportTypes";

type MovimentoCassaDb = {
  id: string;
  tipo_movimento: string;
  codice_subagenzia: string | null;
  ramo: string | null;
  polizza: string | null;
  contraente: string | null;
  modalita_pagamento: string;
  data_assegno: string | null;
  importo_lordo: number;
  sconto: number;
  importo_netto: number;
  segno: number;
  note: string | null;
  data_inizio_subagente: string | null;
  data_fine_subagente: string | null;
  created_at: string;
  created_by_email: string | null;
  sospeso_id: string | null;
};

interface BuildReportParams {
  movimenti: MovimentoCassaDb[];
  cassaFisicaIniziale: number;
  versamento: number;
  totaleCompagnia?: number;
}

const CIP_AGENZIA = "100";

function normalize(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeTipo(value: unknown): string {
  return normalize(value).toLowerCase();
}

function isCip100(m: MovimentoCassaDb): boolean {
  return normalize(m.codice_subagenzia) === CIP_AGENZIA;
}

function isTitoloDelGiorno(m: MovimentoCassaDb): boolean {
  return normalizeTipo(m.tipo_movimento) === "titolo del giorno";
}

function isRecuperoSospeso(m: MovimentoCassaDb): boolean {
  return normalizeTipo(m.tipo_movimento) === "recupero sospeso";
}

function isVersamentoSubagente(m: MovimentoCassaDb): boolean {
  return normalizeTipo(m.tipo_movimento) === "versamento subagente";
}

function isAssegnoPostdatato(m: MovimentoCassaDb): boolean {
  if (normalizeTipo(m.modalita_pagamento) !== "assegno") return false;
  if (!m.data_assegno) return false;

  const dataAssegno = new Date(m.data_assegno);
  const dataCassa = new Date(m.created_at);

  dataAssegno.setHours(0, 0, 0, 0);
  dataCassa.setHours(0, 0, 0, 0);

  return dataAssegno > dataCassa;
}

function getOra(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toReportMovimento(m: MovimentoCassaDb) {
  return {
    id: m.id,
    ora: getOra(m.created_at),
    contraente: m.contraente ?? "",
    polizza: m.polizza ?? "",
    tipoPagamento: m.modalita_pagamento,
    importo: Number(m.importo_lordo ?? 0),
    sconto: Number(m.sconto ?? 0),
    utente: m.created_by_email ?? "",
    cip: normalize(m.codice_subagenzia),
    isPostdatato: isAssegnoPostdatato(m),
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

  console.log({
    titoliCip100: titoliCip100.length,
    titoliAltriCip: titoliAltriCip.length,
    recuperiSospesi: recuperiSospesi.length,
    versamentiSubagenti: versamentiSubagenti.length,
  });

  throw new Error("Report builder non ancora completato");
}
