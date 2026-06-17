import { CassaGiornataReport } from "../types/reportTypes";

type MovimentoCassaDb = any;

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
  return normalizeTipo(m.tipo_pagamento).includes("postdat");
}
