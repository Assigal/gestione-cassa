
export function buildReferentePayload(
  payload: {
    referenteSospesi?: string;
    referenteSospesiId?: string;
    contraente?: string;
  }
){
  return {
    referente_sospesi:
      payload.referenteSospesi ||
      payload.contraente ||
      null,

    referente_sospesi_id:
      payload.referenteSospesiId || null,
  };
}

export function buildMovimentoPayload(
  payload: any,
  giornataDbId: string | null,
  session: any
){
  return {
    giornata_id: giornataDbId,
    sospeso_id: payload.sospesoId || null,

    tipo_movimento: payload.tipo,
    codice_subagenzia: payload.sub,

    ramo: payload.ramo || null,
    polizza: payload.polizza || null,
    contraente: payload.contraente || null,

    ...buildReferentePayload(payload),

    modalita_pagamento: payload.modalita,
    data_assegno: payload.dataAssegno || null,

    importo_lordo: payload.importo,
    sconto: payload.sconto,
    importo_netto: payload.netto,

    segno: payload.segno,

    note: payload.note || null,

    created_by: null,
    created_by_email: session?.user?.email || null,

    data_inizio_subagente:
      payload.dataInizioSubagente || null,

    data_fine_subagente:
      payload.dataFineSubagente || null,
  };
}

export function buildMovimentoUpdatePayload(
  payload: any,
  session: any
){
  return {
    tipo_movimento: payload.tipo,
    codice_subagenzia: payload.sub,

    ramo: payload.ramo || null,
    polizza: payload.polizza || null,
    contraente: payload.contraente || null,

    ...buildReferentePayload(payload),

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
  };
}

export function buildSospesoPayload(
  sospeso: any,
  giornataCorrente: string
){
  return {
    data_sospeso: sospeso.dataSospeso || giornataCorrente,

    ...buildReferentePayload(sospeso),

    contraente: sospeso.contraente || null,
    ramo: sospeso.ramo || null,
    polizza: sospeso.polizza || null,

    importo_originario: sospeso.importoOriginario,
    recuperato: sospeso.recuperato,
    sconto_applicato: sospeso.scontoApplicato,
    residuo: sospeso.residuo,

    stato: sospeso.stato,
    note: sospeso.note || null,
  };
}
  
export function buildSospesoAggiornatoRpcPayload(sospeso: any) {
  return {
    id: sospeso.id,
    recuperato: sospeso.recuperato,
    sconto_applicato: sospeso.scontoApplicato,
    residuo: sospeso.residuo,
    stato: sospeso.stato,
    note: sospeso.note || null,
  };
}
