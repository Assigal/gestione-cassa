type VersamentoSubagenteFieldsProps = {
  sub: string;
  importo: string;
  modalita: string;
  dataInizioSubagente: string;
  dataFineSubagente: string;
  note: string;

  modalitaPagamento: {
    codice: string;
    descrizione: string;
  }[];

  onSubChange: (value: string) => void;
  onImportoChange: (value: string) => void;
  onModalitaChange: (value: string) => void;
  onDataInizioChange: (value: string) => void;
  onDataFineChange: (value: string) => void;
  onNoteChange: (value: string) => void;
};

export function VersamentoSubagenteFields({
  sub,
  importo,
  modalita,
  dataInizioSubagente,
  dataFineSubagente,
  note,
  modalitaPagamento,
  onSubChange,
  onImportoChange,
  onModalitaChange,
  onDataInizioChange,
  onDataFineChange,
  onNoteChange,
}: VersamentoSubagenteFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
      <label className="space-y-1 lg:col-span-1">
        <span className="text-xs font-medium text-slate-500">
          Sub
        </span>

        <input
          maxLength={3}
          className="h-9 w-full rounded-xl border px-2.5 text-sm"
          value={sub}
          onChange={(event) =>
            onSubChange(
              event.target.value
                .replace(/[^0-9]/g, "")
                .slice(0, 3)
            )
          }
        />
      </label>

      <label className="space-y-1 lg:col-span-2">
        <span className="text-xs font-medium text-slate-500">
          Dal
        </span>

        <input
          type="date"
          className="h-9 w-full rounded-xl border px-2.5 text-sm"
          value={dataInizioSubagente}
          onChange={(event) =>
            onDataInizioChange(event.target.value)
          }
        />
      </label>

      <label className="space-y-1 lg:col-span-2">
        <span className="text-xs font-medium text-slate-500">
          Al
        </span>

        <input
          type="date"
          className="h-9 w-full rounded-xl border px-2.5 text-sm"
          value={dataFineSubagente}
          onChange={(event) =>
            onDataFineChange(event.target.value)
          }
        />
      </label>

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
          Modalità di pagamento
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

      <label className="space-y-1 lg:col-span-3">
        <span className="text-xs font-medium text-slate-500">
          Note
        </span>

        <input
          className="h-9 w-full rounded-xl border px-2.5 text-sm"
          placeholder="Annotazioni sul versamento"
          value={note}
          onChange={(event) =>
            onNoteChange(event.target.value)
          }
        />
      </label>
    </div>
  );
}