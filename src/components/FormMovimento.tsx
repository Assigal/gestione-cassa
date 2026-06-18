import React from "react";
import { ClipboardList, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type FormMovimentoProps = {
  editingMovement: number | null;
  setEditingMovement: React.Dispatch<React.SetStateAction<number | null>>;

  giornataChiusa: boolean;
  selectedImportRow: any;

  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  formAutoMode: boolean;
  setFormAutoMode: React.Dispatch<React.SetStateAction<boolean>>;
  saveForm: () => void;
  resetForm: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  openImportFileDialog: () => void;
  handleTipoMovimentoChange: (tipo: string) => void;
  
  tipiMovimento: string[];
  modalitaPagamento: any[];
  referentiSospesi: any[];
  
  getDescrizioneModalita: (codice: string | null | undefined) => string;
  isVersamentoSubagente: (tipo: string) => boolean;
  euro: (value: number) => string;
  
  giornataCorrente: string;
  selectedSospesoIds: string[];
};

export function FormMovimento({
  editingMovement,
  setEditingMovement,
  giornataChiusa,
  selectedImportRow,
  form,
  formAutoMode,
  setFormAutoMode,
  setForm,
  saveForm,
  resetForm,
  fileInputRef,
  handleImportFile,
  openImportFileDialog,
  handleTipoMovimentoChange,
  tipiMovimento,
  modalitaPagamento,
  referentiSospesi,
  getDescrizioneModalita,
  isVersamentoSubagente,
  euro,
  giornataCorrente,
  selectedSospesoIds,
}: FormMovimentoProps) {
 
  return (
    
    <>
       <Card className="rounded-2xl shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {editingMovement ? "Modifica movimento" : selectedImportRow ? "Lavora movimento importato" : "Nuovo movimento"}
                    </h2>
                    <p className="text-sm text-slate-500">Input operativo della giornata</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={openImportFileDialog}
                    disabled={giornataChiusa}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Importa Compagnia
                  </Button>
                </div>
              </div>

              {selectedImportRow && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
                  <p className="font-medium text-amber-900">Origine Compagnia</p>
                  <p className="text-amber-800">
                    Modalità indicata: {getDescrizioneModalita(selectedImportRow.modalitaCompagnia)}
                  </p>
                  <p className="text-amber-800">La modalità effettiva può essere diversa.</p>
                </div>
              )}

               <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
                <label className="space-y-1 lg:col-span-3">
                  <span className="text-xs font-medium text-slate-500">Tipo movimento</span>
                  <select className="w-full rounded-2xl border px-3 py-2" value={form.tipo} onChange={(e) => handleTipoMovimentoChange(e.target.value)}>
                    {tipiMovimento.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </label>

                <label className="space-y-1 lg:col-span-1">
                  <span className="text-xs font-medium text-slate-500">Subagenzia</span>
                  <input maxLength={3} className="w-full rounded-2xl border px-3 py-2" value={form.sub} onChange={(e) => setForm({ ...form, sub: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })} />
                </label>
                 
                 {!isVersamentoSubagente(form.tipo) && (
                  <label className="space-y-1 lg:col-span-1">
                    <span className="text-xs font-medium text-slate-500">Ramo</span>
                    <input maxLength={3} className="w-full rounded-2xl border px-3 py-2" placeholder="001" value={form.ramo} onChange={(e) => setForm({ ...form, ramo: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })} />
                  </label>
                )}

                {!isVersamentoSubagente(form.tipo) && (
                  <label className="space-y-1 lg:col-span-2">
                    <span className="text-xs font-medium text-slate-500">Numero polizza</span>
                    <input className="w-full rounded-2xl border px-3 py-2" value={form.polizza} onChange={(e) => setForm({ ...form, polizza: e.target.value })} />
                  </label>
                )}

                {form.tipo === "Versamento subagente" && (
                  <>
                    <label className="space-y-1 lg:col-span-2">
                      <span className="text-xs font-medium text-slate-500">Da data</span>
                      <input type="date" className="w-full rounded-2xl border px-3 py-2" value={form.dataInizioSubagente} onChange={(e) => setForm({ ...form, dataInizioSubagente: e.target.value })} />
                    </label>
                    <label className="space-y-1 lg:col-span-2">
                      <span className="text-xs font-medium text-slate-500">A data</span>
                      <input type="date" className="w-full rounded-2xl border px-3 py-2" value={form.dataFineSubagente} onChange={(e) => setForm({ ...form, dataFineSubagente: e.target.value })} />
                    </label>
                  </>
                )}

                {!isVersamentoSubagente(form.tipo) && (
                  <>
                    <label className="space-y-1 lg:col-span-5">
                      <span className="text-xs font-medium text-slate-500">Contraente</span>
                      <input className="w-full rounded-2xl border px-3 py-2" value={form.contraente} onChange={(e) => setForm({ ...form, contraente: e.target.value })} />
                    </label>
                   
                  </>
                )}

                <label className="space-y-1 lg:col-span-2">
                  <span className="text-xs font-medium text-slate-500">{isVersamentoSubagente(form.tipo) ? "Importo versato" : "Importo titolo"}</span>
                  <input type="number" className="w-full rounded-2xl border px-3 py-2" value={form.importo} onChange={(e) => setForm({ ...form, importo: e.target.value })} />
                </label>

                 {form.tipo === "Titolo del giorno" && (
                  <label className="space-y-1 lg:col-span-2">
                    <span className="text-xs font-medium text-slate-500">
                      Importo incassato
                    </span>
                    <input
                      type="number"
                      className="w-full rounded-2xl border px-3 py-2"
                      value={form.importoIncassato}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          importoIncassato: e.target.value,
                        })
                      }
                    />
                  </label>
                )}

                {!isVersamentoSubagente(form.tipo) && (
                  <label className="space-y-1 lg:col-span-2">
                    <span className="text-xs font-medium text-slate-500">Sconto</span>
                    <input type="number" className="w-full rounded-2xl border px-3 py-2" value={form.sconto} onChange={(e) => setForm({ ...form, sconto: e.target.value })} />
                  </label>
                )}

                <label className="space-y-1 lg:col-span-3">
                  <span className="text-xs font-medium text-slate-500">
                    Modalità effettiva
                  </span>
                
                  <select
                    className="w-full rounded-2xl border px-3 py-2"
                    value={form.modalita}
                    onChange={(e) =>
                      setForm({ ...form, modalita: e.target.value })
                    }
                  >
                   
                    {modalitaPagamento.map((m) => (
                      <option key={m.codice} value={m.codice}>
                        {m.descrizione}
                      </option>
                    ))}
                  </select>
                </label>
                
                {form.modalita === "A" && (
                  <label className="space-y-1 lg:col-span-2">
                    <span className="text-xs font-medium text-slate-500">
                      Data assegno
                    </span>
                
                    <input
                      type="date"
                      className="w-full rounded-2xl border px-3 py-2"
                      value={form.dataAssegno}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dataAssegno: e.target.value,
                        })
                      }
                    />
                  </label>
                )}

               {(form.modalita === "S" ||
                (form.modalita === "A" &&
                  form.dataAssegno &&
                  form.dataAssegno > giornataCorrente)) && (  
                 <label className="space-y-1 lg:col-span-5">
                      <span className="text-xs font-medium text-slate-500">
                        Referente sospesi
                      </span>
                    
                      <select
                        className="w-full rounded-2xl border px-3 py-2"
                        value={form.referenteSospesiId || ""}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const referente = referentiSospesi.find((r) => r.id === selectedId);
                        
                          setForm({
                            ...form,
                            referenteSospesiId: selectedId,
                            referenteSospesi: referente?.nome || "",
                          });
                        }}
                      >
                        <option value="">Nessun referente</option>

                        {referentiSospesi.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nome}
                          </option>
                        ))}
                      </select>
                    </label>
                 )}

              </div>

              <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_260px]">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Note</span>
                  <input className="w-full rounded-2xl border px-3 py-2" placeholder="Annotazioni su sospesi, recuperi o squadrature" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                </label>

                <div className="rounded-2xl bg-slate-100 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Netto cassa</span>
                    <span className="font-semibold">{euro(Number(form.importo || 0) - (isVersamentoSubagente(form.tipo) ? 0 : Number(form.sconto || 0)))}</span>
                  </div>
                  {form.tipo === "Recupero sospeso" && selectedSospesoIds.length > 0 && (
                    <p className="mt-2 rounded-xl bg-white p-2 text-xs text-slate-600">
                      Riduzione residuo prevista: {euro(Number(form.importo || 0) - Number(form.sconto || 0))}
                    </p>
                  )}
                  <Button
                    className="mt-3 w-full rounded-2xl"
                    onClick={saveForm}
                    disabled={giornataChiusa}
                  >
                    {editingMovement ? "Salva modifiche" : selectedImportRow ? "Conferma movimento" : "Inserisci movimento"}
                  </Button>
                  {editingMovement && (
                    <Button
                      variant="outline"
                      className="mt-2 w-full rounded-2xl"
                        onClick={() => {
                          setEditingMovement(null);
                          resetForm();
                        }}
                    >
                        Annulla modifica
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
    </>
  );
}
