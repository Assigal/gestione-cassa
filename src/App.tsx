import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  Building2,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Trash2,
  Search,
  Upload,
  Wallet,
  AlertTriangle,
  ArrowRightCircle,
  Landmark,
  Users,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "./supabaseClient";

const GIORNATA_CORRENTE = new Date().toISOString().slice(0, 10);


const tipiMovimento = [
  "Titolo del giorno",
  "Recupero sospeso",
  "Versamento subagente",
  "Varie",
];

interface AllocazioneRecupero {
  sospesoId: string;
  incasso: number;
  sconto: number;
}

interface Movimento {
  id: number;
  ramo: string;
  polizza: string;
  contraente: string;
  referenteSospesi: string;
  importo: number;
  sconto: number;
  netto: number;
  modalita: string;
  tipo: string;
  sub: string;
  dataAssegno: string;
  segno: number;
  note: string;
  dataInizioSubagente: string;
  dataFineSubagente: string;
  allocazioniRecupero: AllocazioneRecupero[];
}

interface Sospeso {
  id: string;
  referenteSospesi: string;
  contraente: string;
  ramo: string;
  polizza: string;
  importoOriginario: number;
  recuperato: number;
  scontoApplicato: number;
  residuo: number;
  stato: string;
  dataSospeso: string;
  note: string;
}

interface ImportRow {
  id: string;
  sub: string;
  ramo: string;
  polizza: string;
  contraente: string;
  importo: number;
  modalitaCompagnia: string;
  stato: string;
  fileOrigine?: string;
}

interface FormState {
  ramo: string;
  polizza: string;
  contraente: string;
  referenteSospesi: string;
  importo: string;
  sconto: string;
  modalita: string;
  dataAssegno: string;
  sub: string;
  tipo: string;
  note: string;
  dataInizioSubagente: string;
  dataFineSubagente: string;
}

const emptyForm: FormState = {
  ramo: "",
  polizza: "",
  contraente: "",
  referenteSospesi: "",
  importo: "",
  sconto: "0",
  modalita: "C",
  dataAssegno: "",
  sub: "100",
  tipo: "Titolo del giorno",
  note: "",
  dataInizioSubagente: "",
  dataFineSubagente: "",
};

const movimentiRegistratiSeed: Movimento[] = [];
const sospesiSeed: Sospeso[] = [];
const importCompagniaSeed: ImportRow[] = [];

function euro(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value || 0);
}

function numeroPolizzaCompleto(row: { ramo?: string; polizza?: string }) {
  if (!row.ramo && !row.polizza) return "-";
  if (!row.ramo) return row.polizza || "-";
  if (!row.polizza) return row.ramo;
  return `${row.ramo}/${row.polizza}`;
}

function descrizioneMovimento(row: Movimento) {
  if (row.tipo === "Versamento subagente") {
    return row.dataInizioSubagente && row.dataFineSubagente
      ? `Periodo ${row.dataInizioSubagente} → ${row.dataFineSubagente}`
      : "Versamento subagente";
  }
  return numeroPolizzaCompleto(row);
}

function isAssegnoPostdatato(
  row: { modalita: string; dataAssegno: string },
  giornata: string
) {
  return row.modalita === "A" && !!row.dataAssegno && row.dataAssegno > giornata;
}

function isVersamentoSubagente(tipo: string) {
  return tipo === "Versamento subagente";
}

function deltaLabel(value: number) {
 const n = Number(value || 0);
  if (n === 0) return "Quadrato";
  return n > 0 ? `Eccedenza ${euro(n)}` : `Mancanza ${euro(Math.abs(n))}`;
}

