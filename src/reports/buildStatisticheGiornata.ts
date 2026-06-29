import type {
  Movimento,
  Sospeso,
} from "../types";

function sumBy<T>(
  rows: T[],
  selector: (row: T) => number
): number {
  return rows.reduce(
    (sum, row) => sum + selector(row),
    0
  );
}

function normalizeCip(cip: string | number | undefined | null): string {
  return String(cip || "").trim();
}

function importoSospeso(m: {
  importo: number;
  sconto: number;
  incassato: number;
}): number {
  return Math.max(
    Number(m.importo || 0) -
      Number(m.sconto || 0) -
      Number(m.incassato || 0),
    0
  );
}

export interface StatisticheGiornata {
  conteggi: {
    totaleMovimenti: number;
    titoliCip100: number;
    titoliAltriCip: number;
    recuperiSospesi: number;
    versamentiSubagenti: number;
    altriMovimenti: number;
    sospesiCreati: number;
    postdatati: number;
  };

  produzioneCip100: {
    lordo: number;
    incassato: number;
    sconti: number;
    sospesi: number;
    perModalita: {
      modalita: string;
      lordo: number;
      incassato: number;
      sconti: number;
      sospesi: number;
      numeroMovimenti: number;
    }[];
  };

  cassaFisica: {
    contanti: number;
    assegni: number;
  };

  qualita: {
    recuperiSospesi: number;
    sospesiCreati: number;
    saldoSospesi: number;
  };
}

export function buildStatisticheGiornata(
  movimenti: Movimento[],
  sospesi: Sospeso[]
): StatisticheGiornata {

  const titoliCip100 = movimenti.filter(
    (m) =>
      m.tipo === "Titolo del giorno" &&
      normalizeCip(m.sub) === "100"
  );
  
  const titoliAltriCip = movimenti.filter(
    (m) =>
      m.tipo === "Titolo del giorno" &&
      normalizeCip(m.sub) !== "100"
  );
  
  const recuperiSospesi = movimenti.filter(
    (m) => m.tipo === "Recupero sospeso"
  );
  
  const versamentiSubagenti = movimenti.filter(
    (m) => m.tipo === "Versamento subagente"
  );
  
  const altriMovimenti = movimenti.filter(
    (m) =>
      m.tipo !== "Titolo del giorno" &&
      m.tipo !== "Recupero sospeso" &&
      m.tipo !== "Versamento subagente"
  );
  return {
    conteggi: {
      totaleMovimenti: movimenti.length,
      titoliCip100: titoliCip100.length,
      titoliAltriCip: titoliAltriCip.length,
      recuperiSospesi: recuperiSospesi.length,
      versamentiSubagenti: versamentiSubagenti.length,
      altriMovimenti: altriMovimenti.length,
      sospesiCreati: movimenti.filter((m) => importoSospeso(m) > 0.009).length,
      postdatati: movimenti.filter((m) => m.isPostdatato).length,
    },

    produzioneCip100: {
      lordo: 0,
      incassato: 0,
      sconti: 0,
      sospesi: 0,
      perModalita: [],
    },

    cassaFisica: {
      contanti: 0,
      assegni: 0,
    },

    qualita: {
      recuperiSospesi: 0,
      sospesiCreati: 0,
      saldoSospesi: 0,
    },
  };

}
