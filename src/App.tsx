// ======================================================
// 01 - IMPORTS / DIPENDENZE
// ======================================================

import React, { useEffect, useMemo, useRef, useState } from "react";

import { FormMovimento } from "./components/FormMovimento";
import { TabellaMovimenti } from "./components/TabellaMovimenti";
import { ImportCompagnia } from "./components/ImportCompagnia";
import { SospesiRecuperi } from "./components/SospesiRecuperi";
import { ReportPanel } from "./components/ReportPanel";
import { LoginPanel } from "./components/LoginPanel";
import { SidebarOperativa } from "./components/SidebarOperativa";
import { SidebarMetric } from "./components/SidebarMetric";
import { Badge } from "./components/Badge";

import type { Movimento, Sospeso, FormState, ImportRow, AllocazioneRecupero } from "./types";
import { tipiMovimento } from "./constants";
import { euro, deltaLabel } from "./formatters";
import { emptyForm } from "./formDefaults";
import { numeroPolizzaCompleto, descrizioneMovimento, isAssegnoPostdatato, isVersamentoSubagente, getDescrizioneModalita } from "./utils";
import { normalizzaModalitaPagamento } from "./importUtils";
import { stampaModuloSospeso, stampaModuloAbbuono } from "./printUtils";
import {buildReferentePayload, buildMovimentoPayload, buildMovimentoUpdatePayload, buildSospesoPayload,} from "./payloadBuilders";

import { supabase } from "./supabaseClient";

// ======================================================
// 02 - COSTANTI / TIPI / INTERFACCE
// ======================================================

const GIORNATA_CORRENTE = new Date().toISOString().slice(0, 10);

const movimentiRegistratiSeed: Movimento[] = [];
const sospesiSeed: Sospeso[] = [];
const importCompagniaSeed: ImportRow[] = [];

// ======================================================
// 04 - COMPONENTI UI RIUTILIZZABILI
// ======================================================

export default function GestioneCassa() {
  
  // ======================================================
  // 05 - STATE / REFS
  // ======================================================
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<any>(null);
  const [profiloUtente, setProfiloUtente] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [modalitaPagamento, setModalitaPagamento] = useState<any[]>([]);
  const [referentiSospesi, setReferentiSospesi] = useState<any[]>([]);

  // ======================================================
  // 06 - AUTENTICAZIONE / SESSIONE UTENTE
  // ======================================================
  
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
    
      if (data.session?.user?.id) {
        await caricaProfiloUtente(data.session.user.id);
      }
    
      setAuthLoading(false);
    });
  
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session?.user?.id) {
        caricaProfiloUtente(session.user.id);
      } else {
        setProfiloUtente(null);
      }
    });
  
    return () => subscription.unsubscribe();
    }, []);

  // ======================================================
  // 07 - CONFIGURAZIONI DA DATABASE
    // referenti_sospesi
    // modalita_pagamento
  // ======================================================
  
  useEffect(() => {
      if (!session) return;
      const caricaModalitaPagamento = async () => {
        const { data, error } = await supabase
        .from("modalita_pagamento")
        .select("*");
    
        if (error) {
          console.error("Errore caricamento modalità pagamento:", error);
          return;
        }
    
        setModalitaPagamento(data || []);
        
      };
    
      caricaModalitaPagamento();
    }, [session]);

  useEffect(() => {   
    if (!session) return; 
      const caricaReferentiSospesi = async () => {
        const { data, error } = await supabase
          .from("referenti_sospesi")
          .select("*")
          .eq("attivo", true)
          .order("nome");
    
        if (error) {
          console.error("Errore caricamento referenti sospesi:", error);
          return;
        }
    
        setReferentiSospesi(data || []);
      };
    
      caricaReferentiSospesi();
    }, [session]);

  // ======================================================
  // 08 - MODALITÀ PAGAMENTO / MAPPING
  // ======================================================

    const getReferenteById = (id: string | null | undefined) => {
      return (
        referentiSospesi.find((r) => r.id === id) || null
      );
    };

    const getNomeReferente = (
      id: string | null | undefined,
      fallback?: string | null
    ) => {
      const referente = getReferenteById(id);
    
      return referente?.nome || fallback || "";
    };
  
   const getModalitaByCodice = (
      codice: string | null | undefined
    ) => {
      return (
        modalitaPagamento.find(
          (m) => m.codice === codice
        ) || null
      );
    };

  // ======================================================
  // 09 - STATE OPERATIVO CASSA
  // ======================================================
  
    const [giornataCorrente, setGiornataCorrente] = useState(
      localStorage.getItem("gestione-cassa-data-corrente") || GIORNATA_CORRENTE
    );
    const [giornataDbId, setGiornataDbId] = useState<string | null>(null);
    const [movimenti, setMovimenti] = useState<Movimento[]>(movimentiRegistratiSeed);
    const [sospesi, setSospesi] = useState<Sospeso[]>(sospesiSeed);
    const [importCompagnia, setImportCompagnia] = useState<ImportRow[]>(importCompagniaSeed);
    const [selectedImport, setSelectedImport] = useState<string | null>(null);
    const [editingMovement, setEditingMovement] = useState<number | null>(null);
    const [selectedSospesoIds, setSelectedSospesoIds] = useState<string[]>([]);
    const [versamento, setVersamento] = useState("700");
    const [quadMezza, setQuadMezza] = useState({ cassaReale: "" });
    const [quadSera, setQuadSera] = useState({ cassaReale: "" });
    const [quadMezzaBloccata, setQuadMezzaBloccata] = useState<{
      cassaTeorica: number;
      cassaReale: number;
      squadratura: number;
      dataOra: string;
    } | null>(null);

    const [quadSeraBloccata, setQuadSeraBloccata] = useState<{
      cassaTeorica: number;
      cassaReale: number;
      squadratura: number;
      dataOra: string;
    } | null>(null);
    const [searchSospesi, setSearchSospesi] = useState("");
    const [form, setForm] = useState<FormState>(emptyForm);
    const [auditLog, setAuditLog] = useState<string[]>([]);
    const [sogliaStampaAbbuono, setSogliaStampaAbbuono] = useState(3);
    const [giornataChiusa, setGiornataChiusa] = useState(false);
    const isAdmin = profiloUtente?.ruolo === "admin";
    const canManageMovimento = (movimento: Movimento) => {
      if (isAdmin) return true;
      if (profiloUtente?.ruolo === "supervisor") return true;
        return movimento.createdByEmail === session?.user?.email;
      };

// ======================================================
// 10 - LOGICA BUSINESS CASSA
// ======================================================

async function caricaProfiloUtente(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error(error);
    alert("Profilo utente non trovato.");
    return;
  }

  setProfiloUtente(data);
}
async function login() {
  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password: loginPassword,
  });

  if (error) {
    alert("Login non riuscito: " + error.message);
  }
}

