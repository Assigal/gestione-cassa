import React from "react";
import { Card, CardContent } from "../ui/card";
import type { FormState } from "../../types";
import { FormMovimentoHeader } from "./FormMovimentoHeader";
import { TitoloDelGiornoFields } from "./TitoloDelGiornoFields";
import { VersamentoSubagenteFields } from "./VersamentoSubagenteFields";
import { RecuperoSospesoFields } from "./RecuperoSospesoFields";
import { VarieFields } from "./VarieFields";
import { FormActions } from "./FormActions";

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
  
  const updateForm = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return ( 
         <Card className="sticky top-4 z-30 rounded-2xl border border-slate-300 bg-white shadow-md">
            <CardContent className="space-y-2 p-3">
              <FormMovimentoHeader
                tipoMovimento={form.tipo}
                tipiMovimento={tipiMovimento}
                isEditing={Boolean(editingMovement)}
                isImportSelected={Boolean(selectedImportRow)}
                giornataChiusa={giornataChiusa}
                onTipoMovimentoChange={handleTipoMovimentoChange}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleImportFile}
              />

              {form.tipo === "Titolo del giorno" && (
                <TitoloDelGiornoFields
                  sub={form.sub}
                  ramo={form.ramo}
                  polizza={form.polizza}
                  contraente={form.contraente}
                  importo={form.importo}
                  importoIncassato={form.importoIncassato}
                  sconto={form.sconto}
                  modalita={form.modalita}
                  dataAssegno={form.dataAssegno}
                  referenteSospesi_id={form.referenteSospesi_id}
                  note={form.note}
                  modalitaPagamento={modalitaPagamento}
                  referentiSospesi={referentiSospesi}
                  giornataCorrente={giornataCorrente}
                  onSubChange={(value) =>
                    setForm({ ...form, sub: value })
                  }
                  onRamoChange={(value) =>
                    setForm({ ...form, ramo: value })
                  }
                  onPolizzaChange={(value) =>
                    setForm({ ...form, polizza: value })
                  }
                  onContraenteChange={(value) =>
                    setForm({ ...form, contraente: value })
                  }
                  onImportoChange={(value) => {
                    setFormAutoMode(false);

                    setForm({
                      ...form,
                      importo: value,
                    });
                  }}

                  onImportoIncassatoChange={(value) => {
                    setFormAutoMode(false);

                    setForm({
                      ...form,
                      importoIncassato: value,
                    });
                  }}

                  onScontoChange={(value) => {
                    setFormAutoMode(false);

                    setForm({
                      ...form,
                      sconto: value,
                    });
                  }}
                  onModalitaChange={(value) =>
                    setForm({
                      ...form,
                      modalita: value,
                      dataAssegno:
                        value === "A" ? form.dataAssegno : "",
                      referenteSospesi_id:
                        value === "S" ? form.referenteSospesi_id : "",
                      referenteSospesi:
                        value === "S" ? form.referenteSospesi : "",
                    })
                  }
                  onDataAssegnoChange={(value) =>
                    setForm({
                      ...form,
                      dataAssegno: value,
                    })
                  }
                  onReferenteChange={(id, nome) =>
                    setForm({
                      ...form,
                      referenteSospesi_id: id,
                      referenteSospesi: nome,
                    })
                  }
                  onNoteChange={(value) =>
                    setForm({
                      ...form,
                      note: value,
                    })
                  }
                />
              )}

              {form.tipo === "Versamento subagente" && (
                <VersamentoSubagenteFields
                  sub={form.sub}
                  importo={form.importo}
                  modalita={form.modalita}
                  dataInizioSubagente={form.dataInizioSubagente}
                  dataFineSubagente={form.dataFineSubagente}
                  note={form.note}
                  modalitaPagamento={modalitaPagamento}
                  onSubChange={(value) =>
                    setForm({
                      ...form,
                      sub: value,
                    })
                  }
                  onImportoChange={(value) => {
                    setFormAutoMode(false);

                    setForm({
                      ...form,
                      importo: value,
                    });
                  }}
                  onModalitaChange={(value) =>
                    setForm({
                      ...form,
                      modalita: value,
                    })
                  }
                  onDataInizioChange={(value) =>
                    setForm({
                      ...form,
                      dataInizioSubagente: value,
                    })
                  }
                  onDataFineChange={(value) =>
                    setForm({
                      ...form,
                      dataFineSubagente: value,
                    })
                  }
                  onNoteChange={(value) =>
                    setForm({
                      ...form,
                      note: value,
                    })
                  }
                />
              )}

              {form.tipo === "Varie" && (
                <VarieFields
                  importo={form.importo}
                  modalita={form.modalita}
                  note={form.note}
                  modalitaPagamento={modalitaPagamento}
                  onImportoChange={(value) => {
                    setFormAutoMode(false);

                    setForm({
                      ...form,
                      importo: value,
                    });
                  }}
                  onModalitaChange={(value) =>
                    setForm({
                      ...form,
                      modalita: value,
                    })
                  }
                  onNoteChange={(value) =>
                    setForm({
                      ...form,
                      note: value,
                    })
                  }
                />
              )}

              {form.tipo === "Recupero sospeso" && (
                <RecuperoSospesoFields
                  sub={form.sub}
                  ramo={form.ramo}
                  polizza={form.polizza}
                  contraente={form.contraente}
                  importo={form.importo}
                  importoIncassato={form.importoIncassato}
                  sconto={form.sconto}
                  modalita={form.modalita}
                  dataAssegno={form.dataAssegno}
                  referenteSospesi_id={form.referenteSospesi_id}
                  note={form.note}
                  modalitaPagamento={modalitaPagamento}
                  referentiSospesi={referentiSospesi}
                  onSubChange={(value) =>
                    setForm({
                      ...form,
                      sub: value,
                    })
                  }
                  onRamoChange={(value) =>
                    setForm({
                      ...form,
                      ramo: value,
                    })
                  }
                  onPolizzaChange={(value) =>
                    setForm({
                      ...form,
                      polizza: value,
                    })
                  }
                  onContraenteChange={(value) =>
                    setForm({
                      ...form,
                      contraente: value,
                    })
                  }
                  onImportoChange={(value) => {
                    setFormAutoMode(false);

                    setForm({
                      ...form,
                      importo: value,
                    });
                  }}
                  onImportoIncassatoChange={(value) => {
                    setFormAutoMode(false);

                    setForm({
                      ...form,
                      importoIncassato: value,
                    });
                  }}
                  onScontoChange={(value) => {
                    setFormAutoMode(false);

                    setForm({
                      ...form,
                      sconto: value,
                    });
                  }}
                  onModalitaChange={(value) =>
                    setForm({
                      ...form,
                      modalita: value,
                      dataAssegno: value === "A" ? form.dataAssegno : "",
                    })
                  }
                  onDataAssegnoChange={(value) =>
                    setForm({
                      ...form,
                      dataAssegno: value,
                    })
                  }
                  onReferenteChange={(id, nome) =>
                    setForm({
                      ...form,
                      referenteSospesi_id: id,
                      referenteSospesi: nome,
                    })
                  }
                  onNoteChange={(value) =>
                    setForm({
                      ...form,
                      note: value,
                    })
                  }
                />
              )}

              <FormActions
                  tipo={form.tipo}
                  netto={euro(
                    Number(form.importo || 0) -
                      (isVersamentoSubagente(form.tipo)
                        ? 0
                        : Number(form.sconto || 0))
                  )}
                  riduzioneResiduo={
                    form.tipo === "Recupero sospeso" &&
                    selectedSospesoIds.length > 0
                      ? euro(
                          Number(form.importo || 0) -
                            Number(form.sconto || 0)
                        )
                      : undefined
                  }
                  isEditing={Boolean(editingMovement)}
                  isImportSelected={Boolean(selectedImportRow)}
                  giornataChiusa={giornataChiusa}
                  onSubmit={saveForm}
                  onCancel={() => {
                    setEditingMovement(null);
                    resetForm();
                  }}
                />
            </CardContent>
          </Card>
  );
}
