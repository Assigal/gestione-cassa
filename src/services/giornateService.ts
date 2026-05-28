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
