export interface Movimento {
  id: number;
  ramo: string;
  polizza: string;
  contraente: string;
  referenteSospesi: string;
  referenteSospesiId: string;
  importo: number;
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
