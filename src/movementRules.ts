import type { Movimento, AllocazioneRecupero, AllocazioneRecupero } from "./types";
import { isVersamentoSubagente } from "./utils";

export function movimentoEraSospeso(
  movimento: Movimento | undefined,
  giornataCorrente: string,
  isAssegnoPostdatato: (
    row: { modalita: string; dataAssegno: string },
    giornata: string
  ) => boolean
) {
  return (
    !!movimento &&
    movimento.tipo === "Titolo del giorno" &&
    (
      movimento.modalita === "S" ||
      isAssegnoPostdatato(movimento, giornataCorrente)
    )
  );
}

export function importoMovimentoNonValido(form: FormState): boolean {
  const importo = Number(form.importo || 0);
  return !form.importo || importo === 0;
}

export function payloadGeneraSospeso(
  payload: any,
  giornataCorrente: string
): boolean {
  if (payload.tipo !== "Titolo del giorno") {
    return false;
  }

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

export function movimentoERecuperoSospeso(
  payload: any,
  haSospesiSelezionati: boolean
): boolean {
  return (
    payload.tipo === "Recupero sospeso" &&
    haSospesiSelezionati
  );
}

export function trovaMovimentoDuplicato(
  payload: any,
  editingMovement: number | null,
  movimenti: Movimento[]
): Movimento | null {
  if (
    payload.tipo !== "Titolo del giorno" ||
    !payload.polizza ||
    payload.importo <= 0
  ) {
    return null;
  }

  return (
    movimenti.find(
      (m) =>
        m.tipo === "Titolo del giorno" &&
        m.polizza?.trim() === payload.polizza?.trim() &&
        Number(m.importo) === Number(payload.importo) &&
        m.id !== editingMovement
    ) || null
  );
}

export function creaNuovoSospesoDaPayload(
  payload: Movimento,
  giornataCorrente: string
): Sospeso {
  const importoSospeso = Math.max(
    Number(payload.importo || 0) -
    Number(payload.sconto || 0) -
    Number(payload.incassato || 0),
    0
  );

  return {
    id: `sosp-${Date.now()}`,
    referenteSospesi: payload.referenteSospesi,
    referenteSospesiId: payload.referenteSospesiId,
    contraente: payload.contraente,
    ramo: payload.ramo,
    polizza: payload.polizza,
    importoOriginario: importoSospeso,
    recuperato: 0,
    scontoApplicato: 0,
    residuo: importoSospeso,
    stato: "Aperto",
    dataSospeso: giornataCorrente,
    note: payload.note,
  };
}

export function creaMovimentoDaPayload(
  payload: any,
  createdByEmail: string
): Movimento {
  return {
    id: Date.now(),
    ...payload,
    createdByEmail,
  };
}

export function creaPayloadMovimentoDaForm(
  form: FormState
) {
  const importo = Number(form.importo || 0);
  const versamentoSubagente = isVersamentoSubagente(form.tipo);

  const sconto = versamentoSubagente
    ? 0
    : Number(form.sconto || 0);

  const netto = importo - sconto;
  const incassato =
    form.tipo === "Titolo del giorno"
      ? Number(form.importoIncassato || importo || 0)
      : importo;

  return {
    ramo: versamentoSubagente ? "" : form.ramo,
    polizza: versamentoSubagente ? "" : form.polizza,
    contraente: versamentoSubagente ? "" : form.contraente,
    referenteSospesi: versamentoSubagente
      ? ""
      : form.referenteSospesi || form.contraente,
    referenteSospesiId: versamentoSubagente ? "" : form.referenteSospesiId,
    importo,
    sconto,
    netto,
    incassato,
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
}
