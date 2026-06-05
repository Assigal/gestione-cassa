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
