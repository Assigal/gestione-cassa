import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calcolaValoriTitolo } from "../utils";
import { FormMovimentoHeader } from "./FormMovimentoHeader";
import { TitoloDelGiornoFields } from "./formmovimento/TitoloDelGiornoFields";

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
  isVersamentoSubagente,
  euro,
  giornataCorrente,
  selectedSospesoIds,
}: FormMovimentoProps) {
 
  return (
    
    <>
       <Card className="sticky top-4 z-30 rounded-2xl border border-slate-300 bg-white shadow-md">
            <CardContent className="space-y-2 p-3">
              <FormMovimentoHeader
                tipoMovimento={form.tipo}
                tipiMovimento={tipiMovimento}
                isEditing={Boolean(editingMovement)}
                isImportSelected={Boolean(selectedImportRow)}
                giornataChiusa={giornataChiusa}
                onTipoMovimentoChange={handleTipoMovimentoChange}
                onImportCompagnia={openImportFileDialog}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleImportFile}
              />

              <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">

                <label className="space-y-1 lg:col-span-1">
                  <span className="text-xs font-medium text-slate-500">Subagenzia</span>
                  <input maxLength={3} className="h-9 w-full rounded-xl border px-2.5 text-sm" value={form.sub} onChange={(e) => setForm({ ...form, sub: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })} />
                </label>
                 
                {!isVersamentoSubagente(form.tipo) && (
                  <label className="space-y-1 lg:col-span-2">
                    <span className="text-xs font-medium text-slate-500">
                      Polizza
                    </span>

                    <div className="flex h-9 w-full items-center rounded-xl border bg-white px-2.5 text-sm">
                      <input
                        maxLength={3}
                        className="w-12 border-0 bg-transparent p-0 text-center outline-none"
                        placeholder="030"
                        value={form.ramo}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            ramo: e.target.value
                              .replace(/[^0-9]/g, "")
                              .slice(0, 3),
                          })
                        }
                        aria-label="Ramo polizza"
                      />

                      <span className="mx-1 text-slate-400">/</span>

                      <input
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 outline-none"
                        placeholder="12345678"
                        value={form.polizza}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            polizza: e.target.value,
                          })
                        }
                        aria-label="Numero polizza"
                      />
                    </div>
                  </label>
                )}

                {form.tipo === "Versamento subagente" && (
                  <>
                    <label className="space-y-1 lg:col-span-2">
                      <span className="text-xs font-medium text-slate-500">Da data</span>
                      <input type="date" className="h-9 w-full rounded-xl border px-2.5 text-sm" value={form.dataInizioSubagente} onChange={(e) => setForm({ ...form, dataInizioSubagente: e.target.value })} />
                    </label>
                    <label className="space-y-1 lg:col-span-2">
                      <span className="text-xs font-medium text-slate-500">A data</span>
                      <input type="date" className="h-9 w-full rounded-xl border px-2.5 text-sm" value={form.dataFineSubagente} onChange={(e) => setForm({ ...form, dataFineSubagente: e.target.value })} />
                    </label>
                  </>
                )}

                {!isVersamentoSubagente(form.tipo) && (
                  <>
                    <label className="space-y-1 lg:col-span-4">
                      <span className="text-xs font-medium text-slate-500">Contraente</span>
                      <input className="h-9 w-full rounded-xl border px-2.5 text-sm" value={form.contraente} onChange={(e) => setForm({ ...form, contraente: e.target.value })} />
                    </label>
                   
                  </>
                )}

                <label className="space-y-1 lg:col-span-2">
                  <span className="text-xs font-medium text-slate-500">
                    {isVersamentoSubagente(form.tipo)
                      ? "Importo versato"
                      : "Importo titolo"}
                  </span>
                
                  <input
                    type="number"
                    className="h-9 w-full rounded-xl border px-2.5 text-sm"
                    value={form.importo}
                    onChange={(e) => {
                      const nuovoImporto = e.target.value;
                
                      if (form.tipo === "Titolo del giorno" && formAutoMode) {
                        const { sconto, incassato } = calcolaValoriTitolo(
                          Number(nuovoImporto || 0)
                        );
                
                        setForm({
                          ...form,
                          importo: nuovoImporto,
                          sconto: String(sconto),
                          importoIncassato: String(incassato),
                        });
                
                        return;
                      }
                
                      setForm({
                        ...form,
                        importo: nuovoImporto,
                      });
                    }}
                  />
                </label>
                
                {form.tipo === "Titolo del giorno" && (
                  <label className="space-y-1 lg:col-span-2">
                    <span className="text-xs font-medium text-slate-500">
                      Importo incassato
                    </span>
                
                    <input
                      type="number"
                      className="h-9 w-full rounded-xl border px-2.5 text-sm"
                      value={form.importoIncassato}
                      onChange={(e) => {
                        setFormAutoMode(false);
                
                        setForm({
                          ...form,
                          importoIncassato: e.target.value,
                        });
                      }}
                    />
                  </label>
                )}
                {!isVersamentoSubagente(form.tipo) && (
                  <label className="space-y-1 lg:col-span-2">
                    <span className="text-xs font-medium text-slate-500">Sconto</span>
                    <input type="number" className="h-9 w-full rounded-xl border px-2.5 text-sm" value={form.sconto} onChange={(e) => setForm({ ...form, sconto: e.target.value })} />
                  </label>
                )}

                <label className="space-y-1 lg:col-span-3">
                  <span className="text-xs font-medium text-slate-500">
                    Modalità effettiva
                  </span>
                
                  <select
                    className="h-9 w-full rounded-xl border px-2.5 text-sm"
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
                      className="h-9 w-full rounded-xl border px-2.5 text-sm"
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
                        className="h-9 w-full rounded-xl border px-2.5 text-sm"
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
                  <input className="h-9 w-full rounded-xl border px-2.5 text-sm" placeholder="Annotazioni su sospesi, recuperi o squadrature" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
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
