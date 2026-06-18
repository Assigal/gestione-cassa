import type { Movimento, ImportRow } from "./types";

export function numeroPolizzaCompleto(row: { ramo?: string; polizza?: string }) {
  if (!row.ramo && !row.polizza) return "-";
  if (!row.ramo) return row.polizza || "-";
  if (!row.polizza) return row.ramo;
  return `${row.ramo}/${row.polizza}`;
}

export function descrizioneMovimento(row: Movimento) {
  if (row.tipo === "Versamento subagente") {
    return row.dataInizioSubagente && row.dataFineSubagente
      ? `Periodo ${row.dataInizioSubagente} → ${row.dataFineSubagente}`
      : "Versamento subagente";
  }

  return numeroPolizzaCompleto(row);
}

export function isAssegnoPostdatato(
  row: { modalita: string; dataAssegno: string },
  giornata: string
) {
  return row.modalita === "A" && !!row.dataAssegno && row.dataAssegno > giornata;
}

export function isVersamentoSubagente(tipo: string) {
  return tipo === "Versamento subagente";
}

export function getDescrizioneModalita(codice: string | null | undefined) {
  const map: Record<string, string> = {
    C: "Contanti",
    A: "Assegno",
    B: "Bonifico",
    J: "POS",
    F: "Finitalia",
    H: "App",
    M: "Mensilizzazione",
    Y: "Virtual POS",
    D: "Direzione",
    S: "Sospeso",
    W: "Bonifico Multi",
    X: "Scoperto",
  };

  const normalized = String(codice || "").trim().toUpperCase();

  return map[normalized] || codice || "-";
}

export function calcolaValoriTitolo(importo: number) {
  const sconto = Number((importo - Math.floor(importo)).toFixed(2));
  const incassato = Number((importo - sconto).toFixed(2));

  return {
    sconto,
    incassato,
  };
}