async function logout() {
  await supabase.auth.signOut();
}
  
async function addAuditLog(azione: string) {
  const utente =
    session?.user?.email ||
    session?.user?.user_metadata?.full_name ||
    "Utente sconosciuto";

  setAuditLog((rows) => [
      `${new Date().toLocaleString("it-IT")} - ${utente} - ${azione}`,
      ...rows,
    ]);
  
    if (!giornataDbId) return;
  
    const { error } = await supabase.from("audit_log").insert({
      giornata_id: giornataDbId,
      azione,
      utente_id: null,
      dettaglio: {
        data_giornata: giornataCorrente,
        utente_email: utente,
      },
    });
  
    if (error) {
      console.error(error);
      alert("Errore salvataggio audit: " + error.message);
    }
  }

  const [avanzoPrecedente, setAvanzoPrecedente] = useState(0);
  
  useEffect(() => {
    
  async function caricaOCreaGiornata() {
    const { data: giornataEsistente, error: selectError } = await supabase
      .from("giornate_cassa")
      .select("*")
      .eq("data_giornata", giornataCorrente)
      .maybeSingle();

    if (selectError) {
      console.error(selectError);
      alert("Errore nel caricamento giornata da Supabase");
      return;
    }

   if (giornataEsistente) {
      setGiornataDbId(giornataEsistente.id);
      setGiornataChiusa(giornataEsistente.stato === "chiusa");
      setAvanzoPrecedente(Number(giornataEsistente.avanzo_precedente || 0));
      setVersamento(String(giornataEsistente.versamento || 0));
      return;
    }

    const { data: ultimaGiornataChiusa } = await supabase
      .from("giornate_cassa")
      .select("cassa_finale_teorica")
      .lt("data_giornata", giornataCorrente)
      .eq("stato", "chiusa")
      .order("data_giornata", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const avanzoCalcolato = Number(ultimaGiornataChiusa?.cassa_finale_teorica || 0);
    
    const { data: nuovaGiornata, error: insertError } = await supabase
      .from("giornate_cassa")
      .insert({
        data_giornata: giornataCorrente,
        stato: "aperta",
        avanzo_precedente: avanzoCalcolato,
      })
      
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      alert("Errore nella creazione giornata su Supabase");
      return;
    }

    setGiornataDbId(nuovaGiornata.id);
    setGiornataChiusa(false);
    setAvanzoPrecedente(avanzoCalcolato);
  }

  caricaOCreaGiornata();
}, [giornataCorrente]);
  useEffect(() => {
    localStorage.setItem("gestione-cassa-data-corrente", giornataCorrente);
  }, [giornataCorrente]);
 
  useEffect(() => {
    const saved = localStorage.getItem(`gestione-cassa-${giornataCorrente}`);

    if (giornataDbId) return;

    if (!saved) {
      setMovimenti([]);
      setImportCompagnia([]);
      setVersamento("0");
      setQuadMezza({ cassaReale: "" });
      setQuadSera({ cassaReale: "" });
      setQuadMezzaBloccata(null);
      setQuadSeraBloccata(null);
      setAuditLog([]);
      setSelectedImport(null);
      setEditingMovement(null);
      setSelectedSospesoIds([]);
      setForm(emptyForm);
      return;
    }

  try {
    const data = JSON.parse(saved);

    if (data.movimenti) setMovimenti(data.movimenti);
    if (data.sospesi) setSospesi(data.sospesi);
    if (data.importCompagnia) setImportCompagnia(data.importCompagnia);
    if (data.versamento) setVersamento(data.versamento);
    if (data.quadMezza) setQuadMezza(data.quadMezza);
    if (data.quadSera) setQuadSera(data.quadSera);
    if (data.quadMezzaBloccata) setQuadMezzaBloccata(data.quadMezzaBloccata);
    if (data.quadSeraBloccata) setQuadSeraBloccata(data.quadSeraBloccata);
    if (data.auditLog) setAuditLog(data.auditLog);
    if (typeof data.giornataChiusa === "boolean") {
      setGiornataChiusa(data.giornataChiusa);
    }
  } catch {
    console.warn("Dati locali non leggibili");
  }
}, [giornataCorrente, giornataDbId]);

