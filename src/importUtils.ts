import type { ImportRow } from "./types";


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
