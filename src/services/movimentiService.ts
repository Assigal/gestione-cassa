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

export async function aggiornaMovimentoCassaSempliceRpc(params: {
  movimentoId: string;
  movimento: any;
  audit?: any | null;
}) {
  return await supabase.rpc("aggiorna_movimento_cassa_semplice", {
    p_movimento_id: params.movimentoId,
    p_movimento: params.movimento,
    p_audit: params.audit || null,
  });
}

export async function aggiornaMovimentoCassaConSospesoRpc(params: {
  movimentoId: string;
  movimento: any;
  sospesoId: string;
  sospeso: any;
  audit?: any | null;
}) {
  return await supabase.rpc("aggiorna_movimento_cassa_con_sospeso", {
    p_movimento_id: params.movimentoId,
    p_movimento: params.movimento,
    p_sospeso_id: params.sospesoId,
    p_sospeso: params.sospeso,
    p_audit: params.audit || null,
  });
}

export async function aggiornaMovimentoCassaCreaSospesoRpc(params: {
  movimentoId: string;
  movimento: any;
  sospeso: any;
  audit?: any | null;
}) {
  return await supabase.rpc("aggiorna_movimento_cassa_crea_sospeso", {
    p_movimento_id: params.movimentoId,
    p_movimento: params.movimento,
    p_sospeso: params.sospeso,
    p_audit: params.audit || null,
  });
}

export async function aggiornaMovimentoCassaRimuoviSospesoRpc(params: {
  movimentoId: string;
  sospesoId: string;
  movimento: any;
  audit?: any | null;
}) {
  return await supabase.rpc(
    "aggiorna_movimento_cassa_rimuovi_sospeso",
    {
      p_movimento_id: params.movimentoId,
      p_movimento: params.movimento,
      p_sospeso_id: params.sospesoId,
      p_audit: params.audit || null,
    }
  );
}

export async function eliminaMovimentoCassaRpc({
  movimentoId,
  sospesoId,
  allocazioniRecupero,
  audit,
}: {
  movimentoId: string;
  sospesoId?: string | null;
  allocazioniRecupero?: any[];
  audit?: any;
}) {
  return await supabase.rpc("elimina_movimento_cassa", {
    p_movimento_id: movimentoId,
    p_sospeso_id: sospesoId || null,
    p_allocazioni_recupero: allocazioniRecupero || [],
    p_audit: audit || null,
  });
}