useEffect(() => {
  const data = {
    movimenti,
    sospesi,
    importCompagnia,
    versamento,
    quadMezza,
    quadSera,
    quadMezzaBloccata,
    quadSeraBloccata,
    auditLog,
    giornataChiusa
  };

  localStorage.setItem(
    `gestione-cassa-${giornataCorrente}`,
    JSON.stringify(data)
  );
}, [
  movimenti,
  sospesi,
  importCompagnia,
  versamento,
  quadMezza,
  quadSera,
  quadMezzaBloccata,
  quadSeraBloccata,
  auditLog,
  giornataChiusa
]);
  
 useEffect(() => {
  async function caricaMovimentiDaSupabase() {
    if (!giornataDbId) return;

    const { data, error } = await supabase
      .from("movimenti_cassa")
      .select("*")
      .eq("giornata_id", giornataDbId)
      .order("created_at", { ascending: false });
    
    const { data: recuperiStorico } = await supabase
      .from("sospesi_movimenti")
      .select("*")
      .eq("tipo", "recupero");

    const recuperiByMovimento = new Map<string, AllocazioneRecupero[]>();
    
    (recuperiStorico || []).forEach((row) => {
      if (!row.movimento_cassa_id || !row.sospeso_id) return;
    
      const current = recuperiByMovimento.get(row.movimento_cassa_id) || [];
    
      current.push({
        sospesoId: row.sospeso_id,
        incasso: Number(row.importo || 0),
        sconto: 0,
      });
    
      recuperiByMovimento.set(row.movimento_cassa_id, current);
    });

    if (error) {
      console.error(error);
      return;
    }

    const movimentiDb: Movimento[] = (data || []).map((row) => ({
        id: row.id,
        ramo: row.ramo || "",
        polizza: row.polizza || "",
        contraente: row.contraente || "",
        referenteSospesi: row.referente_sospesi || "",
        referenteSospesiId: row.referente_sospesi_id || "",
        importo: Number(row.importo_lordo || 0),
        sconto: Number(row.sconto || 0),
        netto: Number(row.importo_netto || 0),
        modalita: row.modalita_pagamento || "C",
        tipo: row.tipo_movimento || "Titolo del giorno",
        sub: row.codice_subagenzia || "100",
        dataAssegno: row.data_assegno || "",
        segno: Number(row.segno || 1),
        note: row.note || "",
        createdByEmail: row.created_by_email || "",
        updatedByEmail: row.updated_by_email || "",
        updatedAt: row.updated_at || "",
        dataInizioSubagente: row.data_inizio_subagente || "",
        dataFineSubagente: row.data_fine_subagente || "",
        allocazioniRecupero:
          recuperiByMovimento.get(String(row.id)) || [],
      }));

    setMovimenti(movimentiDb);
  }

  caricaMovimentiDaSupabase();

  const interval = setInterval(() => {
    caricaMovimentiDaSupabase();
  }, 30000);

  return () => clearInterval(interval);
}, [giornataDbId]);
    
      useEffect(() => {
      async function caricaQuadratureDaSupabase() {
        if (!giornataDbId) return;
    
        const { data, error } = await supabase
          .from("quadrature_cassa")
          .select("*")
          .eq("giornata_id", giornataDbId)
          .order("bloccata_il", { ascending: false });
    
        if (error) {
          console.error(error);
          alert("Errore caricamento quadrature da Supabase");
          return;
        }
    
        const quadrature = data || [];
    
        const mezza = quadrature.find((q) => q.tipo === "mezza_giornata");
        const sera = quadrature.find((q) => q.tipo === "fine_giornata");
    
        setQuadMezzaBloccata(
          mezza
            ? {
                cassaTeorica: Number(mezza.cassa_teorica || 0),
                cassaReale: Number(mezza.cassa_reale || 0),
                squadratura: Number(mezza.squadratura || 0),
                dataOra: mezza.bloccata_il
                  ? new Date(mezza.bloccata_il).toLocaleString("it-IT")
                  : "",
              }
            : null
        );

    setQuadSeraBloccata(
      sera
        ? {
            cassaTeorica: Number(sera.cassa_teorica || 0),
            cassaReale: Number(sera.cassa_reale || 0),
            squadratura: Number(sera.squadratura || 0),
            dataOra: sera.bloccata_il
              ? new Date(sera.bloccata_il).toLocaleString("it-IT")
              : "",
          }
        : null
    );
  }

  caricaQuadratureDaSupabase();
}, [giornataDbId]);
  
  useEffect(() => {
    async function caricaSospesiDaSupabase() {
      const { data, error } = await supabase
        .from("sospesi_cassa")
        .select("*")
        .order("created_at", { ascending: false });
  
      if (error) {
        console.error(error);
        alert("Errore caricamento sospesi da Supabase");
        return;
      }
  
      const sospesiDb: Sospeso[] = (data || []).map((row) => ({
        id: row.id,
        referenteSospesi: row.referente_sospesi || "",
        referenteSospesiId: row.referente_sospesi_id || "",
        contraente: row.contraente || "",
        ramo: row.ramo || "",
        polizza: row.polizza || "",
        importoOriginario: Number(row.importo_originario || 0),
        recuperato: Number(row.recuperato || 0),
        scontoApplicato: Number(row.sconto_applicato || 0),
        residuo: Number(row.residuo || 0),
        stato: row.stato || "Aperto",
        dataSospeso: row.data_sospeso || "",
        note: row.note || "",
      }));
  
      setSospesi(sospesiDb);
    }
  
    caricaSospesiDaSupabase();
  }, [giornataDbId]);

  useEffect(() => {
    async function caricaConfigurazioneSistema() {
      const { data, error } = await supabase
        .from("configurazione_sistema")
        .select("valore")
        .eq("chiave", "soglia_stampa_abbuono")
        .maybeSingle();
  
      if (error) {
        console.error(error);
        return;
      }
  
      if (data?.valore) {
        setSogliaStampaAbbuono(Number(data.valore));
      }
    }
  
    caricaConfigurazioneSistema();
  }, []);

  const totals = useMemo(() => {
    const totaleCompagnia = movimenti
      .filter((m) => m.tipo === "Titolo del giorno" && m.sub === "100")
      .reduce((sum, m) => sum + m.importo, 0);

    const incassiFisici = movimenti
      .filter((m) => {
        if (m.modalita === "C") return true;
        if (
          m.modalita === "A" &&
          !isAssegnoPostdatato(m, giornataCorrente)
        ) {
          return true;
        }
    
        return false;
      })
      .reduce((sum, m) => sum + m.netto * (m.segno || 1), 0);
    
    const totaleSospesi = movimenti
      .filter(
        (m) =>
          m.tipo === "Titolo del giorno" &&
          (m.modalita === "S" || isAssegnoPostdatato(m, giornataCorrente))
      )
  .reduce((sum, m) => sum + m.importo, 0);
    const totaleRecuperi = movimenti
      .filter((m) => m.tipo === "Recupero sospeso")
      .reduce((sum, m) => sum + m.netto, 0);
    const vers = Number(versamento || 0);
    const cassa = avanzoPrecedente + incassiFisici - vers;

    return {
      totaleCompagnia,
      cassa,
      incassiFisici,
      totaleSospesi,
      totaleRecuperi,
      versamento: vers,
      daLavorare: importCompagnia.length,
      squadraturaMezza: Number(quadMezza.cassaReale || 0) - cassa,
      squadraturaSera: Number(quadSera.cassaReale || 0) - cassa,
    };
  }, [movimenti, sospesi, importCompagnia, versamento, quadMezza, quadSera]);

  const sospesiFiltrati = useMemo(() => {
    const q = searchSospesi.toLowerCase().trim();
    const aperti = sospesi.filter((s) => s.stato !== "Chiuso" && s.residuo > 0);
    if (!q) return aperti;
    return aperti.filter((s) =>
      [s.referenteSospesi, s.contraente, s.polizza, s.ramo].join(" ").toLowerCase().includes(q)
    );
  }, [sospesi, searchSospesi]);

  function resetForm() {
    setForm(emptyForm);
  }

  function handleTipoMovimentoChange(tipo: string) {
    if (isVersamentoSubagente(tipo)) {
      setForm({
        ...form,
        tipo,
        ramo: "",
        polizza: "",
        contraente: "",
        referenteSospesi: "",
        sconto: "0",
      });
      return;
    }
    setForm({ ...form, tipo });
  }

  // ======================================================
  // 12 - GESTIONE MOVIMENTI CASSA
  // ======================================================
  
  function selectImported(row: ImportRow) {
    setSelectedImport(row.id);
    setEditingMovement(null);
    setSelectedSospesoIds([]);
    setForm({
      ...emptyForm,
      ramo: row.ramo,
      polizza: row.polizza,
      contraente: row.contraente,
      referenteSospesi: row.contraente,
      importo: String(row.importo),
      modalita: normalizzaModalitaPagamento(row.modalitaCompagnia),
      sub: row.sub || "100",
      tipo: "Titolo del giorno",
    });
  }

  async function deleteMovement(id: number) {
    const movimento = movimenti.find((row) => row.id === id);
    if (movimento && !canManageMovimento(movimento)) {
      alert("Puoi cancellare solo i movimenti inseriti da te.");
      return;
    }
    if (movimento?.tipo === "Recupero sospeso" && movimento.allocazioniRecupero?.length) {
      setSospesi((rows) => rows.map((s) => {
        const allocazione = movimento.allocazioniRecupero.find((a) => a.sospesoId === s.id);
        if (!allocazione) return s;
        const nuovoRecuperato = Math.max(0, s.recuperato - allocazione.incasso);
        const nuovoSconto = Math.max(0, s.scontoApplicato - allocazione.sconto);
        const nuovoResiduo = s.importoOriginario - nuovoRecuperato - nuovoSconto;
        return {
          ...s,
          recuperato: nuovoRecuperato,
          scontoApplicato: nuovoSconto,
          residuo: nuovoResiduo,
          stato: nuovoResiduo === s.importoOriginario ? "Aperto" : "Parziale",
          note: s.note || "Recupero annullato",
        };
      }));
    }

   if (
      movimento &&
      movimento.tipo === "Titolo del giorno" &&
      (movimento.modalita === "S" ||
        isAssegnoPostdatato(movimento, giornataCorrente))
    ) {
      setSospesi((rows) =>
        rows.filter((s) => s.polizza !== movimento.polizza)
      );
    }
    setMovimenti((rows) => rows.filter((row) => row.id !== id));
    if (giornataDbId) {
      const { error } = await supabase
        .from("movimenti_cassa")
        .delete()
        .eq("id", id);
    
      if (error) {
        console.error(error);
        alert("Movimento eliminato localmente, ma non eliminato da Supabase.");
      }
    }
  }

  function deleteImportedMovement(id: string) {
    if (selectedImport === id) {
      setSelectedImport(null);
      resetForm();
    }
    setImportCompagnia((rows) => rows.filter((row) => row.id !== id));
  }

  function editMovement(row: Movimento) {
    if (!canManageMovimento(row)) {
      alert("Puoi modificare solo i movimenti inseriti da te.");
      return;
    }
    setEditingMovement(row.id);
    setSelectedImport(null);
    setSelectedSospesoIds([]);
    setForm({
      ...emptyForm,
      ramo: row.ramo,
      polizza: row.polizza,
      contraente: row.contraente,
      referenteSospesi: row.referenteSospesi || row.contraente,
      referenteSospesiId: row.referenteSospesiId || "",
      importo: String(row.importo),
      sconto: String(row.sconto || 0),
      modalita: row.modalita,
      dataAssegno: row.dataAssegno || "",
      sub: row.sub,
      tipo: row.tipo,
      note: row.note || "",
      dataInizioSubagente: row.dataInizioSubagente || "",
      dataFineSubagente: row.dataFineSubagente || "",
    });
  }

  // ======================================================
  // 13 - GESTIONE SOSPESI / RECUPERI
  // ======================================================
  
  function toggleSospeso(id: string) {
    setSelectedSospesoIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }

  function prepareRecuperoSospesi() {
    const selected = sospesi.filter((s) => selectedSospesoIds.includes(s.id));
    if (!selected.length) return;
    const referente = selected[0].referenteSospesi;
    const importo = selected.reduce((sum, s) => sum + s.residuo, 0);
    const noteRecupero = selected
      .map((s) => `Polizza ${numeroPolizzaCompleto(s)}`)
      .join(", ");
    setSelectedImport(null);
    setEditingMovement(null);
    setForm({
      ...emptyForm,
      ramo: selected.length === 1 ? selected[0].ramo : "",
      polizza: selected.length === 1 ? selected[0].polizza : "Recupero multiplo",
      contraente: selected.length === 1 ? selected[0].contraente : referente,
      referenteSospesi: referente,
      importo: String(importo),
      modalita: "C",
      sub: "100",
      tipo: "Recupero sospeso",
      note: noteRecupero,    });
  }

  function applyRecuperoToSospesi(importoIncassato: number, scontoApplicato: number, note: string) {
    let incassoDaRipartire = importoIncassato;
    let scontoDaRipartire = scontoApplicato;
    const allocazioni: AllocazioneRecupero[] = [];

    const updatedSospesi = sospesi.map((s) => {
      if (!selectedSospesoIds.includes(s.id)) return s;

      const quotaIncasso = Math.min(s.residuo, incassoDaRipartire);
      incassoDaRipartire -= quotaIncasso;

      const residuoDopoIncasso = s.residuo - quotaIncasso;
      const quotaSconto = Math.min(residuoDopoIncasso, scontoDaRipartire);
      scontoDaRipartire -= quotaSconto;

      const totaleChiusura = quotaIncasso + quotaSconto;
      const nuovoRecuperato = s.recuperato + quotaIncasso;
      const nuovoSconto = s.scontoApplicato + quotaSconto;
      const nuovoResiduo = Math.max(0, s.importoOriginario - nuovoRecuperato - nuovoSconto);

      if (totaleChiusura > 0) {
        allocazioni.push({ sospesoId: s.id, incasso: quotaIncasso, sconto: quotaSconto });
      }

      return {
        ...s,
        recuperato: nuovoRecuperato,
        scontoApplicato: nuovoSconto,
        residuo: nuovoResiduo,
        stato: nuovoResiduo === 0 ? "Chiuso" : "Parziale",
        note: note || s.note,
      };
    });

    return { updatedSospesi, allocazioni };
  }

  async function saveForm() {
    const importo = Number(form.importo || 0);
    if (!form.importo || importo === 0) {
      alert("Inserire un importo valido diverso da zero.");
      return;
    }
    const sconto = isVersamentoSubagente(form.tipo) ? 0 : Number(form.sconto || 0);
    const netto = importo - sconto;

    const payload = {
      ramo: isVersamentoSubagente(form.tipo) ? "" : form.ramo,
      polizza: isVersamentoSubagente(form.tipo) ? "" : form.polizza,
      contraente: isVersamentoSubagente(form.tipo) ? "" : form.contraente,
      referenteSospesi: isVersamentoSubagente(form.tipo) ? "" : (form.referenteSospesi || form.contraente),
      referenteSospesiId: isVersamentoSubagente(form.tipo) ? "" : form.referenteSospesiId,
      importo,
      sconto,
      netto,
      modalita: form.modalita,
      dataAssegno: form.dataAssegno,
      tipo: form.tipo,
      sub: form.sub,
      segno: 1,
      note: form.note || "",
      dataInizioSubagente: form.dataInizioSubagente || "",
      dataFineSubagente: form.dataFineSubagente || "",
      allocazioniRecupero: [] as AllocazioneRecupero[],
    };

   if (editingMovement) {
    const movimentoOriginale = movimenti.find((row) => row.id === editingMovement);

    const primaEraSospeso =
      movimentoOriginale &&
      movimentoOriginale.tipo === "Titolo del giorno" &&
      (
        movimentoOriginale.modalita === "S" ||
        isAssegnoPostdatato(
          movimentoOriginale,
          giornataCorrente
        )
      );
    
    const oraESospeso =
      payload.tipo === "Titolo del giorno" &&
      (
        payload.modalita === "S" ||
        (
          payload.modalita === "A" &&
          payload.dataAssegno > giornataCorrente
        )
      );
     
    setMovimenti((rows) =>
      rows.map((row) => (row.id === editingMovement ? { ...row, ...payload } : row))
    );

    if (giornataDbId) {
      const { error } = await supabase
      .from("movimenti_cassa")
      .update(
        buildMovimentoUpdatePayload(payload, session)
      )
      .eq("id", editingMovement);
    
      if (error) {
      console.error(error);
      alert("Movimento modificato localmente, ma non aggiornato su Supabase.");
    }
  }

 if (primaEraSospeso && !oraESospeso) {
    setSospesi((rows) =>
      rows.filter((s) => s.polizza !== movimentoOriginale?.polizza)
    );
  
    if (movimentoOriginale?.polizza) {
      const { error } = await supabase
        .from("sospesi_cassa")
        .delete()
        .eq("polizza", movimentoOriginale.polizza);
  
      if (error) {
        console.error(error);
        alert("Sospeso rimosso localmente, ma non eliminato da Supabase.");
      }
    }
  }

 if (!primaEraSospeso && oraESospeso) {
  const nuovoSospeso = {
    id: `sosp-${Date.now()}`,
    referenteSospesi: payload.referenteSospesi,
    referenteSospesiId: payload.referenteSospesiId,
    contraente: payload.contraente,
    ramo: payload.ramo,
    polizza: payload.polizza,
    importoOriginario: payload.importo,
    recuperato: 0,
    scontoApplicato: 0,
    residuo: payload.importo,
    stato: "Aperto",
    dataSospeso: giornataCorrente,
    note: payload.note,
  };

  setSospesi((rows) => [nuovoSospeso, ...rows]);

   const { data: sospesoCreato, error } = await supabase
    .from("sospesi_cassa")
    .insert(buildSospesoPayload(nuovoSospeso, giornataCorrente))
    .select()
    .single();
  
 if (sospesoCreato) {
    const { data: storicoCreato, error: storicoError } = await supabase
     .from("sospesi_movimenti")
    .insert({
      sospeso_id: sospesoCreato.id,
      tipo: "origine",
      data_movimento: giornataCorrente,
      importo: nuovoSospeso.importoOriginario,
      modalita_pagamento: payload.modalita,
      note: payload.note || null,
      user_id: session?.user?.id || null,
      user_email: session?.user?.email || null,
    })
    .select("id")
    .single();
  
    if (storicoCreato?.id) {
      storicoSospesiDaCollegare.push(storicoCreato.id);
    }
  
    if (storicoError) {
      console.error(storicoError);
      alert("Sospeso creato, ma storico origine non salvato: " + storicoError.message);
    }
  }
  
  if (error) {
    console.error(error);
    alert("Sospeso creato localmente, ma non salvato su Supabase.");
  }
  if (payload.modalita === "S") {
     const stampa = window.confirm(
       "Vuoi stampare il modulo sospeso da far firmare al cliente?"
     );
  
    if (stampa) {
      stampaModuloSospeso({
        id: `sosp-${Date.now()}`,
        referenteSospesi: payload.referenteSospesi,
        contraente: payload.contraente,
        ramo: payload.ramo,
        polizza: payload.polizza,
        importoOriginario: payload.importo,
        recuperato: 0,
        scontoApplicato: 0,
        residuo: payload.importo,
        stato: "Aperto",
        dataSospeso: giornataCorrente,
        note: payload.note,
      });
    }
  }
  }
  if (primaEraSospeso && oraESospeso) {
    setSospesi((rows) =>
      rows.map((s) =>
        s.polizza === movimentoOriginale?.polizza
          ? {
              ...s,
              referenteSospesi: payload.referenteSospesi,
              contraente: payload.contraente,
              ramo: payload.ramo,
              polizza: payload.polizza,
              importoOriginario: payload.importo,
              residuo: payload.importo - s.recuperato - s.scontoApplicato,
              note: payload.note,
            }
          : s
      )
    );
  
    if (movimentoOriginale?.polizza) {
      const { error } = await supabase
        .from("sospesi_cassa")
        .update({
          ...buildReferentePayload(payload),
          contraente: payload.contraente || null,
          ramo: payload.ramo || null,
          polizza: payload.polizza || null,
          importo_originario: payload.importo,
          residuo: payload.importo,
          note: payload.note || null,
        })
        .eq("polizza", movimentoOriginale.polizza);
  
      if (error) {
        console.error(error);
        alert("Sospeso aggiornato localmente, ma non aggiornato su Supabase.");
      }
    }
  }

  if (payload.sconto >= sogliaStampaAbbuono) {
    const stampa = window.confirm(
      "Vuoi stampare il modulo abbuono provvigioni?"
    );
  
    if (stampa) {
      const motivazione =
        window.prompt("Inserisci la motivazione dell'abbuono") || "";
  
      stampaModuloAbbuono(
        {
          id: editingMovement,
          ...payload,
          createdByEmail: session?.user?.email || "",
        },
        motivazione,
        giornataCorrente,
        euro
      );
    }
  }
  
  setEditingMovement(null);
  addAuditLog(`Modificato movimento ${payload.tipo} - polizza ${payload.polizza || "-"}`);
  resetForm();
  return;
}

    let movimentoDaSalvare: Movimento = {
      id: Date.now(),
      ...payload,
      createdByEmail: session?.user?.email || "",
    };
    if (
      payload.tipo === "Titolo del giorno" &&
      payload.polizza &&
      payload.importo > 0
    ) {
      const duplicato = movimenti.find(
        (m) =>
          m.tipo === "Titolo del giorno" &&
          m.polizza?.trim() === payload.polizza?.trim() &&
          Number(m.importo) === Number(payload.importo) &&
          m.id !== editingMovement
      );
    
      if (duplicato) {
        alert(
          `ATTENZIONE: esiste già un titolo con stessa polizza e stesso importo.\n\nPolizza: ${payload.polizza}\nImporto: € ${payload.importo}`
        );
        return;
      }
    }
    const storicoSospesiDaCollegare: string[] = [];
    const storicoSospesiDaInserire: any[] = [];

    if (
      payload.tipo === "Titolo del giorno" &&
      !isVersamentoSubagente(payload.tipo) &&
      (
        payload.modalita === "S" ||
        (
          payload.modalita === "A" &&
          payload.dataAssegno > giornataCorrente
        )
      )
    ) {
      
  const tempId = `sosp-${Date.now()}`;

  const nuovoSospeso = {
    id: tempId,
    referenteSospesi: payload.referenteSospesi,
    referenteSospesiId: payload.referenteSospesiId,
    contraente: payload.contraente,
    ramo: payload.ramo,
    polizza: payload.polizza,
    importoOriginario: payload.importo,
    recuperato: 0,
    scontoApplicato: 0,
    residuo: payload.importo,
    stato: "Aperto",
    dataSospeso: giornataCorrente,
    note: payload.note,
  };

  setSospesi((rows) => [nuovoSospeso, ...rows]);

  if (giornataDbId) {
    const { data: sospesoCreato, error } = await supabase
      .from("sospesi_cassa")
      .insert(buildSospesoPayload(nuovoSospeso, giornataCorrente))
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Sospeso salvato localmente, ma non salvato su Supabase.");
    }

    if (sospesoCreato) {
      setSospesi((rows) =>
        rows.map((s) =>
          s.id === tempId ? { ...s, id: sospesoCreato.id } : s
        )
      );

      const { error: storicoError } = await supabase
        .from("sospesi_movimenti")
        .insert({
          sospeso_id: sospesoCreato.id,
          tipo: "origine",
          data_movimento: giornataCorrente,
          importo: nuovoSospeso.importoOriginario,
          modalita_pagamento: payload.modalita,
          note: payload.note || null,
          user_id: session?.user?.id || null,
          user_email: session?.user?.email || null,
        });

      if (storicoError) {
        console.error(storicoError);
        alert("Sospeso creato, ma storico origine non salvato: " + storicoError.message);
      }
    }
  }

  if (payload.modalita === "S") {
    const stampa = window.confirm(
      "Vuoi stampare il modulo sospeso da far firmare al cliente?"
    );

    if (stampa) {
      stampaModuloSospeso(nuovoSospeso, euro);
    }
  }
}
   if (payload.tipo === "Recupero sospeso" && selectedSospesoIds.length) {
    const recuperoDiventaNuovoSospeso =
      payload.modalita === "S" ||
      (
        payload.modalita === "A" &&
        payload.dataAssegno > giornataCorrente
      );
     
  const { updatedSospesi, allocazioni } = applyRecuperoToSospesi(
    netto,
    sconto,
    payload.note
  );

  setSospesi(updatedSospesi);
  movimentoDaSalvare = { ...movimentoDaSalvare, allocazioniRecupero: allocazioni };

  if (giornataDbId) {
    for (const sospesoId of selectedSospesoIds) {
      const sospesoAggiornato = updatedSospesi.find((s) => s.id === sospesoId);
      const allocazione = allocazioni.find((a) => a.sospesoId === sospesoId);

      if (sospesoAggiornato) {
        const { error } = await supabase
          .from("sospesi_cassa")
          .update({
            recuperato: sospesoAggiornato.recuperato,
            sconto_applicato: sospesoAggiornato.scontoApplicato,
            residuo: sospesoAggiornato.residuo,
            stato: sospesoAggiornato.stato,
            note: sospesoAggiornato.note || null,
          })
          .eq("id", sospesoId);

        if (error) {
          console.error(error);
          alert("Recupero aggiornato localmente, ma non salvato su Supabase.");
        }

        if (allocazione?.incasso) {
          storicoSospesiDaInserire.push({
            sospeso_id: sospesoId,
            tipo: "recupero",
            data_movimento: giornataCorrente,
            importo: allocazione.incasso,
            modalita_pagamento: payload.modalita,
            note: payload.note || null,
            user_id: session?.user?.id || null,
            user_email: session?.user?.email || null,
          });
        }
        
        if (allocazione?.sconto) {
          storicoSospesiDaInserire.push({
            sospeso_id: sospesoId,
            tipo: "sconto",
            data_movimento: giornataCorrente,
            importo: allocazione.sconto,
            modalita_pagamento: payload.modalita,
            note: payload.note || "Sconto applicato su recupero sospeso",
            user_id: session?.user?.id || null,
            user_email: session?.user?.email || null,
          });
        }
      }
    }
  }

  if (recuperoDiventaNuovoSospeso) {
    const nuovoSospeso = {
      id: `sosp-${Date.now()}`,
      referenteSospesi: payload.referenteSospesi,
      referenteSospesiId: payload.referenteSospesiId,
      contraente: payload.contraente,
      ramo: payload.ramo,
      polizza: payload.polizza,
      importoOriginario: payload.importo,
      recuperato: 0,
      scontoApplicato: 0,
      residuo: payload.importo,
      stato: "Aperto",
      dataSospeso: giornataCorrente,
      note: payload.note || "Recupero sospeso con pagamento non incassabile",
    };

    setSospesi((rows) => [nuovoSospeso, ...rows]);

    if (giornataDbId) {
      const { error } = await supabase
        .from("sospesi_cassa")
        .insert(buildSospesoPayload(nuovoSospeso, giornataCorrente));
    
      if (error) {
        console.error(error);
        alert("Nuovo sospeso creato localmente, ma non salvato su Supabase.");
      }
    }
  }

  setSelectedSospesoIds([]);
 
}
    setMovimenti((rows) => [movimentoDaSalvare, ...rows]);
    if (giornataDbId) {
      const { data: movimentoCreato, error } = await supabase
      .from("movimenti_cassa")
      .insert(
        buildMovimentoPayload(
        payload,
        giornataDbId,
        session
        )
      )
      .select("id")
      .single();

    if (error) {
      console.error(error);
      alert("Movimento salvato localmente, ma non salvato su Supabase: " + error.message);
    }
        
    if (movimentoCreato) {
       movimentoDaSalvare.id = movimentoCreato.id;
    }
        
    if (movimentoCreato?.id && storicoSospesiDaInserire.length > 0) {
      const { error: storicoRecuperiError } = await supabase
        .from("sospesi_movimenti")
        .insert(
          storicoSospesiDaInserire.map((row) => ({
            ...row,
            movimento_cassa_id: movimentoCreato.id,
          }))
        );
    
      if (storicoRecuperiError) {
        console.error(storicoRecuperiError);
        alert("Movimento salvato, ma storico recuperi/sconti non salvato.");
      }
  }
     
 if (movimentoCreato?.id && payload.tipo === "Titolo del giorno") {
    const { error: linkStoricoError } = await supabase
      .from("sospesi_movimenti")
      .update({
        movimento_cassa_id: movimentoCreato.id,
      })
      .eq("tipo", "origine")
      .eq("data_movimento", giornataCorrente)
      .eq("importo", payload.importo)
      .is("movimento_cassa_id", null);
  
    if (linkStoricoError) {
      console.error(linkStoricoError);
      alert("Movimento salvato, ma storico sospesi non collegato al movimento.");
    }
  }
}
    if (payload.sconto >= sogliaStampaAbbuono) {
      const stampa = window.confirm(
        "Vuoi stampare il modulo abbuono provvigioni?"
      );
    
      if (stampa) {
        const motivazione =
          window.prompt("Inserisci la motivazione dell'abbuono") || "";
    
        stampaModuloAbbuono(
          {
            ...movimentoDaSalvare,
            createdByEmail: session?.user?.email || "",
          },
          motivazione,
          giornataCorrente,
          euro
        );
      }
    }

    addAuditLog(`Inserito movimento ${payload.tipo} - polizza ${payload.polizza || "-"} - importo ${euro(payload.importo)}`);
      if (selectedImport) {
        setImportCompagnia((rows) => rows.filter((row) => row.id !== selectedImport));
        setSelectedImport(null);
      }
  
      resetForm();
    }

 async function bloccaQuadraturaMezza() {
  const cassaReale = Number(quadMezza.cassaReale || 0);

  if (!quadMezza.cassaReale) {
  alert("Inserire la cassa reale prima di bloccare la quadratura di mezza giornata.");
  return;
}

  setQuadMezzaBloccata({
    cassaTeorica: totals.cassa,
    cassaReale,
    squadratura: cassaReale - totals.cassa,
    dataOra: new Date().toLocaleString("it-IT"),
  });
   if (giornataDbId) {
      const { error } = await supabase.from("quadrature_cassa").insert({
        giornata_id: giornataDbId,
        tipo: "mezza_giornata",
        cassa_teorica: totals.cassa,
        cassa_reale: cassaReale,
        squadratura: cassaReale - totals.cassa,
        bloccata: true,
      });
    
      if (error) {
        console.error(error);
        alert("Quadratura mezza giornata salvata localmente, ma non salvata su Supabase.");
      }
    }
  addAuditLog(`Bloccata quadratura mezza giornata - cassa reale ${euro(cassaReale)}`);
}

