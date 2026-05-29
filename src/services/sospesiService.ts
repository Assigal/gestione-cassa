import { supabase } from "../supabaseClient";

export async function caricaSospesiDb() {
  return await supabase
    .from("sospesi_cassa")
    .select("*")
    .order("created_at", { ascending: false });
}
