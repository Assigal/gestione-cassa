import type { Movimento, AllocazioneRecupero } from "./types";

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
  return (
    payload.tipo === "Titolo del giorno" &&
    (
      payload.modalita === "S" ||
      (
        payload.modalita === "A" &&
        payload.dataAssegno > giornataCorrente
      )
    )
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
  return {
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
}