async function bloccaQuadraturaSera() {
  const cassaReale = Number(quadSera.cassaReale || 0);

  if (!quadSera.cassaReale) {
  alert("Inserire la cassa reale prima di bloccare la quadratura di fine giornata.");
  return;
}

  setQuadSeraBloccata({
    cassaTeorica: totals.cassa,
    cassaReale,
    squadratura: cassaReale - totals.cassa,
    dataOra: new Date().toLocaleString("it-IT"),
  });
  if (giornataDbId) {
    const { error } = await supabase.from("quadrature_cassa").insert({
      giornata_id: giornataDbId,
      tipo: "fine_giornata",
      cassa_teorica: totals.cassa,
      cassa_reale: cassaReale,
      squadratura: cassaReale - totals.cassa,
      bloccata: true,
    });
  
    if (error) {
      console.error(error);
      alert("Quadratura fine giornata salvata localmente, ma non salvata su Supabase.");
    }
  }
  addAuditLog(`Bloccata quadratura fine giornata - cassa reale ${euro(cassaReale)}`);
}
  
  async function chiudiGiornata() {
  if (!quadSeraBloccata) {
    alert("Prima di chiudere la giornata devi bloccare la quadratura di fine giornata.");
    return;
  }

  const conferma = window.confirm(
    "Confermi la chiusura della giornata? Dopo la chiusura non sarà possibile inserire, modificare, cancellare o importare movimenti."
  );

  if (!conferma) return;

 setGiornataChiusa(true);
    addAuditLog(`Chiusa giornata ${giornataCorrente} - cassa finale ${euro(totals.cassa)}`);
    
    if (giornataDbId) {
      const { error } = await supabase
        .from("giornate_cassa")
        .update({
          stato: "chiusa",
          cassa_finale_teorica: totals.cassa,
          versamento: totals.versamento,
          chiusa_il: new Date().toISOString(),
        })
        .eq("id", giornataDbId);
    
      if (error) {
        console.error(error);
        alert("Giornata chiusa localmente, ma non aggiornata su Supabase.");
      }
    }
    await ricalcolaAvanziDa(giornataCorrente);
  }
  async function riapriGiornata() {
      if (!isAdmin) {
        alert("Solo un amministratore può riaprire una giornata chiusa.");
        return;
      }
    
      const motivo = window.prompt("Inserisci il motivo della riapertura giornata:");
    
      if (!motivo || !motivo.trim()) {
        alert("Motivo riapertura obbligatorio.");
        return;
      }
    
      const conferma = window.confirm(
        "Confermi la riapertura della giornata? Le modifiche potranno incidere sugli avanzi delle giornate successive."
      );
    
      if (!conferma) return;
    
      setGiornataChiusa(false);
      addAuditLog(`Riaperta giornata ${giornataCorrente} - motivo: ${motivo}`);
    
      if (giornataDbId) {
        const { error } = await supabase
          .from("giornate_cassa")
          .update({
            stato: "riaperta",
            riaperta_il: new Date().toISOString(),
            motivo_riapertura: motivo,
            ricalcolo_richiesto: true,
          })
          .eq("id", giornataDbId);
    
        if (error) {
          console.error(error);
          alert("Giornata riaperta localmente, ma non aggiornata su Supabase.");
        }
      }
    }
   async function ricalcolaAvanziDa(dataRiferimento: string) {
    const { data: giornate, error } = await supabase
      .from("giornate_cassa")
      .select("*")
      .gte("data_giornata", dataRiferimento)
      .order("data_giornata", { ascending: true });
  
    if (error || !giornate) {
      console.error(error);
      return;
    }
  
    let cassaFinalePrecedente: number | null = null;
  
    for (let i = 0; i < giornate.length; i++) {
      const giornata = giornate[i];
  
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
          (sum, m) => sum + Number(m.importo_netto || 0) * Number(m.segno || 1),
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
  }
  
  async function aggiornaVersamento(value: string) {
    setVersamento(value);
  
    if (!giornataDbId) return;
  
    const { error } = await supabase
      .from("giornate_cassa")
      .update({
        versamento: Number(value || 0),
      })
      .eq("id", giornataDbId);
  
    if (error) {
      console.error(error);
    }
  }

 
 
// ======================================================
// 11 - IMPORT CSV COMPAGNIA
// ======================================================  

function openImportFileDialog() {
   fileInputRef.current?.click();
}

async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();

    const parseImporto = (value: string) => {
      if (!value) return 0;
      return Number(
        value
          .replace(/€/g, "")
          .replace(/\s/g, "")
          .replace(/\./g, "")
          .replace(/,/g, ".")
      ) || 0;
    };

    const parseLine = (line: string) => line.split(";").map((v) => v.trim());

    const lines = text
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim());

    const headers = parseLine(lines[0]).map((h) =>
      h.toLowerCase().replace(/\./g, "").trim()
    );

    const idxRamo = headers.indexOf("ramo");
    const idxSub = headers.indexOf("subag");
    const idxPolizza = headers.indexOf("polizza");
    const idxContraente = headers.indexOf("contraente");
    const idxTotale = headers.indexOf("totale");
    const idxTipoPag = headers.indexOf("tipo pag");
    const idxCodCassa = headers.findIndex(
      (h) => h.toLowerCase() === "cod_cassa"
    );

    if ([idxSub, idxRamo, idxPolizza, idxContraente, idxTotale, idxTipoPag].some((i) => i < 0)) {
      throw new Error("Colonne mancanti nel CSV: Sub, Ramo, Polizza, Contraente, Totale, Tipo Pag.");
    }

    const grouped = new Map<string, ImportRow>();

    lines.slice(1).forEach((line, index) => {
      const cols = parseLine(line);
      const totale = parseImporto(cols[idxTotale]);

      if (!totale) return;

      const sub = cols[idxSub] || "";
      const ramo = cols[idxRamo] || "";
      const polizza = cols[idxPolizza] || "";
      const contraente = cols[idxContraente] || "";
      const codCassa = cols[idxCodCassa] || "";
      const modalitaCompagnia = normalizzaModalitaPagamento(
        cols[idxTipoPag] || "",
        codCassa
      );

      const key = `${sub}|${ramo}|${polizza}|${contraente}|${modalitaCompagnia}`;
      
      const existing = grouped.get(key);

      if (existing) {
        existing.importo = Number((existing.importo + totale).toFixed(2));
      } else {
        grouped.set(key, {
          id: `imp-${Date.now()}-${index}`,
          sub,
          ramo,
          polizza,
          contraente,
          importo: Number(totale.toFixed(2)),
          modalitaCompagnia,
          stato: "Da lavorare",
          fileOrigine: file.name,
        });
      }
    });

