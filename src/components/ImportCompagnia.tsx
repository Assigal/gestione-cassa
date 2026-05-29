import React from "react";
import { Upload, ArrowRightCircle, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "./Badge";

type ImportCompagniaProps = {
  importCompagnia: ImportCompagniaRow[];
  
  numeroPolizzaCompleto: (row: any) => string;
  euro: (value: number) => string;
  
  selectedImport: string | null;
  giornataChiusa: boolean;

  openImportFileDialog: () => void;
  selectImported: (row: ImportCompagniaRow) => void;
  deleteImportedMovement: (id: number) => void;

  getDescrizioneModalita: (codice: string | null | undefined) => string;
};

export function ImportCompagnia({
  importCompagnia,
  numeroPolizzaCompleto,
  euro,
  selectedImport,
  giornataChiusa,
  openImportFileDialog,
  selectImported,
  deleteImportedMovement,
  getDescrizioneModalita,
}: ImportCompagniaProps) {
  return (
    <>
          <Card className="rounded-2xl border-amber-200 bg-amber-50/40 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-amber-200 p-3">
                <div>
                  <h2 className="text-lg font-semibold">Movimenti importati da Excel Compagnia</h2>
                  <p className="text-sm text-slate-600">Non alimentano cassa o totale Compagnia finché non vengono lavorati</p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={openImportFileDialog}
                  disabled={giornataChiusa}
                >
                  <Upload className="mr-2 h-4 w-4" /> Avvia import
                </Button>
              </div>

              <div className="max-h-[360px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-amber-100 text-left text-xs uppercase tracking-wide text-amber-900">
                    <tr>
                      <th className="px-3 py-2">Sub</th>
                      <th className="px-3 py-2">Polizza</th>
                      <th className="px-3 py-2">Contraente</th>
                      <th className="px-3 py-2">Modalità Compagnia</th>
                      <th className="px-3 py-2">File</th>
                      <th className="px-3 py-2 text-right">Importo</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {importCompagnia.map((row) => (
                      <tr key={row.id} className={`border-t border-amber-100 bg-white/70 hover:bg-white ${selectedImport === row.id ? "ring-2 ring-amber-300" : ""}`}>
                        <td className="px-3 py-2 font-medium">
                          {row.sub || "100"}
                        </td>    
                        <td className="px-3 py-2"><div className="font-medium">{numeroPolizzaCompleto(row)}</div></td>
                        <td className="px-3 py-2">{row.contraente}</td>
                        <td className="px-3 py-2"><Badge>{getDescrizioneModalita(row.modalitaCompagnia)}</Badge></td>
                        <td className="px-3 py-2 text-xs text-slate-500">{row.fileOrigine || "demo"}</td>
                        <td className="px-3 py-2 text-right font-medium">{euro(row.importo)}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              className="rounded-xl"
                              onClick={() => selectImported(row)}
                              disabled={giornataChiusa}
                            >
                              Lavora <ArrowRightCircle className="ml-2 h-4 w-4" />
                            </Button>
                           <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-rose-600 hover:text-rose-700"
                              onClick={() => deleteImportedMovement(row.id)}
                              disabled={giornataChiusa}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>    </>
  );
}

