type ModalitaPagamento = {
  codice: string;
  descrizione: string;
};

type ReferenteSospesi = {
  id: string;
  nome: string;
};

type TitoloDelGiornoFieldsProps = {
  sub: string;
  ramo: string;
  polizza: string;
  contraente: string;
  importo: string;
  importoIncassato: string;
  sconto: string;
  modalita: string;
  dataAssegno: string;
  referenteSospesiId: string;
  note: string;

  modalitaPagamento: ModalitaPagamento[];
  referentiSospesi: ReferenteSospesi[];
  giornataCorrente: string;

  onSubChange: (value: string) => void;
  onRamoChange: (value: string) => void;
  onPolizzaChange: (value: string) => void;
  onContraenteChange: (value: string) => void;
  onImportoChange: (value: string) => void;
  onImportoIncassatoChange: (value: string) => void;
  onScontoChange: (value: string) => void;
  onModalitaChange: (value: string) => void;
  onDataAssegnoChange: (value: string) => void;
  onReferenteChange: (id: string, nome: string) => void;
  onNoteChange: (value: string) => void;
};

export function TitoloDelGiornoFields({
  sub,
  ramo,
  polizza,
  contraente,
  importo,
  importoIncassato,
  sconto,
  modalita,
  dataAssegno,
  referenteSospesiId,
  note,
  modalitaPagamento,
  referentiSospesi,
  giornataCorrente,
  onSubChange,
  onRamoChange,
  onPolizzaChange,
  onContraenteChange,
  onImportoChange,
  onImportoIncassatoChange,
  onScontoChange,
  onModalitaChange,
  onDataAssegnoChange,
  onReferenteChange,
  onNoteChange,
}: TitoloDelGiornoFieldsProps) {
  const richiedeReferente =
    modalita === "S" ||
    (modalita === "A" &&
      Boolean(dataAssegno) &&
      dataAssegno > giornataCorrente);

  return (
    <div className="space-y-2">
      {/* Prima riga */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[72px_190px_minmax(220px,1fr)_130px_130px_90px]">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-500">Sub</span>

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

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Polizza
          </span>

          <div className="flex h-9 w-full items-center rounded-xl border bg-white px-2.5 text-sm">
            <input
              maxLength={3}
              className="w-10 border-0 bg-transparent p-0 text-center outline-none"
              placeholder="030"
              value={ramo}
              onChange={(event) =>
                onRamoChange(
                  event.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, 3)
                )
              }
              aria-label="Ramo"
            />

            <span className="mx-1 text-slate-400">/</span>

            <input
              className="min-w-0 flex-1 border-0 bg-transparent p-0 outline-none"
              placeholder="12345678"
              value={polizza}
              onChange={(event) =>
                onPolizzaChange(event.target.value)
              }
              aria-label="Numero polizza"
            />
          </div>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Contraente
          </span>

          <input
            className="h-9 w-full rounded-xl border px-2.5 text-sm"
            value={contraente}
            onChange={(event) =>
              onContraenteChange(event.target.value)
            }
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Importo titolo
          </span>

          <input
            type="number"
            className="h-9 w-full rounded-xl border px-2.5 text-sm"
            value={importo}
            onChange={(event) =>
              onImportoChange(event.target.value)
            }
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Incassato
          </span>

          <input
            type="number"
            className="h-9 w-full rounded-xl border px-2.5 text-sm"
            value={importoIncassato}
            onChange={(event) =>
              onImportoIncassatoChange(event.target.value)
            }
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Sconto
          </span>

          <input
            type="number"
            className="h-9 w-full rounded-xl border px-2.5 text-sm"
            value={sconto}
            onChange={(event) =>
              onScontoChange(event.target.value)
            }
          />
        </label>
      </div>

      {/* Seconda riga */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[230px_minmax(240px,1fr)]">
        <label className="space-y-1">
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

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-500">
            Note
          </span>

          <input
            className="h-9 w-full rounded-xl border px-2.5 text-sm"
            placeholder="Annotazioni su sospesi, recuperi o squadrature"
            value={note}
            onChange={(event) =>
              onNoteChange(event.target.value)
            }
          />
        </label>
      </div>

      {/* Campi condizionali */}
      {(modalita === "A" || richiedeReferente) && (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[190px_minmax(260px,1fr)]">
          {modalita === "A" && (
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-500">
                Data assegno
              </span>

              <input
                type="date"
                className="h-9 w-full rounded-xl border px-2.5 text-sm"
                value={dataAssegno}
                onChange={(event) =>
                  onDataAssegnoChange(event.target.value)
                }
              />
            </label>
          )}

          {richiedeReferente && (
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-500">
                Referente sospesi
              </span>

              <select
                className="h-9 w-full rounded-xl border px-2.5 text-sm"
                value={referenteSospesiId || ""}
                onChange={(event) => {
                  const selectedId = event.target.value;
                  const referente = referentiSospesi.find(
                    (item) => item.id === selectedId
                  );

                  onReferenteChange(
                    selectedId,
                    referente?.nome || ""
                  );
                }}
              >
                <option value="">Nessun referente</option>

                {referentiSospesi.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  );
}