const polizzeGiaPresenti = new Set([
  ...importCompagnia.map((r) => r.polizza),
  ...movimenti.map((m) => m.polizza),
]);

const tutteLeRighe = Array.from(grouped.values());

const nuoveRighe = tutteLeRighe.filter(
  (row) => !polizzeGiaPresenti.has(row.polizza)
);

const scartate = tutteLeRighe.length - nuoveRighe.length;

setImportCompagnia((rows) => [...nuoveRighe, ...rows]);

alert(
  `Import completato.\n` +
  `${nuoveRighe.length} nuovi movimenti importati.\n` +
  `${scartate} movimenti già presenti scartati.`
);
  } catch (error) {
    alert(error instanceof Error ? error.message : "Errore durante l'import CSV");
  } finally {
    event.target.value = "";
  }
}

  const selectedImportRow = importCompagnia.find((row) => row.id === selectedImport);
  
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        Caricamento...
      </div>
    );
  }
  
  if (!session) {
  return (
    <LoginPanel
      loginEmail={loginEmail}
      setLoginEmail={setLoginEmail}
      loginPassword={loginPassword}
      setLoginPassword={setLoginPassword}
      login={login}
    />
  );
}

  // ======================================================
  // 14 - RENDER UI PRINCIPALE
  // ======================================================
  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
        <SidebarOperativa
          giornataCorrente={giornataCorrente}
          setGiornataCorrente={setGiornataCorrente}
          session={session}
          profiloUtente={profiloUtente}
          giornataChiusa={giornataChiusa}
          giornataDbId={giornataDbId}
          isAdmin={isAdmin}
          logout={logout}
          chiudiGiornata={chiudiGiornata}
          riapriGiornata={riapriGiornata}
          versamento={versamento}
          aggiornaVersamento={aggiornaVersamento}
          totals={totals}
          avanzoPrecedente={avanzoPrecedente}
          quadMezza={quadMezza}
          setQuadMezza={setQuadMezza}
          quadSera={quadSera}
          setQuadSera={setQuadSera}
          quadMezzaBloccata={quadMezzaBloccata}
          quadSeraBloccata={quadSeraBloccata}
          bloccaQuadraturaMezza={bloccaQuadraturaMezza}
          bloccaQuadraturaSera={bloccaQuadraturaSera}
          euro={euro}
          deltaLabel={deltaLabel}
          SidebarMetric={SidebarMetric}
        />
        <main className="space-y-6">
          
