export type ReportPaymentType =
  | "contanti"
  | "assegno"
  | "assegno_postdatato"
  | "pos"
  | "bonifico"
  | "sospeso"
  | "misto"
  | "altro";

export interface ReportMovimento {
  id: string;
  ora: string;
  contraente: string;
  polizza: string;
  tipoPagamento: string;
  importo: number;
  incassato: number;
  sconto: number;
  utente: string;
  cip: string;
  isPostdatato?: boolean;
}

export interface ReportRecuperoSospeso extends ReportMovimento {
  dataOrigineSospeso: string;
}

export interface ReportChiusuraSubagente {
  id: string;
  cip: string;
  subagente?: string;
  periodoDal: string;
  periodoAl: string;
  importo: number;
  modalitaPagamento: string;
  utente: string;
  note?: string;
}

export interface CassaGiornataReport {
  quadraturaCompagnia: {
    totaleTitoliCip100: number;
    totaleCompagnia?: number;
    differenza?: number;
    isQuadrata?: boolean;
  };

  indicatori: {
    totaleSconti: number;
    totaleSospesiCreati: number;
    totaleRecuperiSospesi: number;
    numeroSospesiCreati: number;
    numeroRecuperiSospesi: number;
    numeroAltriCip: number;
    numeroPostdatati: number;
  };

  sezioni: {
    titoliCip100: ReportMovimento[];
    titoliAltriCip: ReportMovimento[];
    recuperiSospesi: ReportRecuperoSospeso[];
    versamentiSubagenti: ReportChiusuraSubagente[];
    altriMovimenti: ReportMovimento[];
  };

  cassa: {
    cassaFisicaIniziale: number;
    totaleContanti: number;
    totaleAssegni: number;
    totalePos: number;
    totaleBonifici: number;
    totaleAltriPagamenti: number;
    versamento: number;
    cassaFisicaSerale: number;
  };

  alert: string[];
}
