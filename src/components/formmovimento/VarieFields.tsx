type ModalitaPagamento = {
  codice: string;
  descrizione: string;
};

type VarieFieldsProps = {
  importo: string;
  modalita: string;
  note: string;

  modalitaPagamento: ModalitaPagamento[];

  onImportoChange: (value: string) => void;
  onModalitaChange: (value: string) => void;
  onNoteChange: (value: string) => void;
};

export function VarieFields({
  importo,
  modalita,
  note,
  modalitaPagamento,
  onImportoChange,
  onModalitaChange,
  onNoteChange,
}: VarieFieldsProps) {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5">
        <p className="text-sm font-semibold text-amber-900">
            ⚠ Movimento di rettifica manuale
        </p>

        <p className="text-xs leading-4 text-amber-800">
            Utilizzare esclusivamente per operazioni straordinarie non gestibili con
            le procedure ordinarie. La motivazione è obbligatoria e sarà riportata nei
            report di controllo e nell’audit permanente.
        </p>
        </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
        <label className="space-y-1 lg:col-span-2">
          <span className="text-xs font-medium text-slate-500">
            Importo
          </span>

          <input
            type="number"
            step="0.01"
            className="h-9 w-full rounded-xl border px-2.5 text-sm"
            value={importo}
            onChange={(event) =>
              onImportoChange(event.target.value)
            }
          />
        </label>

        <label className="space-y-1 lg:col-span-2">
          <span className="text-xs font-medium text-slate-500">
            Modalità
          </span>

          <select
            className="h-9 w-full rounded-xl border px-2.5 text-sm"
            value={modalita}
            onChange={(event) =>
              onModalitaChange(event.target.value)
            }
          >
            {modalitaPagamento.map((item) => (
              <option key={item.codice} value={item.codice}>
                {item.descrizione}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 lg:col-span-8">
          <span className="text-xs font-medium text-slate-500">
            Note *
          </span>

          <input
            required
            className="h-9 w-full rounded-xl border px-2.5 text-sm"
            placeholder="Indicare chiaramente la motivazione obbligatoria della rettifica"
            value={note}
            onChange={(event) =>
              onNoteChange(event.target.value)
            }
          />
        </label>
      </div>
    </div>
  );
}