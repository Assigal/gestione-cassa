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

  utente: string;      // operatore
  dataInserimento: string;

  contraente: string;
  polizza: string;

  tipoPagamento: string;

  importo: number;
  incassato: number;
  sconto: number;
  sospeso: number;

  cip: string;

  note?: string;

  isPostdatato?: boolean;
}

export interface ReportRecuperoSospeso extends ReportMovimento {
  dataOrigineSospeso: string;
}

export interface ReportChiusuraSubagente {
  id: string;

  ora: string;

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
  header: {
    dataGiornata: string;
    stato: string;
    supervisore?: string;
    ultimaModifica?: string;
    totaleMovimenti: number;
    numeroTitoliCip100: number;
    numeroTitoliAltriCip: number;
    numeroRecuperiSospesi: number;
    numeroVersamentiSubagenti: number;
    numeroAltriMovimenti: number;
  };

  produzioneCip100: {
    totaleLordo: number;
    totaleIncassato: number;
    totaleSconti: number;
    totaleSospesiCreati: number;
    perModalita: {
      modalita: string;
      lordo: number;
      incassato: number;
      sconto: number;
      sospeso: number;
      numeroMovimenti: number;
    }[];
  };

  qualitaGiornata: {
    totaleSospesiCreati: number;
    totaleRecuperiSospesi: number;
    saldoSospesi: number;
    numeroSospesiCreati: number;
    numeroRecuperiSospesi: number;
    numeroPostdatati: number;
    numeroMovimentiExtra: number;
  };

  sezioni: {
    titoliCip100: ReportMovimento[];
    titoliAltriCip: ReportMovimento[];
    recuperiSospesi: ReportRecuperoSospeso[];
    versamentiSubagenti: ReportChiusuraSubagente[];
    altriMovimenti: ReportMovimento[];
  };

  cassaFisica: {
    avanzoPrecedente: number;
    totaleContanti: number;
    totaleAssegni: number;
    disponibilita: number;
    versamento: number;
    cassaTeorica: number;
  };

  quadraturaCassa?: {
    cassaTeorica: number;
    cassaReale: number;
    differenza: number;
    isQuadrata: boolean;
  };

  alert: string[];
}
