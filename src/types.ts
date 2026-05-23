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
