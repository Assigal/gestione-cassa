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
