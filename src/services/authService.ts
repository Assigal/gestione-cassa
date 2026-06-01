import { supabase } from "../supabaseClient";

export async function loginDb(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function logoutDb() {
  return await supabase.auth.signOut();
}

export async function caricaProfiloUtenteDb(userId: string) {
  return await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
}
