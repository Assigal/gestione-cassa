import React from "react";
import { Search, Edit3, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TabellaMovimentiProps = {
  movimenti: Movimento[];
  giornataCorrente: string;
  giornataChiusa: boolean;
  editMovement: (m: Movimento) => void;
  deleteMovement: (id: number) => void;
  getDescrizioneModalita: (codice: string | null | undefined) => string;
};

export function TabellaMovimenti({
  movimenti,
  giornataCorrente,
  giornataChiusa,
  editMovement,
  deleteMovement,
  getDescrizioneModalita,
}: TabellaMovimentiProps) {
  return (
    <>
      <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b p-3">
                <div>
                  <h2 className="text-lg font-semibold">Movimenti registrati nella giornata</h2>
                  <p className="text-sm text-slate-500">Movimenti validati e lavorati dall'operatore</p>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input className="w-full rounded-2xl border px-9 py-2 text-sm" placeholder="Cerca polizza o contraente" />
                </div>
              </div>

              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-emerald-100 text-left text-xs uppercase tracking-wide text-emerald-900">
                    <tr>
                      <th className="px-3 py-2">Polizza / Periodo</th>
                      <th className="px-3 py-2">Sub</th>
                      <th className="px-3 py-2">Operatore</th>
                      <th className="px-3 py-2">Contraente</th>
                      <th className="px-3 py-2">Referente</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Modalità</th>
                      <th className="px-3 py-2 text-right">Lordo</th>
                      <th className="px-3 py-2 text-right">Netto</th>
                      <th className="px-3 py-2">Note</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>

                    {movimenti.map((m) => {
                      const postdatato = isAssegnoPostdatato(m, giornataCorrente);
                      const warnPayment = m.modalita === "S" || postdatato;
                      return (
                        <tr key={m.id} className="border-t bg-white hover:bg-slate-50">
                          <td className="px-3 py-2"><div className="font-medium">{descrizioneMovimento(m)}</div></td>
                          <td className="px-3 py-2">{m.sub}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">
                            <div>{m.createdByEmail || "-"}</div>
                          
                            {m.updatedByEmail &&
                              m.updatedByEmail !== m.createdByEmail && (
                                <div className="mt-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                                  Mod. {m.updatedByEmail}
                                </div>
                              )}
                          </td>
                          <td className="px-3 py-2">{m.contraente || "-"}</td>
                          <td className="px-3 py-2">{m.referenteSospesi ? <Badge variant="purple">{m.referenteSospesi}</Badge> : "-"}</td>
                          <td className="px-3 py-2"><Badge variant="neutral">{m.tipo}</Badge></td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col items-start gap-1">
                              <Badge variant={warnPayment ? "warn" : m.modalita === "J" ? "blue" : "ok"}>
                                {getDescrizioneModalita(m.modalita)}
                              </Badge>
                              {postdatato && <span className="text-xs font-medium text-rose-700">Data assegno: {m.dataAssegno}</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">{euro(m.importo)}</td>
                          <td className="px-3 py-2 text-right font-medium">{euro(m.netto)}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{m.note || "-"}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => editMovement(m)}
                                disabled={giornataChiusa}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-rose-600 hover:text-rose-700"
                                onClick={() => deleteMovement(m.id)}
                                disabled={giornataChiusa}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
    </>
  );
}