{/* ======================================================
    UI - FORM MOVIMENTO
====================================================== */}
<FormMovimento
  editingMovement={editingMovement}
  setEditingMovement={setEditingMovement}
  giornataChiusa={giornataChiusa}
  selectedImportRow={selectedImportRow}
  form={form}
  setForm={setForm}
  saveForm={saveForm}
  resetForm={resetForm}
  fileInputRef={fileInputRef}
  handleImportFile={handleImportFile}
  openImportFileDialog={openImportFileDialog}
  handleTipoMovimentoChange={handleTipoMovimentoChange}
  tipiMovimento={tipiMovimento}
  modalitaPagamento={modalitaPagamento}
  referentiSospesi={referentiSospesi}
  getDescrizioneModalita={getDescrizioneModalita}
  isVersamentoSubagente={isVersamentoSubagente}
  euro={euro}
  giornataCorrente={giornataCorrente}
  selectedSospesoIds={selectedSospesoIds}
/>
        
{/* ======================================================
    UI - TABELLA MOVIMENTI
====================================================== */}
<TabellaMovimenti
  movimenti={movimenti}
  giornataCorrente={giornataCorrente}
  giornataChiusa={giornataChiusa}
  editMovement={editMovement}
  deleteMovement={deleteMovement}
  getDescrizioneModalita={getDescrizioneModalita}
  isAssegnoPostdatato={isAssegnoPostdatato}
  descrizioneMovimento={descrizioneMovimento}
  euro={euro}
  Badge={Badge}
