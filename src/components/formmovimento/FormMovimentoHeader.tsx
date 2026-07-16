import { ClipboardList } from "lucide-react";


type FormMovimentoHeaderProps = {
  tipoMovimento: string;
  tipiMovimento: string[];
  isEditing: boolean;
  isImportSelected: boolean;
  giornataChiusa: boolean;
  onTipoMovimentoChange: (tipo: string) => void;
};

export function FormMovimentoHeader({
  tipoMovimento,
  tipiMovimento,
  isEditing,
  isImportSelected,
  giornataChiusa,
  onTipoMovimentoChange,
}: FormMovimentoHeaderProps) {
  return (
    <div className="flex flex-nowrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="shrink-0 rounded-xl bg-slate-100 p-2">
          <ClipboardList className="h-4 w-4" />
        </div>

        <select
          className="h-9 min-w-[190px] rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"
          value={tipoMovimento}
          onChange={(event) =>
            onTipoMovimentoChange(event.target.value)
          }
          disabled={isEditing || giornataChiusa}
          aria-label="Tipo movimento"
        >
          {tipiMovimento.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>

        {isEditing && (
          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
            Modifica
          </span>
        )}

        {!isEditing && isImportSelected && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
            Da Compagnia
          </span>
        )}
      </div>

    </div>
  );
}