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
import { Badge } from "./components/Badge";

import type { Movimento, Sospeso, FormState, ImportRow, AllocazioneRecupero } from "./types";
import { tipiMovimento } from "./constants";
import { euro, deltaLabel } from "./formatters";
import { emptyForm } from "./formDefaults";
import { numeroPolizzaCompleto, descrizioneMovimento, isAssegnoPostdatato, isVersamentoSubagente, getDescrizioneModalita, calcolaValoriTitolo } from "./utils";
import { normalizzaModalitaPagamento } from "./importUtils";
import { stampaModuloSospeso, stampaModuloAbbuono } from "./printUtils";
import { buildReferentePayload, buildMovimentoPayload, buildMovimentoUpdatePayload, buildSospesoPayload, buildSospesoAggiornatoRpcPayload } from "./payloadBuilders";
import { movimentoEraSospeso, importoMovimentoNonValido, payloadGeneraSospeso, movimentoERecuperoSospeso, trovaMovimentoDuplicato,
        creaNuovoSospesoDaPayload, creaMovimentoDaPayload, creaPayloadMovimentoDaForm, } from "./movementRules";

import { chiudiGiornataDb, aggiornaVersamentoDb, riapriGiornataDb, ricalcolaAvanziDaDb } from "./services/giornateService";
import { eliminaMovimentoDb, salvaMovimentoDb, aggiornaMovimentoDb, caricaMovimentiDb, caricaRecuperiStoricoDb, registraMovimentoCassaRpc,
         aggiornaMovimentoCassaSempliceRpc, aggiornaMovimentoCassaConSospesoRpc, aggiornaMovimentoCassaCreaSospesoRpc, aggiornaMovimentoCassaRimuoviSospesoRpc, eliminaMovimentoCassaRpc } from "./services/movimentiService";
import { caricaSospesiDb, creaSospesoDb, aggiornaSospesoDb, eliminaSospesoDb, creaStoricoSospesoDb, creaStoricoSospesiBulkDb, collegaStoricoOrigineAMovimentoDb } from "./services/sospesiService";
import { caricaQuadratureDb, salvaQuadraturaDb } from "./services/quadratureService";
import { loginDb, logoutDb, caricaProfiloUtenteDb } from "./services/authService";

import { buildCassaGiornataReport } from "./reports/buildCassaGiornataReport";

import { supabase } from "./supabaseClient";

// ======================================================
// 02 - COSTANTI / TIPI / INTERFACCE
// ======================================================

const GIORNATA_CORRENTE = new Date().toISOString().slice(0, 10);

const USA_RPC_MOVIMENTO_ATOMICO = true;

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
    const [formAutoMode, setFormAutoMode] = useState(true);
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
  const { data, error } = await caricaProfiloUtenteDb(userId);

  if (error) {
    console.error(error);
    alert("Profilo utente non trovato.");
    return;
  }
  setProfiloUtente(data);
}

async function login() {
  const { error } = await loginDb(
    loginEmail,
    loginPassword
  );

  if (error) {
    alert("Login non riuscito: " + error.message);
  }
}

async function logout() {
  await logoutDb();
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
    auditLog
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
]);
  
