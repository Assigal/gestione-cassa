import { supabase } from "../supabaseClient";

export async function caricaQuadratureDb(giornataDbId: string) {
  return await supabase
    .from("quadrature_cassa")
    .select("*")
    .eq("giornata_id", giornataDbId)
    .order("bloccata_il", { ascending: false });
}
