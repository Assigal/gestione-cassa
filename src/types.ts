import type { Session } from "@supabase/supabase-js";

export interface ProfiloUtente {
  id: string;
  email: string;
  nome: string | null;
  nome_report: string | null;
  ruolo: "admin" | "operatore";
  attivo: boolean;
  puo_essere_supervisor: boolean;
  ordine: number | null;
  created_at: string;
}

export interface ModalitaPagamento {
  id: number;
  codice: string;
  descrizione: string;
  attiva: boolean;
}

export interface ReferenteSospesi {
  id: string;
  nome: string;
  attivo: boolean;
}

export interface Movimento {
  id: number;
  ramo: string;
  polizza: string;
  contraente: string;
  referenteSospesi: string;
  referenteSospesiId: string;
  sospesoId?: string;
  importo: number;
  incassato: number;
  sconto: number;
  netto: number;
  modalita: string;
  tipo: string;
  sub: string;
  dataAssegno: string;
  segno: number;
  note: string;
  dataInizioSubagente: string;
  dataFineSubagente: string;
  allocazioniRecupero: AllocazioneRecupero[];

  createdAt?: string;
  createdByEmail?: string;
}
export interface Sospeso {
  id: string;
  referenteSospesi: string;
  referenteSospesiId: string;
  contraente: string;
  ramo: string;
  polizza: string;
  importoOriginario: number;
  recuperato: number;
  scontoApplicato: number;
  residuo: number;
  stato: string;
  dataSospeso: string;
  note: string;
}
export interface FormState {
  ramo: string;
  polizza: string;
  contraente: string;
  referenteSospesi: string;
  referenteSospesi_id: string;
  importo: string;
  importoIncassato: string;
  sconto: string;
  modalita: string;
  dataAssegno: string;
  sub: string;
  tipo: string;
  note: string;
  dataInizioSubagente: string;
  dataFineSubagente: string;
}

export interface ImportRow {
  id: string;
  sub: string;
  ramo: string;
  polizza: string;
  contraente: string;
  importo: number;
  modalitaCompagnia: string;
  stato: string;
  fileOrigine?: string;
}

export interface AllocazioneRecupero {
  sospesoId: string;
  incasso: number;
  sconto: number;
}


