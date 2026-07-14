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

function percentuale(valore: number, base: number): number {
  if (!base || base <= 0) return 0;
  return (valore / base) * 100;
}

export function buildCassaGiornataReport({
  movimenti,
  sospesi,
  dataGiornata,
  statoGiornata,
  supervisore,
  ultimaModifica,
  cassaFisicaIniziale,
  versamento,
  quadraturaCassa,
}: BuildReportParams): CassaGiornataReport {
  const stats = buildStatisticheGiornata(
    movimenti,
    sospesi
  );

  const cassaDisponibile =
    cassaFisicaIniziale +
    stats.cassaFisica.contanti +
    stats.cassaFisica.assegni;

  const cassaTeorica =
    cassaDisponibile - versamento;

  const numeroTitoliCip100 = stats.movimenti.titoliCip100.length;

  const totaleLordoRecuperiSospesi =
    stats.movimenti.recuperiSospesi.reduce(
      (sum, row) => sum + Number(row.importo || 0),
      0
    );

  const totaleScontiRecuperiSospesi =
    stats.movimenti.recuperiSospesi.reduce(
      (sum, row) => sum + Number(row.sconto || 0),
      0
    );

  const baseSconti =
    stats.produzioneCip100.lordo + totaleLordoRecuperiSospesi;

  const totaleScontiGiornata =
    stats.produzioneCip100.sconti + totaleScontiRecuperiSospesi;

  return {
    header: {
      dataGiornata,
      stato: statoGiornata,
      supervisore,
      ultimaModifica,
      totaleMovimenti: stats.conteggi.totaleMovimenti,
      numeroTitoliCip100: stats.conteggi.titoliCip100,
      numeroTitoliAltriCip: stats.conteggi.titoliAltriCip,
      numeroRecuperiSospesi: stats.conteggi.recuperiSospesi,
      numeroVersamentiSubagenti: stats.conteggi.versamentiSubagenti,
      numeroAltriMovimenti: stats.conteggi.altriMovimenti,
    },

    produzioneCip100: {
      totaleLordo: stats.produzioneCip100.lordo,
      totaleIncassato: stats.produzioneCip100.incassato,
      totaleSconti: stats.produzioneCip100.sconti,
      totaleSospesiCreati: stats.produzioneCip100.sospesi,

      mediaPerTitolo:
        numeroTitoliCip100 > 0
          ? stats.produzioneCip100.lordo / numeroTitoliCip100
          : 0,

      incidenzaSospesi: percentuale(
        stats.produzioneCip100.sospesi,
        stats.produzioneCip100.lordo
      ),

      incidenzaSconti: percentuale(
        totaleScontiGiornata,
        baseSconti
      ),

      perModalita: stats.produzioneCip100.perModalita.map((row) => ({
        modalita: row.modalita,
        lordo: row.lordo,
        incassato: row.incassato,
        sconto: row.sconti,
        sospeso: row.sospesi,
        numeroMovimenti: row.numeroMovimenti,
      })),
    },

    qualitaGiornata: {
      totaleSospesiCreati: stats.qualita.sospesiCreati,
      totaleRecuperiSospesi: stats.qualita.recuperiSospesi,
      saldoSospesi: stats.qualita.saldoSospesi,
      numeroSospesiCreati: stats.qualita.numeroSospesiCreati,
      numeroRecuperiSospesi: stats.qualita.numeroRecuperiSospesi,
      numeroPostdatati: stats.qualita.numeroPostdatati,
      numeroMovimentiExtra: stats.qualita.numeroMovimentiExtra,
    },

    cassaFisica: {
      avanzoPrecedente: cassaFisicaIniziale,
      totaleContanti: stats.cassaFisica.contanti,
      totaleAssegni: stats.cassaFisica.assegni,
      disponibilita: cassaDisponibile,
      versamento,
      cassaTeorica,
    },

    quadraturaCassa,

    sezioni: {
      titoliCip100: stats.movimenti.titoliCip100.map(toReportMovimento),
      titoliAltriCip: stats.movimenti.titoliAltriCip.map(toReportMovimento),
      recuperiSospesi: stats.movimenti.recuperiSospesi.map(
        (m): ReportRecuperoSospeso => ({
          ...toReportMovimento(m),
          dataOrigineSospeso: "",
        })
      ),
      versamentiSubagenti: stats.movimenti.versamentiSubagenti.map(
        (m): ReportChiusuraSubagente => ({
          id: String(m.id),
          ora: m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          cip: m.sub || "",
          periodoDal: m.dataInizioSubagente || "",
          periodoAl: m.dataFineSubagente || "",
          importo: m.incassato,
          modalitaPagamento: m.modalita,
          utente: m.createdByEmail || "",
          note: m.note || "",
        })
      ),
      altriMovimenti: stats.movimenti.altriMovimenti.map(toReportMovimento),
    },

    alert: [],
  };
}
