import type { FormState } from "./types";

export const emptyForm: FormState = {
  ramo: "",
  polizza: "",
  contraente: "",
  referenteSospesi: "",
  referenteSospesiId: "",
  importo: "",
  importoIncassato: "",
  sconto: "0",
  modalita: "C",
  dataAssegno: "",
  sub: "100",
  tipo: "Titolo del giorno",
  note: "",
  dataInizioSubagente: "",
  dataFineSubagente: "",
  manualInput: false,
};
