import { supabase } from "../supabaseClient";

export async function caricaSospesiDb() {
  return await supabase
    .from("sospesi_cassa")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function creaSospesoDb(payloadDb: any) {
  return await supabase
    .from("sospesi_cassa")
    .insert(payloadDb)
    .select()
    .single();
}

export async function aggiornaSospesoDb(
  id: string,
  payloadDb: any
) {
  return await supabase
    .from("sospesi_cassa")
    .update(payloadDb)
    .eq("id", id);
}

export async function eliminaSospesoDb(id: string) {
  return await supabase
    .from("sospesi_cassa")
    .delete()
    .eq("id", id);
}

export async function creaStoricoSospesoDb(payloadDb: any) {
  return await supabase
    .from("sospesi_movimenti")
    .insert(payloadDb)
    .select("id")
    .single();
}

export async function creaStoricoSospesiBulkDb(rows: any[]) {
  return await supabase
    .from("sospesi_movimenti")
    .insert(rows);
}

export async function collegaStoricoOrigineAMovimentoDb(
  movimentoId: number,
  giornataCorrente: string,
  importo: number
) {
  return await supabase
    .from("sospesi_movimenti")
    .update({
      movimento_cassa_id: movimentoId,
    })
    .eq("tipo", "origine")
    .eq("data_movimento", giornataCorrente)
    .eq("importo", importo)
    .is("movimento_cassa_id", null);
}
