import type {
  Movimento,
  Sospeso,
} from "../types";

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

  return {
    conteggi: {
      totaleMovimenti: 0,
      titoliCip100: 0,
      titoliAltriCip: 0,
      recuperiSospesi: 0,
      versamentiSubagenti: 0,
      altriMovimenti: 0,
      sospesiCreati: 0,
      postdatati: 0,
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
