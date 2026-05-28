import { supabase } from "../supabaseClient";

export async function chiudiGiornataDb(
  giornataDbId: string,
  totals: any
) {
  return await supabase
    .from("giornate_cassa")
    .update({
      stato: "chiusa",
      cassa_finale_teorica: totals.cassa,
      versamento: totals.versamento,
      chiusa_il: new Date().toISOString(),
    })
    .eq("id", giornataDbId);
}

export async function aggiornaVersamentoDb(
  giornataDbId: string,
  value: string
) {
  return await supabase
    .from("giornate_cassa")
    .update({
      versamento: Number(value || 0),
    })
    .eq("id", giornataDbId);
}

export async function riapriGiornataDb(
  giornataDbId: string,
  motivo: string
) {
  return await supabase
    .from("giornate_cassa")
    .update({
      stato: "riaperta",
      riaperta_il: new Date().toISOString(),
      motivo_riapertura: motivo,
      ricalcolo_richiesto: true,
    })
    .eq("id", giornataDbId);
}

export async function ricalcolaAvanziDaDb(dataRiferimento: string) {
  const { data: giornate, error } = await supabase
    .from("giornate_cassa")
    .select("*")
    .gte("data_giornata", dataRiferimento)
    .order("data_giornata", { ascending: true });

  if (error || !giornate) {
    return { error, giornate: null };
  }

  let cassaFinalePrecedente: number | null = null;

  for (const giornata of giornate) {
    let avanzo = 0;

    if (cassaFinalePrecedente !== null) {
      avanzo = cassaFinalePrecedente;
    } else {
      const { data: precedente } = await supabase
        .from("giornate_cassa")
        .select("cassa_finale_teorica")
        .lt("data_giornata", giornata.data_giornata)
        .eq("stato", "chiusa")
        .order("data_giornata", { ascending: false })
        .limit(1)
        .maybeSingle();

      avanzo = Number(precedente?.cassa_finale_teorica || 0);
    }

    const { data: movimenti } = await supabase
      .from("movimenti_cassa")
      .select("*")
      .eq("giornata_id", giornata.id);

    const rows = movimenti || [];

    const incassiFisici = rows
      .filter((m) => {
        if (m.modalita_pagamento === "C") return true;

        if (
          m.modalita_pagamento === "A" &&
          m.data_assegno &&
          m.data_assegno <= giornata.data_giornata
        ) {
          return true;
        }

        return false;
      })
      .reduce(
        (sum, m) =>
          sum + Number(m.importo_netto || 0) * Number(m.segno || 1),
        0
      );

    const versamento = Number(giornata.versamento || 0);
    const nuovaCassaFinale = avanzo + incassiFisici - versamento;

    await supabase
      .from("giornate_cassa")
      .update({
        avanzo_precedente: avanzo,
        cassa_finale_teorica: nuovaCassaFinale,
        ricalcolo_richiesto: false,
      })
      .eq("id", giornata.id);

    cassaFinalePrecedente = nuovaCassaFinale;
  }

  return { error: null };
}