function normalizzaIntestazione(value: string) {
  return value.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

function parseImportoItaliano(value: string) {
  if (!value) return 0;
  const cleaned = String(value)
    .replace(/€/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizzaModalitaPagamento(
  value: string,
  codCassa?: string | null
) {
  const v = (value || "").trim().toUpperCase();
  const cassa = (codCassa || "").trim().toUpperCase();

  // Caso speciale IMEL
  if (!v && cassa === "IMEL") {
    return "M";
  }

  const map: Record<string, string> = {
    C: "C",
    CONTANTI: "C",

    A: "A",
    ASSEGNO: "A",

    B: "B",
    BONIFICO: "B",

    J: "J",
    POS: "J",

    F: "F",
    FINITALIA: "F",

    H: "H",
    APP: "H",

    M: "M",
    MENSILIZZAZIONE: "M",

    Y: "Y",
    "VIRTUAL POS": "Y",

    D: "D",
    DIREZIONE: "D",

    S: "S",
    SOSPESO: "S",
  };

  return map[v] || v;
}

function parseCsvLine(line: string, separator = ";") {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function importaCsvCompagnia(csvText: string, fileName: string): ImportRow[] {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  const headers = parseCsvLine(lines[0]);
  const normalizedHeaders = headers.map(normalizzaIntestazione);

  const findColumn = (names: string[]) =>
    normalizedHeaders.findIndex((h) =>
      names.map(normalizzaIntestazione).includes(h)
    );

  const idxRamo = findColumn(["Ramo"]);
  const idxPolizza = findColumn(["Polizza"]);
  const idxContraente = findColumn(["Contraente"]);
  const idxTotale = findColumn(["Totale"]);
  const idxTipoPag = findColumn(["Tipo Pag.", "Tipo Pag", "Tipo pagamento"]);

  const missing: string[] = [];
  if (idxRamo < 0) missing.push("Ramo");
  if (idxPolizza < 0) missing.push("Polizza");
  if (idxContraente < 0) missing.push("Contraente");
  if (idxTotale < 0) missing.push("Totale");
  if (idxTipoPag < 0) missing.push("Tipo Pag.");

  if (missing.length) {
    throw new Error(`Colonne mancanti: ${missing.join(", ")}`);
  }

  const grouped = new Map<string, ImportRow>();

  lines.slice(1).forEach((line, index) => {
    const columns = parseCsvLine(line);
    const totale = parseImportoItaliano(columns[idxTotale]);

    if (!totale) return;

    const ramo = columns[idxRamo]?.trim() || "";
    const polizza = columns[idxPolizza]?.trim() || "";
    const contraente = columns[idxContraente]?.trim() || "";
    const modalitaCompagnia = columns[idxTipoPag]?.trim() || "";

    const key = [ramo, polizza, contraente, modalitaCompagnia].join("|");
    const existing = grouped.get(key);

    if (existing) {
      existing.importo = Number((existing.importo + totale).toFixed(2));
    } else {
      grouped.set(key, {
        id: `imp-${Date.now()}-${index}`,
        ramo,
        polizza,
        contraente,
        importo: Number(totale.toFixed(2)),
        modalitaCompagnia,
        stato: "Da lavorare",
        fileOrigine: fileName,
      });
    }
  });

  return Array.from(grouped.values());
}
function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "ok" | "warn" | "blue" | "neutral" | "purple";
}) {
  const styles: Record<string, string> = {
    default: "bg-slate-100 text-slate-700",
    ok: "bg-emerald-100 text-emerald-700",
    warn: "bg-rose-100 text-rose-700",
    blue: "bg-blue-100 text-blue-700",
    neutral: "bg-slate-200 text-slate-700",
    purple: "bg-violet-100 text-violet-700",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[variant]}`}>{children}</span>;
}

function SidebarMetric({
  icon: Icon,
  label,
  value,
  note,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wide ${highlight ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
          <p className={`mt-1 font-semibold tracking-tight ${highlight ? "text-2xl" : "text-xl"}`}>{value}</p>
          {note && <p className={`mt-1 text-xs ${highlight ? "text-slate-300" : "text-slate-500"}`}>{note}</p>}
        </div>
        <div className={`rounded-2xl p-2 ${highlight ? "bg-white/10" : "bg-slate-100"}`}>
          <Icon className={`h-4 w-4 ${highlight ? "text-white" : "text-slate-700"}`} />
        </div>
      </div>
    </div>
  );
}

export default function GestioneCassa() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<any>(null);
  const [profiloUtente, setProfiloUtente] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [modalitaPagamento, setModalitaPagamento] = useState<any[]>([]);
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
    
  useEffect(() => {
      const caricaModalitaPagamento = async () => {
        const { data, error } = await supabase
          .from("modalita_pagamento")
          .select("id, codice, descrizione, alimenta_cassa_fisica, richiede_data_assegno, crea_sospeso, attiva")
          .order("codice");
    
        if (error) {
          console.error("Errore caricamento modalità pagamento:", error);
          return;
        }
    
        console.log("MODALITA PAGAMENTO:", { data, error });
    
        setModalitaPagamento(data || []);
      };
    
      caricaModalitaPagamento();
    }, []);
    
    const getDescrizioneModalita = (codice: string | null | undefined) => {
      const map: Record<string, string> = {
        C: "Contanti",
        A: "Assegno",
        B: "Bonifico",
        J: "POS",
        F: "Finitalia",
        H: "App",
        M: "Mensilizzazione",
        Y: "Virtual POS",
        D: "Direzione",
        S: "Sospeso",
        W: "Bonifico Multi",
        X: "Scoperto",
      };
      const normalized = String(codice || "").trim().toUpperCase();

      return map[normalized] || codice || "-";
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
        allocazioniRecupero: [],
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

  function toggleSospeso(id: string) {
    setSelectedSospesoIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }

  function prepareRecuperoSospesi() {
    const selected = sospesi.filter((s) => selectedSospesoIds.includes(s.id));
    if (!selected.length) return;
    const referente = selected[0].referenteSospesi;
    const importo = selected.reduce((sum, s) => sum + s.residuo, 0);
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
      note: "Recupero sospeso selezionato",
    });
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
        .update({
          tipo_movimento: payload.tipo,
          codice_subagenzia: payload.sub,
          ramo: payload.ramo || null,
          polizza: payload.polizza || null,
          contraente: payload.contraente || null,
          referente_sospesi: payload.referenteSospesi || null,
          modalita_pagamento: payload.modalita,
          data_assegno: payload.dataAssegno || null,
          importo_lordo: payload.importo,
          sconto: payload.sconto,
          importo_netto: payload.netto,
          segno: payload.segno,
          note: payload.note || null,
          updated_by: null,
          updated_by_email: session?.user?.email || null,
          updated_at: new Date().toISOString(),
          data_inizio_subagente: payload.dataInizioSubagente || null,
          data_fine_subagente: payload.dataFineSubagente || null,
        })
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
    .insert({
      data_sospeso: giornataCorrente,
      referente_sospesi: nuovoSospeso.referenteSospesi,
      contraente: nuovoSospeso.contraente || null,
      ramo: nuovoSospeso.ramo || null,
      polizza: nuovoSospeso.polizza || null,
      importo_originario: nuovoSospeso.importoOriginario,
      recuperato: nuovoSospeso.recuperato,
      sconto_applicato: nuovoSospeso.scontoApplicato,
      residuo: nuovoSospeso.residuo,
      stato: nuovoSospeso.stato,
      note: nuovoSospeso.note || null,
    })
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
          referente_sospesi: payload.referenteSospesi,
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
        motivazione
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
      .insert({
        data_sospeso: giornataCorrente,
        referente_sospesi: nuovoSospeso.referenteSospesi,
        contraente: nuovoSospeso.contraente || null,
        ramo: nuovoSospeso.ramo || null,
        polizza: nuovoSospeso.polizza || null,
        importo_originario: nuovoSospeso.importoOriginario,
        recuperato: nuovoSospeso.recuperato,
        sconto_applicato: nuovoSospeso.scontoApplicato,
        residuo: nuovoSospeso.residuo,
        stato: nuovoSospeso.stato,
        note: nuovoSospeso.note || null,
      })
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
      stampaModuloSospeso(nuovoSospeso);
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
      const { error } = await supabase.from("sospesi_cassa").insert({
        data_sospeso: giornataCorrente,
        referente_sospesi: nuovoSospeso.referenteSospesi,
        contraente: nuovoSospeso.contraente || null,
        ramo: nuovoSospeso.ramo || null,
        polizza: nuovoSospeso.polizza || null,
        importo_originario: nuovoSospeso.importoOriginario,
        recuperato: 0,
        sconto_applicato: 0,
        residuo: nuovoSospeso.residuo,
        stato: nuovoSospeso.stato,
        note: nuovoSospeso.note,
      });

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
      .insert({
        giornata_id: giornataDbId,
        tipo_movimento: payload.tipo,
        codice_subagenzia: payload.sub,
        ramo: payload.ramo || null,
        polizza: payload.polizza || null,
        contraente: payload.contraente || null,
        referente_sospesi: payload.referenteSospesi || null,
        modalita_pagamento: payload.modalita,
        data_assegno: payload.dataAssegno || null,
        importo_lordo: payload.importo,
        sconto: payload.sconto,
        importo_netto: payload.netto,
        segno: payload.segno,
        note: payload.note || null,
        created_by: null,
        created_by_email: session?.user?.email || null,
        data_inizio_subagente: payload.dataInizioSubagente || null,
        data_fine_subagente: payload.dataFineSubagente || null,
      })
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
          motivazione
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

  function stampaModuloSospeso(sospeso: Sospeso) {
    const scadenza = window.prompt(
      "Entro quale data il cliente si impegna a chiudere il sospeso? Formato: gg/mm/aaaa"
    );
  
    if (!scadenza) return;
  
    const html = `
      <html>
        <head>
          <title>Modulo sospeso</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
            h1 { text-align: center; font-size: 22px; margin-bottom: 30px; }
            .box { border: 1px solid #333; padding: 18px; margin-bottom: 20px; }
            .row { margin: 10px 0; font-size: 14px; }
            .label { font-weight: bold; }
            .firma { margin-top: 60px; display: flex; justify-content: space-between; }
            .linea { border-top: 1px solid #333; width: 220px; text-align: center; padding-top: 8px; }
            @media print {
              body { padding: 30px; }
            }
          </style>
        </head>
        <body>
          <h1>Modulo riconoscimento sospeso</h1>
  
          <div class="box">
            <div class="row"><span class="label">Data sospeso:</span> ${sospeso.dataSospeso}</div>
            <div class="row"><span class="label">Contraente:</span> ${sospeso.contraente}</div>
            <div class="row"><span class="label">Polizza:</span> ${sospeso.ramo}/${sospeso.polizza}</div>
            <div class="row"><span class="label">Importo sospeso:</span> ${euro(sospeso.residuo)}</div>
            <div class="row"><span class="label">Referente:</span> ${sospeso.referenteSospesi}</div>
            <div class="row"><span class="label">Scadenza impegno pagamento:</span> ${scadenza}</div>
          </div>
  
          <p>
            Il sottoscritto riconosce il debito sopra indicato e si impegna a regolarizzare
            l'importo sospeso entro la data indicata.
          </p>
  
          <div class="firma">
            <div class="linea">Firma cliente</div>
            <div class="linea">Operatore</div>
          </div>
  
          <script>
            window.print();
          </script>
        </body>
      </html>
    `;
  
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  function stampaModuloAbbuono(movimento: Movimento, motivazione: string) {
    const html = `
      <html>
        <head>
          <title>Modulo abbuono provvigioni</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
            h1 { text-align: center; font-size: 22px; margin-bottom: 30px; }
            .box { border: 1px solid #333; padding: 18px; margin-bottom: 20px; }
            .row { margin: 10px 0; font-size: 14px; }
            .label { font-weight: bold; }
            .firma { margin-top: 60px; display: flex; justify-content: space-between; }
            .linea { border-top: 1px solid #333; width: 220px; text-align: center; padding-top: 8px; }
          </style>
        </head>
        <body>
          <h1>Modulo abbuono provvigioni</h1>
  
          <div class="box">
            <div class="row"><span class="label">Data:</span> ${giornataCorrente}</div>
            <div class="row"><span class="label">Contraente:</span> ${movimento.contraente}</div>
            <div class="row"><span class="label">Polizza:</span> ${movimento.ramo}/${movimento.polizza}</div>
            <div class="row"><span class="label">Importo lordo:</span> ${euro(movimento.importo)}</div>
            <div class="row"><span class="label">Sconto applicato:</span> ${euro(movimento.sconto)}</div>
            <div class="row"><span class="label">Motivazione:</span> ${motivazione}</div>
          </div>
  
          <p>
            Il cliente dichiara di essere stato informato dell'abbuono provvigionale applicato.
          </p>
  
          <div class="firma">
            <div class="linea">Firma cliente</div>
            <div class="linea">Operatore</div>
          </div>
  
          <script>
            window.print();
          </script>
        </body>
      </html>
    `;
  
    const win = window.open("", "_blank");
  
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }
  
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md rounded-2xl shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div>
              <h1 className="text-xl font-semibold">Accesso Gestione Cassa</h1>
              <p className="text-sm text-slate-500">
                Inserisci le credenziali operative.
              </p>
            </div>
  
            <input
              type="email"
              className="w-full rounded-2xl border px-3 py-2"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
  
            <input
              type="password"
              className="w-full rounded-2xl border px-3 py-2"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
  
            <Button className="w-full rounded-2xl" onClick={login}>
              Accedi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-2 xl:sticky xl:top-4 xl:h-[calc(100vh-48px)] xl:overflow-auto">
          <Card className="rounded-2xl bg-white shadow-sm">
            <CardContent className="space-y-2 p-3">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="rounded-2xl bg-slate-900 p-3">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Gestione cassa</h1>
                  <p className="text-xs text-slate-500">
                    {giornataCorrente} · {session.user.email}
                  </p>
                  
                  <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    Ruolo: {profiloUtente?.ruolo || "nessuno"}
                  </div>
                  
                  <Button
                    variant="outline"
                    className="mt-2 rounded-2xl text-xs"
                    onClick={logout}
                  >
                    Esci
                  </Button>
                  <input
                    type="date"
                    className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm"
                    value={giornataCorrente}
                    onChange={(e) => setGiornataCorrente(e.target.value)}
                  />
                  {giornataChiusa && (
                    <div className="mt-2 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
                      Giornata chiusa e non modificabile
                    </div>
                  )}
                  {giornataDbId && (
                    <div className="mt-2 rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700">
                      Giornata collegata a Supabase
                    </div>
                  )}
                </div>
              </div>

              <SidebarMetric icon={Landmark} label="Avanzo precedente" value={euro(avanzoPrecedente)} />
              <SidebarMetric icon={Banknote} label="Incassi fisici" value={euro(totals.incassiFisici)} note="Contanti e assegni validi" />
              <SidebarMetric icon={Building2} label="Versamento" value={euro(totals.versamento)} />
              <div className="rounded-2xl border bg-white p-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-slate-500">
                    Importo versamento del giorno
                  </span>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm"
                    value={versamento}
                    onChange={(e) => aggiornaVersamento(e.target.value)}
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  Il versamento decrementa la cassa.
                </p>
              </div>
              <SidebarMetric icon={Wallet} label="Cassa" value={euro(totals.cassa)} note="Valore teorico" highlight />
              <SidebarMetric icon={AlertTriangle} label="Totale sospesi" value={euro(totals.totaleSospesi)} />
              <SidebarMetric icon={RotateCcw} label="Recuperi sospesi" value={euro(totals.totaleRecuperi)} />
              <SidebarMetric icon={Building2} label="Totale Compagnia" value={euro(totals.totaleCompagnia)} note="Titoli giorno sub 100" />

             <div className="space-y-2 border-t pt-3">
  <div className="rounded-2xl border bg-white p-2">
    <p className="text-sm font-semibold">Quadratura mezza giornata</p>

    {!quadMezzaBloccata ? (
      <>
        <input
          type="number"
          className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm"
          placeholder="Cassa reale"
          value={quadMezza.cassaReale}
          onChange={(e) => setQuadMezza({ cassaReale: e.target.value })}
        />

        <div
          className={`mt-2 rounded-xl p-2 text-xs font-semibold ${
            totals.squadraturaMezza === 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {deltaLabel(totals.squadraturaMezza)}
        </div>

        <Button
          className="mt-2 w-full rounded-2xl"
          onClick={bloccaQuadraturaMezza}
        >
          Blocca mezza giornata
        </Button>
      </>
    ) : (
      <div className="mt-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Cassa teorica</span>
          <span className="font-semibold">{euro(quadMezzaBloccata.cassaTeorica)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Cassa reale</span>
          <span className="font-semibold">{euro(quadMezzaBloccata.cassaReale)}</span>
        </div>
        <div
          className={`rounded-xl p-2 font-semibold ${
            quadMezzaBloccata.squadratura === 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {deltaLabel(quadMezzaBloccata.squadratura)}
        </div>
        <p className="text-slate-500">
          Bloccata il {quadMezzaBloccata.dataOra}
        </p>
      </div>
    )}
  </div>

  <div className="rounded-2xl border bg-white p-2">
    <p className="text-sm font-semibold">Quadratura fine giornata</p>

    {!quadSeraBloccata ? (
      <>
        <input
          type="number"
          className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm"
          placeholder="Cassa reale"
          value={quadSera.cassaReale}
          onChange={(e) => setQuadSera({ cassaReale: e.target.value })}
        />

        <div
          className={`mt-2 rounded-xl p-2 text-xs font-semibold ${
            totals.squadraturaSera === 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {deltaLabel(totals.squadraturaSera)}
        </div>

        <Button
          className="mt-2 w-full rounded-2xl"
          onClick={bloccaQuadraturaSera}
        >
          Blocca fine giornata
        </Button>
      </>
    ) : (
      <div className="mt-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Cassa teorica</span>
          <span className="font-semibold">{euro(quadSeraBloccata.cassaTeorica)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Cassa reale</span>
          <span className="font-semibold">{euro(quadSeraBloccata.cassaReale)}</span>
        </div>
        <div
          className={`rounded-xl p-2 font-semibold ${
            quadSeraBloccata.squadratura === 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {deltaLabel(quadSeraBloccata.squadratura)}
        </div>
        <p className="text-slate-500">
          Bloccata il {quadSeraBloccata.dataOra}
        </p>
      </div>
    )}
  </div>
</div>

              <Button
                className="w-full rounded-2xl"
                onClick={chiudiGiornata}
                disabled={giornataChiusa}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {giornataChiusa ? "Giornata chiusa" : "Chiudi giornata"}
              </Button>
              {giornataChiusa && isAdmin && (
                <Button
                  variant="outline"
                  className="w-full rounded-2xl border-amber-300 bg-amber-50 font-semibold text-amber-800 hover:bg-amber-100"
                  onClick={riapriGiornata}
                >
                  Riapri giornata
                </Button>
            )}
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-6">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {editingMovement ? "Modifica movimento" : selectedImportRow ? "Lavora movimento importato" : "Nuovo movimento"}
                    </h2>
                    <p className="text-sm text-slate-500">Input operativo della giornata</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={openImportFileDialog}
                    disabled={giornataChiusa}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Importa Compagnia
                  </Button>
                </div>
              </div>

              {selectedImportRow && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
                  <p className="font-medium text-amber-900">Origine Compagnia</p>
                  <p className="text-amber-800">
                    Modalità indicata: {getDescrizioneModalita(selectedImportRow.modalitaCompagnia)}
                  </p>
                  <p className="text-amber-800">La modalità effettiva può essere diversa.</p>
                </div>
              )}

               <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
                <label className="space-y-1 lg:col-span-3">
                  <span className="text-xs font-medium text-slate-500">Tipo movimento</span>
                  <select className="w-full rounded-2xl border px-3 py-2" value={form.tipo} onChange={(e) => handleTipoMovimentoChange(e.target.value)}>
                    {tipiMovimento.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </label>

                <label className="space-y-1 lg:col-span-1">
                  <span className="text-xs font-medium text-slate-500">Subagenzia</span>
                  <input maxLength={3} className="w-full rounded-2xl border px-3 py-2" value={form.sub} onChange={(e) => setForm({ ...form, sub: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })} />
                </label>
                 
                 {!isVersamentoSubagente(form.tipo) && (
                  <label className="space-y-1 lg:col-span-1">
                    <span className="text-xs font-medium text-slate-500">Ramo</span>
                    <input maxLength={3} className="w-full rounded-2xl border px-3 py-2" placeholder="001" value={form.ramo} onChange={(e) => setForm({ ...form, ramo: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })} />
                  </label>
                )}

                {!isVersamentoSubagente(form.tipo) && (
                  <label className="space-y-1 lg:col-span-2">
                    <span className="text-xs font-medium text-slate-500">Numero polizza</span>
                    <input className="w-full rounded-2xl border px-3 py-2" value={form.polizza} onChange={(e) => setForm({ ...form, polizza: e.target.value })} />
                  </label>
                )}

                {form.tipo === "Versamento subagente" && (
                  <>
                    <label className="space-y-1 lg:col-span-2">
                      <span className="text-xs font-medium text-slate-500">Da data</span>
                      <input type="date" className="w-full rounded-2xl border px-3 py-2" value={form.dataInizioSubagente} onChange={(e) => setForm({ ...form, dataInizioSubagente: e.target.value })} />
                    </label>
                    <label className="space-y-1 lg:col-span-2">
                      <span className="text-xs font-medium text-slate-500">A data</span>
                      <input type="date" className="w-full rounded-2xl border px-3 py-2" value={form.dataFineSubagente} onChange={(e) => setForm({ ...form, dataFineSubagente: e.target.value })} />
                    </label>
                  </>
                )}

                {!isVersamentoSubagente(form.tipo) && (
                  <>
                    <label className="space-y-1 lg:col-span-5">
                      <span className="text-xs font-medium text-slate-500">Contraente</span>
                      <input className="w-full rounded-2xl border px-3 py-2" value={form.contraente} onChange={(e) => setForm({ ...form, contraente: e.target.value })} />
                    </label>

                    <label className="space-y-1 lg:col-span-5">
                      <span className="text-xs font-medium text-slate-500">Referente sospesi</span>
                      <input className="w-full rounded-2xl border px-3 py-2" value={form.referenteSospesi} onChange={(e) => setForm({ ...form, referenteSospesi: e.target.value })} />
                    </label>
                  </>
                )}

                <label className="space-y-1 lg:col-span-2">
                  <span className="text-xs font-medium text-slate-500">{isVersamentoSubagente(form.tipo) ? "Importo versato" : "Importo titolo"}</span>
                  <input type="number" className="w-full rounded-2xl border px-3 py-2" value={form.importo} onChange={(e) => setForm({ ...form, importo: e.target.value })} />
                </label>

                {!isVersamentoSubagente(form.tipo) && (
                  <label className="space-y-1 lg:col-span-2">
                    <span className="text-xs font-medium text-slate-500">Sconto</span>
                    <input type="number" className="w-full rounded-2xl border px-3 py-2" value={form.sconto} onChange={(e) => setForm({ ...form, sconto: e.target.value })} />
                  </label>
                )}

                <label className="space-y-1 lg:col-span-3">
                  <span className="text-xs font-medium text-slate-500">
                    Modalità effettiva
                  </span>
                
                  <select
                    className="w-full rounded-2xl border px-3 py-2"
                    value={form.modalita}
                    onChange={(e) =>
                      setForm({ ...form, modalita: e.target.value })
                    }
                  >
                    <option value="">TEST MODALITA</option>
                    <option value="">
                      DEBUG {modalitaPagamento.length}
                    </option>
                  
                    {modalitaPagamento.map((m) => (
                      <option key={m.codice} value={m.codice}>
                        {m.descrizione}
                      </option>
                    ))}
                  </select>
                </label>
                
                {form.modalita === "A" && (
                  <label className="space-y-1 lg:col-span-2">
                    <span className="text-xs font-medium text-slate-500">
                      Data assegno
                    </span>
                
                    <input
                      type="date"
                      className="w-full rounded-2xl border px-3 py-2"
                      value={form.dataAssegno}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dataAssegno: e.target.value,
                        })
                      }
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_260px]">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Note</span>
                  <input className="w-full rounded-2xl border px-3 py-2" placeholder="Annotazioni su sospesi, recuperi o squadrature" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                </label>

                <div className="rounded-2xl bg-slate-100 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Netto cassa</span>
                    <span className="font-semibold">{euro(Number(form.importo || 0) - (isVersamentoSubagente(form.tipo) ? 0 : Number(form.sconto || 0)))}</span>
                  </div>
                  {form.tipo === "Recupero sospeso" && selectedSospesoIds.length > 0 && (
                    <p className="mt-2 rounded-xl bg-white p-2 text-xs text-slate-600">
                      Riduzione residuo prevista: {euro(Number(form.importo || 0) + Number(form.sconto || 0))}
                    </p>
                  )}
                  <Button
                    className="mt-3 w-full rounded-2xl"
                    onClick={saveForm}
                    disabled={giornataChiusa}
                  >
                    {editingMovement ? "Salva modifiche" : selectedImportRow ? "Conferma movimento" : "Inserisci movimento"}
                  </Button>
                  {editingMovement && (
                    <Button
                      variant="outline"
                      className="mt-2 w-full rounded-2xl"
                        onClick={() => {
                          setEditingMovement(null);
                          resetForm();
                        }}
                    >
                        Annulla modifica
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b p-3">
                <div>
                  <h2 className="text-lg font-semibold">Movimenti registrati nella giornata</h2>
                  <p className="text-sm text-slate-500">Movimenti validati e lavorati dall'operatore</p>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input className="w-full rounded-2xl border px-9 py-2 text-sm" placeholder="Cerca polizza o contraente" />
                </div>
              </div>

              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-emerald-100 text-left text-xs uppercase tracking-wide text-emerald-900">
                    <tr>
                      <th className="px-3 py-2">Polizza / Periodo</th>
                      <th className="px-3 py-2">Sub</th>
                      <th className="px-3 py-2">Operatore</th>
                      <th className="px-3 py-2">Contraente</th>
                      <th className="px-3 py-2">Referente</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Modalità</th>
                      <th className="px-3 py-2 text-right">Lordo</th>
                      <th className="px-3 py-2 text-right">Netto</th>
                      <th className="px-3 py-2">Note</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimenti.map((m) => {
                      const postdatato = isAssegnoPostdatato(m, giornataCorrente);
                      const warnPayment = m.modalita === "S" || postdatato;
                      return (
                        <tr key={m.id} className="border-t bg-white hover:bg-slate-50">
                          <td className="px-3 py-2"><div className="font-medium">{descrizioneMovimento(m)}</div></td>
                          <td className="px-3 py-2">{m.sub}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">
                            <div>{m.createdByEmail || "-"}</div>
                          
                            {m.updatedByEmail &&
                              m.updatedByEmail !== m.createdByEmail && (
                                <div className="mt-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                                  Mod. {m.updatedByEmail}
                                </div>
                              )}
                          </td>
                          <td className="px-3 py-2">{m.contraente || "-"}</td>
                          <td className="px-3 py-2">{m.referenteSospesi ? <Badge variant="purple">{m.referenteSospesi}</Badge> : "-"}</td>
                          <td className="px-3 py-2"><Badge variant="neutral">{m.tipo}</Badge></td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col items-start gap-1">
                              <Badge variant={warnPayment ? "warn" : m.modalita === "J" ? "blue" : "ok"}>
                                {getDescrizioneModalita(m.modalita)}
                              </Badge>
                              {postdatato && <span className="text-xs font-medium text-rose-700">Data assegno: {m.dataAssegno}</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">{euro(m.importo)}</td>
                          <td className="px-3 py-2 text-right font-medium">{euro(m.netto)}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{m.note || "-"}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => editMovement(m)}
                                disabled={giornataChiusa}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-rose-600 hover:text-rose-700"
                                onClick={() => deleteMovement(m.id)}
                                disabled={giornataChiusa}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-amber-200 bg-amber-50/40 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-amber-200 p-3">
                <div>
                  <h2 className="text-lg font-semibold">Movimenti importati da Excel Compagnia</h2>
                  <p className="text-sm text-slate-600">Non alimentano cassa o totale Compagnia finché non vengono lavorati</p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={openImportFileDialog}
                  disabled={giornataChiusa}
                >
                  <Upload className="mr-2 h-4 w-4" /> Avvia import
                </Button>
              </div>

              <div className="max-h-[360px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-amber-100 text-left text-xs uppercase tracking-wide text-amber-900">
                    <tr>
                      <th className="px-3 py-2">Sub</th>
                      <th className="px-3 py-2">Polizza</th>
                      <th className="px-3 py-2">Contraente</th>
                      <th className="px-3 py-2">Modalità Compagnia</th>
                      <th className="px-3 py-2">File</th>
                      <th className="px-3 py-2 text-right">Importo</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {importCompagnia.map((row) => (
                      <tr key={row.id} className={`border-t border-amber-100 bg-white/70 hover:bg-white ${selectedImport === row.id ? "ring-2 ring-amber-300" : ""}`}>
                        <td className="px-3 py-2 font-medium">
                          {row.sub || "100"}
                        </td>    
                        <td className="px-3 py-2"><div className="font-medium">{numeroPolizzaCompleto(row)}</div></td>
                        <td className="px-3 py-2">{row.contraente}</td>
                        <td className="px-3 py-2"><Badge>{row.modalitaCompagnia}</Badge></td>
                        <td className="px-3 py-2 text-xs text-slate-500">{row.fileOrigine || "demo"}</td>
                        <td className="px-3 py-2 text-right font-medium">{euro(row.importo)}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              className="rounded-xl"
                              onClick={() => selectImported(row)}
                              disabled={giornataChiusa}
                            >
                              Lavora <ArrowRightCircle className="ml-2 h-4 w-4" />
                            </Button>
                           <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-rose-600 hover:text-rose-700"
                              onClick={() => deleteImportedMovement(row.id)}
                              disabled={giornataChiusa}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-violet-200 bg-violet-50/40 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-violet-200 p-3">
                <div>
                  <h2 className="text-lg font-semibold">Recupero sospesi</h2>
                  <p className="text-sm text-slate-600">Cerca per referente, contraente o polizza. Puoi selezionare più sospesi dello stesso referente.</p>
                </div>
                <Button className="rounded-2xl" onClick={prepareRecuperoSospesi}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Recupera selezionati
                </Button>
              </div>

              <div className="border-b border-violet-100 p-3">
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input className="w-full rounded-2xl border px-9 py-2 text-sm" placeholder="Cerca referente sospesi, contraente o polizza" value={searchSospesi} onChange={(e) => setSearchSospesi(e.target.value)} />
                </div>
              </div>

              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-violet-100 text-left text-xs uppercase tracking-wide text-violet-900">
                    <tr>
                      <th className="px-3 py-2"></th>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Referente</th>
                      <th className="px-3 py-2">Contraente / Polizza</th>
                      <th className="px-3 py-2 text-right">Originario</th>
                      <th className="px-3 py-2 text-right">Recuperato</th>
                      <th className="px-3 py-2 text-right">Sconto</th>
                      <th className="px-3 py-2 text-right">Residuo</th>
                      <th className="px-3 py-2">Stato</th>
                      <th className="px-3 py-2">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sospesiFiltrati.map((s) => (
                      <tr key={s.id} className={`border-t border-violet-100 bg-white/70 hover:bg-white ${selectedSospesoIds.includes(s.id) ? "ring-2 ring-violet-300" : ""}`}>
                        <td className="px-3 py-2"><input type="checkbox" checked={selectedSospesoIds.includes(s.id)} onChange={() => toggleSospeso(s.id)} /></td>
                        <td className="px-3 py-2 font-medium">{s.dataSospeso || "-"}</td>
                        <td className="px-3 py-2"><Badge variant="purple">{s.referenteSospesi}</Badge></td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{s.contraente}</div>
                          <div className="text-xs text-slate-500">{numeroPolizzaCompleto(s)}</div>
                        </td>
                        <td className="px-3 py-2 text-right">{euro(s.importoOriginario)}</td>
                        <td className="px-3 py-2 text-right">{euro(s.recuperato)}</td>
                        <td className="px-3 py-2 text-right">{euro(s.scontoApplicato)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{euro(s.residuo)}</td>
                        <td className="px-3 py-2"><Badge variant={s.stato === "Chiuso" ? "ok" : "warn"}>{s.stato}</Badge></td>
                        <td className="px-3 py-2 text-xs text-slate-500">{s.note || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
           <Card className="rounded-2xl shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div>
                  <h2 className="text-lg font-semibold">Report</h2>
                  <p className="text-sm text-slate-500">
                    Area reportistica e stampe operative
                  </p>
                </div>
            
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Button
                    variant="outline"
                    className="h-24 rounded-2xl text-base font-semibold"
                  >
                    Giornata di cassa
                  </Button>
            
                  <Button
                    variant="outline"
                    className="h-24 rounded-2xl text-base font-semibold"
                  >
                    Report range date
                  </Button>
            
                  <Button
                    variant="outline"
                    className="h-24 rounded-2xl text-base font-semibold"
                  >
                    Report sospesi
                  </Button>
            
                  <Button
                    variant="outline"
                    className="h-24 rounded-2xl text-base font-semibold"
                  >
                    Chiusure subagenti
                  </Button>
                </div>
              </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}