/>
  
{/* ======================================================
    UI - IMPORT COMPAGNIA
====================================================== */}
   <ImportCompagnia
      importCompagnia={importCompagnia}
      numeroPolizzaCompleto={numeroPolizzaCompleto}
      euro={euro}
      Badge={Badge}
      selectedImport={selectedImport}
      giornataChiusa={giornataChiusa}
      openImportFileDialog={openImportFileDialog}
      selectImported={selectImported}
      deleteImportedMovement={deleteImportedMovement}
      getDescrizioneModalita={getDescrizioneModalita}
    />

{/* ======================================================
    UI - SOSPESI / RECUPERI
====================================================== */}
    <SospesiRecuperi
      sospesiFiltrati={sospesiFiltrati}
      selectedSospesoIds={selectedSospesoIds}
      searchSospesi={searchSospesi}
      setSearchSospesi={setSearchSospesi}
      toggleSospeso={toggleSospeso}
      prepareRecuperoSospesi={prepareRecuperoSospesi}
      numeroPolizzaCompleto={numeroPolizzaCompleto}
      euro={euro}
      Badge={Badge}
    />

{/* ======================================================
    UI - REPORT
====================================================== */}
       <ReportPanel />
{/* ======================================================
    FINE UI - REPORT
====================================================== */}
        </main>
      </div>
    </div>
  );
}
