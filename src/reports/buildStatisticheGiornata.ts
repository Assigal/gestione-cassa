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

  incassiModalita: {
    contanti: number;
    assegni: number;
    pos: number;
    bonifici: number;
    altri: number;
  };
  
  qualita: {
    recuperiSospesi: number;
    sospesiCreati: number;
    saldoSospesi: number;
    numeroSospesiCreati: number;
    numeroRecuperiSospesi: number;
    numeroPostdatati: number;
    numeroMovimentiExtra: number;
  };

  movimenti: {
    titoliCip100: Movimento[];
    titoliAltriCip: Movimento[];
    recuperiSospesi: Movimento[];
    versamentiSubagenti: Movimento[];
    altriMovimenti: Movimento[];
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

  const modalitaCip100 = Array.from(
    new Set(titoliCip100.map((m) => m.modalita))
  );
  
  const produzioneCip100PerModalita =
    modalitaCip100.map((modalita) => {
      const rows = titoliCip100.filter(
        (m) => m.modalita === modalita
      );
  
      return {
        modalita,
        lordo: sumBy(rows, (m) => m.importo),
        incassato: sumBy(rows, (m) => m.incassato),
        sconti: sumBy(rows, (m) => m.sconto),
        sospesi: sumBy(rows, importoSospeso),
        numeroMovimenti: rows.length,
      };
    });
  
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
      lordo: sumBy(titoliCip100, (m) => m.importo),
      incassato: sumBy(titoliCip100, (m) => m.incassato),
      sconti: sumBy(titoliCip100, (m) => m.sconto),
      sospesi: sumBy(titoliCip100, importoSospeso),
      perModalita: produzioneCip100PerModalita,
    },

    cassaFisica: {
      contanti: sumBy(
        movimenti.filter((m) => m.modalita === "C"),
        (m) => m.incassato * (m.segno || 1)
      ),
    
      assegni: sumBy(
        movimenti.filter(
          (m) => m.modalita === "A" && !m.isPostdatato
        ),
        (m) => m.incassato * (m.segno || 1)
      ),
    },

    incassiModalita: {
      contanti: sumBy(
        movimenti.filter((m) => m.modalita === "C"),
        (m) => m.incassato
      ),
    
      assegni: sumBy(
        movimenti.filter((m) => m.modalita === "A"),
        (m) => m.incassato
      ),
    
      pos: sumBy(
        movimenti.filter((m) => m.modalita === "J"),
        (m) => m.incassato
      ),
    
      bonifici: sumBy(
        movimenti.filter((m) => m.modalita === "B"),
        (m) => m.incassato
      ),
    
      altri: sumBy(
        movimenti.filter(
          (m) => !["C", "A", "J", "B"].includes(m.modalita)
        ),
        (m) => m.incassato
      ),
    },
    
    qualita: {
      recuperiSospesi: sumBy(
        recuperiSospesi,
        (m) => m.incassato
      ),
    
      sospesiCreati: sumBy(
        movimenti.filter((m) => importoSospeso(m) > 0.009),
        importoSospeso
      ),
    
      saldoSospesi:
        sumBy(
          movimenti.filter((m) => importoSospeso(m) > 0.009),
          importoSospeso
        ) -
        sumBy(recuperiSospesi, (m) => m.incassato),
      
      numeroSospesiCreati: movimenti.filter(
        (m) => importoSospeso(m) > 0.009
      ).length,
      
      numeroRecuperiSospesi: recuperiSospesi.length,
      
      numeroPostdatati: movimenti.filter(
        (m) => m.isPostdatato
      ).length,
      
      numeroMovimentiExtra:
        titoliAltriCip.length + altriMovimenti.length,
    },

    movimenti: {
      titoliCip100,
      titoliAltriCip,
      recuperiSospesi,
      versamentiSubagenti,
      altriMovimenti,
    },
    
  };

}
