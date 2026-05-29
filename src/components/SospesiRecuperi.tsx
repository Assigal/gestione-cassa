import React from "react";
import { RotateCcw, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "./Badge";

type SospesiRecuperiProps = {
  children: React.ReactNode;

  sospesiFiltrati: Sospeso[];
  selectedSospesoIds: string[];
  searchSospesi: string;
 
  setSearchSospesi: React.Dispatch<React.SetStateAction<string>>;

  toggleSospeso: (id: string) => void;
  prepareRecuperoSospesi: () => void;

  numeroPolizzaCompleto: (row: any) => string;
  euro: (value: number) => string;
};

export function SospesiRecuperi({
  children,
  sospesiFiltrati,
  selectedSospesoIds,
  searchSospesi,
  setSearchSospesi,
  toggleSospeso,
  prepareRecuperoSospesi,
  numeroPolizzaCompleto,
  euro,
}: SospesiRecuperiProps) {
  return (
    <>
       <Card className="rounded-2xl border-violet-200 bg-violet-50/40 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-violet-200 p-3">
                <div>
                  <h2 className="text-lg font-semibold">Recupero sospesi</h2>
                  <p className="text-sm text-slate-600">Cerca per referente, contraente o polizza. Puoi selezionare più sospesi dello stesso referente.</p>
                </div>
                <Button className="rounded-2xl" onClick={prepareRecuperoSospesi}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Recupera selezionati
                </Button>
              </div>

              <div className="border-b border-violet-100 p-3">
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input className="w-full rounded-2xl border px-9 py-2 text-sm" placeholder="Cerca referente sospesi, contraente o polizza" value={searchSospesi} onChange={(e) => setSearchSospesi(e.target.value)} />
                </div>
              </div>

              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-violet-100 text-left text-xs uppercase tracking-wide text-violet-900">
                    <tr>
                      <th className="px-3 py-2"></th>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Referente</th>
                      <th className="px-3 py-2">Contraente / Polizza</th>
                      <th className="px-3 py-2 text-right">Originario</th>
                      <th className="px-3 py-2 text-right">Recuperato</th>
                      <th className="px-3 py-2 text-right">Sconto</th>
                      <th className="px-3 py-2 text-right">Residuo</th>
                      <th className="px-3 py-2">Stato</th>
                      <th className="px-3 py-2">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sospesiFiltrati.map((s) => (
                      <tr key={s.id} className={`border-t border-violet-100 bg-white/70 hover:bg-white ${selectedSospesoIds.includes(s.id) ? "ring-2 ring-violet-300" : ""}`}>
                        <td className="px-3 py-2"><input type="checkbox" checked={selectedSospesoIds.includes(s.id)} onChange={() => toggleSospeso(s.id)} /></td>
                        <td className="px-3 py-2 font-medium">{s.dataSospeso || "-"}</td>
                        <td className="px-3 py-2"><Badge variant="purple">{s.referenteSospesi}</Badge></td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{s.contraente}</div>
                          <div className="text-xs text-slate-500">{numeroPolizzaCompleto(s)}</div>
                        </td>
                        <td className="px-3 py-2 text-right">{euro(s.importoOriginario)}</td>
                        <td className="px-3 py-2 text-right">{euro(s.recuperato)}</td>
                        <td className="px-3 py-2 text-right">{euro(s.scontoApplicato)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{euro(s.residuo)}</td>
                        <td className="px-3 py-2"><Badge variant={s.stato === "Chiuso" ? "ok" : "warn"}>{s.stato}</Badge></td>
                        <td className="px-3 py-2 text-xs text-slate-500">{s.note || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
    </>
  );
}

