import { supabase } from "../supabaseClient";

export async function eliminaMovimentoDb(id: number) {
  return await supabase
    .from("movimenti_cassa")
    .delete()
    .eq("id", id);
}

export async function salvaMovimentoDb(payloadDb: any) {
  return await supabase
    .from("movimenti_cassa")
    .insert(payloadDb)
    .select("id")
    .single();
}

export async function aggiornaMovimentoDb(
  id: number,
  payloadDb: any
) {
  return await supabase
    .from("movimenti_cassa")
    .update(payloadDb)
    .eq("id", id);
}

export async function caricaMovimentiDb(giornataDbId: string) {
  return await supabase
    .from("movimenti_cassa")
    .select("*")
    .eq("giornata_id", giornataDbId)
    .order("created_at", { ascending: false });
}

export async function caricaRecuperiStoricoDb() {
  return await supabase
    .from("sospesi_movimenti")
    .select("*")
    .eq("tipo", "recupero");
}

export async function registraMovimentoCassaRpc(params: {
  movimento: any;
  nuovoSospeso?: any | null;
  storicoSospesi?: any[];
  sospesiDaAggiornare?: any[];
  audit?: any | null;
}) {
  return await supabase.rpc("registra_movimento_cassa", {
    p_movimento: params.movimento,
    p_nuovo_sospeso: params.nuovoSospeso || null,
    p_storico_sospesi: params.storicoSospesi || [],
    p_sospesi_da_aggiornare: params.sospesiDaAggiornare || [],
    p_audit: params.audit || null,
  });
}
