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
