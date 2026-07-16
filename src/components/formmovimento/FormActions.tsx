import { Button } from "../ui/button";

type FormActionsProps = {
  tipo: string;
  netto: string;
  riduzioneResiduo?: string;

  isEditing: boolean;
  isImportSelected: boolean;
  giornataChiusa: boolean;

  onSubmit: () => void;
  onCancel: () => void;
};

export function FormActions({
  tipo,
  netto,
  riduzioneResiduo,
  isEditing,
  isImportSelected,
  giornataChiusa,
  onSubmit,
  onCancel,
}: FormActionsProps) {
  const mostraNetto =
    tipo === "Titolo del giorno" ||
    tipo === "Recupero sospeso";

  const testoPulsante = isEditing
    ? "Salva modifiche"
    : isImportSelected
      ? "Conferma movimento"
      : tipo === "Versamento subagente"
        ? "Registra versamento"
        : tipo === "Recupero sospeso"
          ? "Registra recupero"
          : tipo === "Varie"
            ? "Registra rettifica"
            : "Inserisci movimento";

  const stilePulsante =
    tipo === "Varie"
      ? "bg-amber-600 text-white hover:bg-amber-700"
      : "bg-slate-900 text-white hover:bg-slate-800";

  return (
    <div className="flex flex-col gap-2 border-t border-slate-200 pt-2 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        {mostraNetto && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-sm">
              <span className="text-slate-500">Netto:</span>{" "}
              <span className="font-semibold text-slate-900">
                {netto}
              </span>
            </p>

            {riduzioneResiduo && (
              <p className="text-xs font-medium text-amber-700">
                Riduzione residuo prevista: {riduzioneResiduo}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 lg:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-10 min-w-28 rounded-xl"
          onClick={onCancel}
        >
          Annulla
        </Button>

        <Button
          type="button"
          className={`h-10 min-w-48 rounded-xl font-semibold ${stilePulsante}`}
          onClick={onSubmit}
          disabled={giornataChiusa}
        >
          {testoPulsante}
        </Button>
      </div>
    </div>
  );
}