useEffect(() => {
  async function caricaMovimentiDaSupabase() {
    if (!giornataDbId) return;

  const { data, error } = await caricaMovimentiDb(
    giornataDbId
  );
    
  const { data: recuperiStorico } =
    await caricaRecuperiStoricoDb();;

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
        sospesoId: row.sospeso_id || "",
        importo: Number(row.importo_lordo || 0),
        incassato: Number(row.importo_incassato || 0),
        sconto: Number(row.sconto || 0),
        netto: Number(row.importo_netto || 0),
        modalita: row.modalita_pagamento || "C",
        tipo: row.tipo_movimento || "Titolo del giorno",
        sub: row.codice_subagenzia || "100",
        dataAssegno: row.data_assegno || "",
        segno: Number(row.segno || 1),
        note: row.note || "",
        createdAt: row.created_at || "",
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
    
        const { data, error } = await caricaQuadratureDb(giornataDbId);
    
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
      const { data, error } = await caricaSospesiDb();
  
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
    .reduce((sum, m) => sum + m.incassato * (m.segno || 1), 0);    
    
    const totaleSospesi = movimenti
      .filter(
        (m) =>
          m.tipo === "Titolo del giorno" &&
          (m.modalita === "S" || isAssegnoPostdatato(m, giornataCorrente))
      )
  .reduce((sum, m) => sum + m.importo, 0);
    const totaleRecuperi = movimenti
      .filter((m) => m.tipo === "Recupero sospeso")
      .reduce((sum, m) => sum + m.incassato, 0);
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
    setFormAutoMode(true);
    setForm({
      ...emptyForm,
      ramo: row.ramo,
      polizza: row.polizza,
      contraente: row.contraente,
      referenteSospesi: row.contraente,
      importo: String(row.importo),
      importoIncassato: String(row.importo),
      sconto: "0",
      modalita: normalizzaModalitaPagamento(row.modalitaCompagnia),
      sub: row.sub || "100",
      tipo: "Titolo del giorno",
    });
  }

  async function deleteMovement(id: number) {

    if (giornataChiusa) {
      alert("La giornata di cassa è chiusa. Non è possibile cancellare movimenti.");
      return;
    }
    
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
      movimento.sospesoId
    ) {
      setSospesi((rows) =>
        rows.filter((s) => s.id !== movimento.sospesoId)
      );
    }
    setMovimenti((rows) => rows.filter((row) => row.id !== id));
    
    if (giornataDbId && movimento) {
      const { error } = await eliminaMovimentoCassaRpc({
        movimentoId: String(id),
        sospesoId: movimento.sospesoId || null,
        allocazioniRecupero: movimento.allocazioniRecupero || [],
        audit: {
          giornata_id: giornataDbId,
          utente_id: null,
          azione: "eliminazione_movimento",
          dettaglio: {
            movimento_id: id,
            sospeso_id: movimento.sospesoId || null,
            tipo: movimento.tipo,
            polizza: movimento.polizza || null,
            importo: movimento.importo,
            user_email: session?.user?.email || null,
          },
        },
      });
    
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

    if (giornataChiusa) {
      alert("La giornata di cassa è chiusa. Non è possibile modificare movimenti.");
      return;
    }
    
    if (!canManageMovimento(row)) {
      alert("Puoi modificare solo i movimenti inseriti da te.");
      return;
    }
    setEditingMovement(row.id);
    setSelectedImport(null);
    setSelectedSospesoIds([]);
    setFormAutoMode(false);
    setForm({
      ...emptyForm,
      ramo: row.ramo,
      polizza: row.polizza,
      contraente: row.contraente,
      referenteSospesi: row.referenteSospesi || row.contraente,
      referenteSospesiId: row.referenteSospesiId || "",
      importo: String(row.importo),
      importoIncassato: String(row.incassato ?? row.importo),
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
  
  function payloadGeneraSospeso(payload: any) {
    if (payload.tipo !== "Titolo del giorno") return false;
  
    const importoSospeso =
      Number(payload.importo || 0) -
      Number(payload.sconto || 0) -
      Number(payload.incassato || 0);
  
    const incassoParziale = importoSospeso > 0.009;
  
    const assegnoPostdatato =
      payload.modalita === "A" &&
      payload.dataAssegno &&
      payload.dataAssegno > giornataCorrente;
  
    return (
      payload.modalita === "S" ||
      assegnoPostdatato ||
      incassoParziale
    );
  }

  function trovaSospesoOriginale(movimento?: Movimento) {
    if (!movimento?.sospesoId) return undefined;
  
    const sospeso = sospesi.find(
      (s) => s.id === movimento.sospesoId
    );
  
    if (sospeso) return sospeso;
  
    return {
      id: movimento.sospesoId,
      referenteSospesi: movimento.referenteSospesi,
      referenteSospesiId: movimento.referenteSospesiId,
      contraente: movimento.contraente,
      ramo: movimento.ramo,
      polizza: movimento.polizza,
      importoOriginario:
        movimento.importo - movimento.sconto - movimento.incassato,
      recuperato: 0,
      scontoApplicato: 0,
      residuo:
        movimento.importo - movimento.sconto - movimento.incassato,
      stato: "Aperto",
      dataSospeso: giornataCorrente,
      note: movimento.note,
    };
  }
 
  async function gestisciStampaAbbuono(
    movimento: Movimento,
    motivazioneContext: string = ""
  ) {
    if (movimento.sconto < sogliaStampaAbbuono) return;
  
      const stampa = window.confirm(
        "Vuoi stampare il modulo abbuono provvigioni?"
      );
    
      if (!stampa) return;
    
      const motivazione =
        window.prompt("Inserisci la motivazione dell'abbuono") || motivazioneContext;
    
      stampaModuloAbbuono(
        movimento,
        motivazione,
        giornataCorrente,
        euro
      );
  }

  async function gestisciModificaMovimento(
    editingMovement: number,
    payload: any
  ) {
    const movimentoOriginale = movimenti.find(
      (row) => row.id === editingMovement
    );
  
    const primaEraSospeso = movimentoEraSospeso(
      movimentoOriginale,
      giornataCorrente,
      isAssegnoPostdatato
    );
  
    const oraESospeso = payloadGeneraSospeso(
      payload,
      giornataCorrente
    );

    const modificaSempliceNonSospeso =
      USA_RPC_MOVIMENTO_ATOMICO &&
      !primaEraSospeso &&
      !oraESospeso;

    const modificaSospesoRestaSospeso =
      USA_RPC_MOVIMENTO_ATOMICO &&
      primaEraSospeso &&
      oraESospeso;

    const modificaNormaleDiventaSospeso =
      USA_RPC_MOVIMENTO_ATOMICO &&
      !primaEraSospeso &&
      oraESospeso;

    const modificaSospesoDiventaNormale =
      USA_RPC_MOVIMENTO_ATOMICO &&
      primaEraSospeso &&
      !oraESospeso;

    const sospesoOriginale =
      trovaSospesoOriginale(movimentoOriginale);

    console.log("DEBUG modifica sospeso", {
      movimentoOriginale,
      primaEraSospeso,
      oraESospeso,
      sospesoIdMovimento: movimentoOriginale?.sospesoId,
      sospesiIds: sospesi.map((s) => s.id),
      sospesoOriginale,
    });

    const nuovoSospesoPerModifica =
      creaNuovoSospesoDaPayload(
        payload,
        giornataCorrente
      );
    
    const nuovoSospesoRpc =
      buildSospesoPayload(
        nuovoSospesoPerModifica,
        giornataCorrente
      );
    
    setMovimenti((rows) =>
      rows.map((row) =>
        row.id === editingMovement
          ? { ...row, ...payload }
          : row
      )
    );
  
    if (giornataDbId) {
      if (modificaSempliceNonSospeso) {
        const { error } = await aggiornaMovimentoCassaSempliceRpc({
          movimentoId: String(editingMovement),
          movimento: buildMovimentoUpdatePayload(payload, session),
          audit: {
            giornata_id: giornataDbId,
            utente_id: null,
            azione: "modifica_movimento",
            dettaglio: {
              movimento_id: editingMovement,
              tipo: payload.tipo,
              polizza: payload.polizza || null,
              importo: payload.importo,
              user_email: session?.user?.email || null,
            },
          },
        });
    
        if (error) {
          console.error(error);
          alert("Movimento non aggiornato su Supabase: " + error.message);
          return;
        }
      } else if (modificaSospesoRestaSospeso && sospesoOriginale?.id) {
        const { error } = await aggiornaMovimentoCassaConSospesoRpc({
          movimentoId: String(editingMovement),
          movimento: buildMovimentoUpdatePayload(payload, session),
          sospesoId: String(sospesoOriginale.id),
          sospeso: {
            ...buildReferentePayload(payload),
            contraente: payload.contraente || null,
            ramo: payload.ramo || null,
            polizza: payload.polizza || null,
            importo_originario:
              payload.importo - payload.sconto - payload.incassato,
            residuo:
              payload.importo -
              payload.sconto -
              payload.incassato -
              sospesoOriginale.recuperato -
              sospesoOriginale.scontoApplicato,
            note: payload.note || null,
          },
          audit: {
            giornata_id: giornataDbId,
            utente_id: null,
            azione: "modifica_movimento_con_sospeso",
            dettaglio: {
              movimento_id: editingMovement,
              sospeso_id: sospesoOriginale.id,
              tipo: payload.tipo,
              polizza: payload.polizza || null,
              importo: payload.importo,
              user_email: session?.user?.email || null,
            },
          },
        });
    
        if (error) {
          console.error(error);
          alert("Movimento/sospeso non aggiornati su Supabase: " + error.message);
          return;
        }
        const nuovoImportoSospeso =
          payload.importo - payload.sconto - payload.incassato;
        
        setMovimenti((rows) =>
          rows.map((row) =>
            row.id === editingMovement
              ? {
                  ...row,
                  ...payload,
                  sospesoId: sospesoOriginale.id,
                }
              : row
          )
        );
        
        setSospesi((rows) =>
          rows.map((s) =>
            s.id === sospesoOriginale.id
              ? {
                  ...s,
                  referenteSospesi: payload.referenteSospesi,
                  referenteSospesiId: payload.referenteSospesiId,
                  contraente: payload.contraente,
                  ramo: payload.ramo,
                  polizza: payload.polizza,
                  importoOriginario: nuovoImportoSospeso,
                  residuo:
                    nuovoImportoSospeso -
                    s.recuperato -
                    s.scontoApplicato,
                  note: payload.note,
                }
              : s
          )
        );

      } else if (modificaNormaleDiventaSospeso) {
        const { data, error } = await aggiornaMovimentoCassaCreaSospesoRpc({
          movimentoId: String(editingMovement),
          movimento: buildMovimentoUpdatePayload(payload, session),
          sospeso: nuovoSospesoRpc,
          audit: {
            giornata_id: giornataDbId,
            utente_id: null,
            azione: "modifica_movimento_crea_sospeso",
            dettaglio: {
              movimento_id: editingMovement,
              tipo: payload.tipo,
              polizza: payload.polizza || null,
              importo: payload.importo,
              user_email: session?.user?.email || null,
            },
          },
        });
      
        if (error) {
          console.error(error);
          alert("Movimento/sospeso non aggiornati su Supabase: " + error.message);
          return;
        }
      
        if (data?.sospeso_id) {
          setMovimenti((rows) =>
            rows.map((row) =>
              row.id === editingMovement
                ? {
                    ...row,
                    ...payload,
                    sospesoId: data.sospeso_id,
                  }
                : row
            )
          );
        
          setSospesi((rows) => [
            {
              ...nuovoSospesoPerModifica,
              id: data.sospeso_id,
            },
            ...rows,
          ]);
        }

      } else if (modificaSospesoDiventaNormale && sospesoOriginale?.id) {
        const { error } =
          await aggiornaMovimentoCassaRimuoviSospesoRpc({
            movimentoId: String(editingMovement),
            sospesoId: String(sospesoOriginale.id),
            movimento: buildMovimentoUpdatePayload(payload, session),
            audit: {
              giornata_id: giornataDbId,
              utente_id: null,
              azione: "modifica_movimento_rimuovi_sospeso",
              dettaglio: {
                movimento_id: editingMovement,
                sospeso_id: sospesoOriginale.id,
                tipo: payload.tipo,
                polizza: payload.polizza || null,
                importo: payload.importo,
                user_email: session?.user?.email || null,
              },
            },
          });
      
        if (error) {
          console.error(error);
          alert("Movimento/sospeso non aggiornati su Supabase: " + error.message);
          return;
        }

        setMovimenti((rows) =>
          rows.map((row) =>
            row.id === editingMovement
              ? {
                  ...row,
                  ...payload,
                  sospesoId: "",
                }
              : row
          )
        );

setSospesi((rows) =>
  rows.filter((s) => s.id !== sospesoOriginale.id)
);
        
      } else {
        const { error } = await aggiornaMovimentoDb(
          editingMovement,
          buildMovimentoUpdatePayload(payload, session)
        );
    
        if (error) {
          console.error(error);
          alert("Movimento modificato localmente, ma non aggiornato su Supabase.");
        }
      }
    }
  
    await gestisciStampaAbbuono({
      id: editingMovement,
      ...payload,
      createdByEmail: session?.user?.email || "",
    });
  
    setEditingMovement(null);
    
    resetForm();
  }

  async function salvaSospesoConStorico(
    nuovoSospeso: Sospeso,
    payload: any
  ) {
    const { data: sospesoCreato, error } =
      await creaSospesoDb(
        buildSospesoPayload(nuovoSospeso)
      );
  
    if (error) {
      console.error(error);
      alert("Sospeso salvato localmente, ma non salvato su Supabase.");
      return null;
    }
  
    if (!sospesoCreato) return null;
  
    const { error: storicoError } =
      await creaStoricoSospesoDb({
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
  
    return sospesoCreato;
  }
  
  function applicaRecuperoSospesi(
    netto: number,
    sconto: number,
    note: string
  ) {
    const { updatedSospesi, allocazioni } =
      applyRecuperoToSospesi(
        netto,
        sconto,
        note
      );
  
    setSospesi(updatedSospesi);
  
    return { updatedSospesi, allocazioni };
  }

  async function aggiornaSospesiRecuperati(
    updatedSospesi: Sospeso[]
  ) {
    if (!giornataDbId) return;
  
    for (const sospesoId of selectedSospesoIds) {
      const sospesoAggiornato =
        updatedSospesi.find((s) => s.id === sospesoId);
  
      const allocazione =
        allocazioni.find((a) => a.sospesoId === sospesoId);
  
      if (!sospesoAggiornato) continue;
  
      const { error } = await aggiornaSospesoDb(
        sospesoId,
        {
          recuperato: sospesoAggiornato.recuperato,
          sconto_applicato: sospesoAggiornato.scontoApplicato,
          residuo: sospesoAggiornato.residuo,
          stato: sospesoAggiornato.stato,
          note: sospesoAggiornato.note || null,
        }
      );
  
      if (error) {
        console.error(error);
        alert("Recupero aggiornato localmente, ma non salvato su Supabase.");
      }  
    }
  }

  async function salvaMovimentoFinale(
    movimentoDaSalvare: Movimento,
    payload: any,
    storicoSospesiDaInserire: any[],
    sospesiDaAggiornareRpc: any[],
    nuovoSospesoRpc: any | null
  ) {

    const tempId = movimentoDaSalvare.id;

    setMovimenti((rows) => [
      movimentoDaSalvare,
      ...rows,
    ]);
  
    if (!giornataDbId) {
      return movimentoDaSalvare;
    }

    const usaRpcPerQuestoMovimento =
      USA_RPC_MOVIMENTO_ATOMICO;
    
    if (usaRpcPerQuestoMovimento) {
      console.log("DEBUG movimentoDaSalvare", movimentoDaSalvare);
      console.log(
        "DEBUG buildMovimentoPayload",
        buildMovimentoPayload(movimentoDaSalvare, giornataDbId, session)
      );
    
      const { data, error } = await registraMovimentoCassaRpc({
        movimento: buildMovimentoPayload(
          movimentoDaSalvare,
          giornataDbId,
          session
        ),
        nuovoSospeso: nuovoSospesoRpc,
        storicoSospesi: storicoSospesiDaInserire,
        sospesiDaAggiornare: sospesiDaAggiornareRpc,
        audit: {
          giornata_id: giornataDbId,
          utente_id: null,
          azione: "inserimento_movimento",
          dettaglio: {
            tipo: payload.tipo,
            polizza: payload.polizza || null,
            importo: payload.importo,
          },
        },
      });
    
      if (error) {
        console.error(error);
        alert("Movimento non salvato su Supabase: " + error.message);
        return movimentoDaSalvare;
      }
    
      if (data?.movimento_id) {
        movimentoDaSalvare.id = data.movimento_id;
    
        setMovimenti((rows) =>
          rows.map((row) =>
            row.id === tempId
              ? { ...row, id: data.movimento_id }
              : row
          )
        );
      }
    
      if (data?.sospeso_id && nuovoSospesoRpc) {
        movimentoDaSalvare.sospesoId = data.sospeso_id;
    
        setMovimenti((rows) =>
          rows.map((row) =>
            row.id === data.movimento_id || row.id === tempId
              ? {
                  ...row,
                  id: data.movimento_id,
                  sospesoId: data.sospeso_id,
                }
              : row
          )
        );
    
        setSospesi((rows) => [
          {
            ...creaNuovoSospesoDaPayload(payload, giornataCorrente),
            id: data.sospeso_id,
          },
          ...rows,
        ]);
      }
    
      return movimentoDaSalvare;
    }
    
    const { data: movimentoCreato, error } =
      await salvaMovimentoDb(
        buildMovimentoPayload(
          movimentoDaSalvare,
          giornataDbId,
          session
        )
      );
  
    if (error) {
      console.error(error);
      alert(
        "Movimento salvato localmente, ma non salvato su Supabase: " +
          error.message
      );
    }
  
    if (movimentoCreato) {
      movimentoDaSalvare.id = movimentoCreato.id;
    }
  
    if (
      movimentoCreato?.id &&
      storicoSospesiDaInserire.length > 0
    ) {
      const { error: storicoRecuperiError } =
        await creaStoricoSospesiBulkDb(
          storicoSospesiDaInserire.map((row) => ({
            ...row,
            movimento_cassa_id: movimentoCreato.id,
          }))
        );
  
      if (storicoRecuperiError) {
        console.error(storicoRecuperiError);
        alert(
          "Movimento salvato, ma storico recuperi/sconti non salvato."
        );
      }
    }
  
    if (
      movimentoCreato?.id &&
      payload.tipo === "Titolo del giorno"
    ) {
      const { error: linkStoricoError } =
        await collegaStoricoOrigineAMovimentoDb(
          movimentoCreato.id,
          giornataCorrente,
          payload.importo
        );
  
      if (linkStoricoError) {
        console.error(linkStoricoError);
        alert(
          "Movimento salvato, ma storico sospesi non collegato al movimento."
        );
      }
    }
  }

  function completaInserimentoMovimento(
    payload: any,
    registraAudit = true
  ) {
    if (registraAudit) {
      addAuditLog(
        `Inserito movimento ${payload.tipo} - polizza ${payload.polizza || "-"} - importo ${euro(payload.importo)}`
      );
    }
  
    if (selectedImport) {
      setImportCompagnia((rows) =>
        rows.filter((row) => row.id !== selectedImport)
      );
      setSelectedImport(null);
    }
  
    resetForm();
  }
        
  async function gestisciCreazioneSospesoDaPayload(
    payload: Movimento,
    movimentoDaSalvare: Movimento,
    saltaSalvataggioDb = false
    ): Promise<Movimento> {
          const nuovoSospeso =
            creaNuovoSospesoDaPayload(
              payload,
              giornataCorrente
            );
        
          const tempId = nuovoSospeso.id;
        
          if (!saltaSalvataggioDb) {
            setSospesi((rows) => [nuovoSospeso, ...rows]);
          }
          
          if (giornataDbId && !saltaSalvataggioDb) {
            const sospesoCreato =
              await salvaSospesoConStorico(
                nuovoSospeso,
                payload
              );
        
            if (sospesoCreato) {
              setSospesi((rows) =>
                rows.map((s) =>
                  s.id === tempId ? { ...s, id: sospesoCreato.id } : s
                )
              );
        
              movimentoDaSalvare = {
                ...movimentoDaSalvare,
                sospesoId: sospesoCreato.id,
              };
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
        
          return movimentoDaSalvare;
        }
  async function gestisciRecuperoSospesiDaPayload(
    payload: Movimento,
    movimentoDaSalvare: Movimento,
    netto: number,
    sconto: number,
    storicoSospesiDaInserire: any[],
    sospesiDaAggiornareRpc: any[],
    saltaSalvataggioDb = false
  ): Promise<Movimento> {
      const recuperoDiventaNuovoSospeso =
        payloadGeneraSospeso(payload, giornataCorrente);
        
      const { updatedSospesi, allocazioni } =
        applicaRecuperoSospesi(
          netto,
          sconto,
          payload.note
        );
        sospesiDaAggiornareRpc.push(
          ...updatedSospesi
            .filter((s) => selectedSospesoIds.includes(s.id))
            .map(buildSospesoAggiornatoRpcPayload)
        );

        for (const sospesoId of selectedSospesoIds) {
          const allocazione =
            allocazioni.find((a) => a.sospesoId === sospesoId);
        
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
        
        movimentoDaSalvare = {
          ...movimentoDaSalvare,
          allocazioniRecupero: allocazioni,
        };
        
        if (!saltaSalvataggioDb) {
          await aggiornaSospesiRecuperati(updatedSospesi);
        }
        
        if (recuperoDiventaNuovoSospeso) {
          const nuovoSospeso =
            creaNuovoSospesoDaPayload(
              {
                ...payload,
                note:
                  payload.note ||
                  "Recupero sospeso con pagamento non incassabile",
              },
              giornataCorrente
            );
        
            setSospesi((rows) => [nuovoSospeso, ...rows]);
        
            if (giornataDbId) {
              await salvaSospesoConStorico(
                nuovoSospeso,
                payload
              );
            }
          }
        
          setSelectedSospesoIds([]);
        
          return movimentoDaSalvare;
        }
        
async function saveForm() {

  if (giornataChiusa) {
    alert("La giornata di cassa è chiusa. Non è possibile inserire o modificare movimenti.");
    return;
  }
  
  if (importoMovimentoNonValido(form)) {
    alert("Inserire un importo valido diverso da zero.");
    return;
  }

  const payload = creaPayloadMovimentoDaForm(
    form,
    giornataCorrente
  );
  const netto = payload.netto;
  const sconto = payload.sconto;

  if (editingMovement) {
    await gestisciModificaMovimento(editingMovement, payload);
    return;
  }

  let movimentoDaSalvare = creaMovimentoDaPayload(
    payload,
    session?.user?.email || ""
  );

  const duplicato = trovaMovimentoDuplicato(
    payload,
    editingMovement,
    movimenti
  );

  if (duplicato) {
    alert(
      `ATTENZIONE: esiste già un titolo con stessa polizza e stesso importo.\n\nPolizza: ${payload.polizza}\nImporto: € ${payload.importo}`
    );
    return;
  }

  const storicoSospesiDaInserire: any[] = [];
  const sospesiDaAggiornareRpc: any[] = [];
  let nuovoSospesoRpc: any | null = null;
  
  const usaRpcPerQuestoMovimento =
    USA_RPC_MOVIMENTO_ATOMICO;

  console.log("DEBUG payload sospeso", {
    tipo: payload.tipo,
    importo: payload.importo,
    sconto: payload.sconto,
    incassato: payload.incassato,
    sospesoCalcolato: payload.importo - payload.sconto - payload.incassato,
    generaSospeso: payloadGeneraSospeso(payload, giornataCorrente),
  });

  if (payloadGeneraSospeso(payload, giornataCorrente)) {
    nuovoSospesoRpc = buildSospesoPayload(
      creaNuovoSospesoDaPayload(payload, giornataCorrente),
      giornataCorrente
    );
  
    movimentoDaSalvare = await gestisciCreazioneSospesoDaPayload(
      payload,
      movimentoDaSalvare,
      usaRpcPerQuestoMovimento
    );
  }

  if (
    movimentoERecuperoSospeso(
      payload,
      selectedSospesoIds.length > 0
    )
  ) {
     movimentoDaSalvare = await gestisciRecuperoSospesiDaPayload(
        payload,
        movimentoDaSalvare,
        netto,
        sconto,
        storicoSospesiDaInserire,
        sospesiDaAggiornareRpc,
        usaRpcPerQuestoMovimento
      );
    }

  movimentoDaSalvare = await salvaMovimentoFinale(
    movimentoDaSalvare,
    payload,
    storicoSospesiDaInserire,
    sospesiDaAggiornareRpc,
    nuovoSospesoRpc
  );
  
  await gestisciStampaAbbuono({
    ...movimentoDaSalvare,
    createdByEmail: session?.user?.email || "",
  });

  completaInserimentoMovimento(
    payload,
    !usaRpcPerQuestoMovimento
  );
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
      const { error } = await salvaQuadraturaDb({
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
    const { error } = await salvaQuadraturaDb({
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
      const { error } = await chiudiGiornataDb(
        giornataDbId,
        totals
      );
    
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
        const { error } = await riapriGiornataDb(
          giornataDbId,
          motivo
        );
    
        if (error) {
          console.error(error);
          alert("Giornata riaperta localmente, ma non aggiornata su Supabase.");
        }
      }
    }
  
  async function ricalcolaAvanziDa(dataRiferimento: string) {
    const { error } = await ricalcolaAvanziDaDb(dataRiferimento);
  
    if (error) {
      console.error(error);
    }
  }
  
  async function aggiornaVersamento(value: string) {
    setVersamento(value);
  
    if (!giornataDbId) return;
  
    const { error } = await aggiornaVersamentoDb(
      giornataDbId,
      value
    )
  
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
  formAutoMode={formAutoMode}
  setFormAutoMode={setFormAutoMode}
  saveForm={saveForm}
  resetForm={resetForm}
  fileInputRef={fileInputRef}
  handleImportFile={handleImportFile}
  openImportFileDialog={openImportFileDialog}
  handleTipoMovimentoChange={handleTipoMovimentoChange}
  tipiMovimento={tipiMovimento}
  modalitaPagamento={modalitaPagamento}
  referentiSospesi={referentiSospesi}
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
/>
  
{/* ======================================================
    UI - IMPORT COMPAGNIA
====================================================== */}
   <ImportCompagnia
      importCompagnia={importCompagnia}
      numeroPolizzaCompleto={numeroPolizzaCompleto}
      euro={euro}
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
    />

{/* ======================================================
    UI - REPORT
====================================================== */}
       <ReportPanel
          movimenti={movimenti}
          sospesi={sospesi}
          giornataCorrente={giornataCorrente}
          statoGiornata={giornataChiusa ? "Chiusa" : "Aperta"}
          supervisore={session?.user?.email || ""}
          cassaFisicaIniziale={avanzoPrecedente}
          versamento={Number(versamento || 0)}
        />
{/* ======================================================
    FINE UI - REPORT
====================================================== */}
        </main>
      </div>
    </div>
  );
}
