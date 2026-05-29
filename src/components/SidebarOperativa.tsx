import React from "react";
import {
  Wallet,
  Landmark,
  Banknote,
  Building2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarMetric } from "./SidebarMetric";

type SidebarOperativaProps = {
  giornataCorrente: string;
  setGiornataCorrente: React.Dispatch<React.SetStateAction<string>>;

  session: any;
  profiloUtente: any;

  giornataChiusa: boolean;
  giornataDbId: string | null;
  isAdmin: boolean;

  logout: () => void;
  chiudiGiornata: () => void;
  riapriGiornata: () => void;

  versamento: string;
  aggiornaVersamento: (value: string) => void;

  totals: any;
  avanzoPrecedente: number;

  quadMezza: { cassaReale: string };
  setQuadMezza: React.Dispatch<React.SetStateAction<{ cassaReale: string }>>;
  quadSera: { cassaReale: string };
  setQuadSera: React.Dispatch<React.SetStateAction<{ cassaReale: string }>>;

  quadMezzaBloccata: any;
  quadSeraBloccata: any;

  bloccaQuadraturaMezza: () => void;
  bloccaQuadraturaSera: () => void;

  euro: (value: number) => string;
  deltaLabel: (value: number) => string;

};

export function SidebarOperativa({
  giornataCorrente,
  setGiornataCorrente,
  session,
  profiloUtente,
  giornataChiusa,
  giornataDbId,
  isAdmin,
  logout,
  chiudiGiornata,
  riapriGiornata,
  versamento,
  aggiornaVersamento,
  totals,
  avanzoPrecedente,
  quadMezza,
  setQuadMezza,
  quadSera,
  setQuadSera,
  quadMezzaBloccata,
  quadSeraBloccata,
  bloccaQuadraturaMezza,
  bloccaQuadraturaSera,
  euro,
  deltaLabel,
}: SidebarOperativaProps) {
  return (
<aside className="space-y-2 xl:sticky xl:top-4 xl:h-[calc(100vh-48px)] xl:overflow-auto">
          <Card className="rounded-2xl bg-white shadow-sm">
            <CardContent className="space-y-2 p-3">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="rounded-2xl bg-slate-900 p-3">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Gestione cassa</h1>
                  <p className="text-xs text-slate-500">
                    {giornataCorrente} · {session.user.email}
                  </p>
                  
                  <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    Ruolo: {profiloUtente?.ruolo || "nessuno"}
                  </div>
                  
                  <Button
                    variant="outline"
                    className="mt-2 rounded-2xl text-xs"
                    onClick={logout}
                  >
                    Esci
                  </Button>
                  <input
                    type="date"
                    className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm"
                    value={giornataCorrente}
                    onChange={(e) => setGiornataCorrente(e.target.value)}
                  />
                  {giornataChiusa && (
                    <div className="mt-2 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
                      Giornata chiusa e non modificabile
                    </div>
                  )}
                  {giornataDbId && (
                    <div className="mt-2 rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700">
                      Giornata collegata a Supabase
                    </div>
                  )}
                </div>
              </div>

              <SidebarMetric icon={Landmark} label="Avanzo precedente" value={euro(avanzoPrecedente)} />
              <SidebarMetric icon={Banknote} label="Incassi fisici" value={euro(totals.incassiFisici)} note="Contanti e assegni validi" />
              <SidebarMetric icon={Building2} label="Versamento" value={euro(totals.versamento)} />
              <div className="rounded-2xl border bg-white p-4">
                <label className="space-y-1 block">
                  <span className="text-xs font-medium text-slate-500">
                    Importo versamento del giorno
                  </span>
                  <input
                    type="number"
                    className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm"
                    value={versamento}
                    onChange={(e) => aggiornaVersamento(e.target.value)}
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  Il versamento decrementa la cassa.
                </p>
              </div>
              <SidebarMetric icon={Wallet} label="Cassa" value={euro(totals.cassa)} note="Valore teorico" highlight />
              <SidebarMetric icon={AlertTriangle} label="Totale sospesi" value={euro(totals.totaleSospesi)} />
              <SidebarMetric icon={RotateCcw} label="Recuperi sospesi" value={euro(totals.totaleRecuperi)} />
              <SidebarMetric icon={Building2} label="Totale Compagnia" value={euro(totals.totaleCompagnia)} note="Titoli giorno sub 100" />

             <div className="space-y-2 border-t pt-3">
  <div className="rounded-2xl border bg-white p-2">
    <p className="text-sm font-semibold">Quadratura mezza giornata</p>

    {!quadMezzaBloccata ? (
      <>
        <input
          type="number"
          className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm"
          placeholder="Cassa reale"
          value={quadMezza.cassaReale}
          onChange={(e) => setQuadMezza({ cassaReale: e.target.value })}
        />

        <div
          className={`mt-2 rounded-xl p-2 text-xs font-semibold ${
            totals.squadraturaMezza === 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {deltaLabel(totals.squadraturaMezza)}
        </div>

        <Button
          className="mt-2 w-full rounded-2xl"
          onClick={bloccaQuadraturaMezza}
        >
          Blocca mezza giornata
        </Button>
      </>
    ) : (
      <div className="mt-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Cassa teorica</span>
          <span className="font-semibold">{euro(quadMezzaBloccata.cassaTeorica)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Cassa reale</span>
          <span className="font-semibold">{euro(quadMezzaBloccata.cassaReale)}</span>
        </div>
        <div
          className={`rounded-xl p-2 font-semibold ${
            quadMezzaBloccata.squadratura === 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {deltaLabel(quadMezzaBloccata.squadratura)}
        </div>
        <p className="text-slate-500">
          Bloccata il {quadMezzaBloccata.dataOra}
        </p>
      </div>
    )}
  </div>

  <div className="rounded-2xl border bg-white p-2">
    <p className="text-sm font-semibold">Quadratura fine giornata</p>

    {!quadSeraBloccata ? (
      <>
        <input
          type="number"
          className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm"
          placeholder="Cassa reale"
          value={quadSera.cassaReale}
          onChange={(e) => setQuadSera({ cassaReale: e.target.value })}
        />

        <div
          className={`mt-2 rounded-xl p-2 text-xs font-semibold ${
            totals.squadraturaSera === 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {deltaLabel(totals.squadraturaSera)}
        </div>

        <Button
          className="mt-2 w-full rounded-2xl"
          onClick={bloccaQuadraturaSera}
        >
          Blocca fine giornata
        </Button>
      </>
    ) : (
      <div className="mt-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Cassa teorica</span>
          <span className="font-semibold">{euro(quadSeraBloccata.cassaTeorica)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Cassa reale</span>
          <span className="font-semibold">{euro(quadSeraBloccata.cassaReale)}</span>
        </div>
        <div
          className={`rounded-xl p-2 font-semibold ${
            quadSeraBloccata.squadratura === 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {deltaLabel(quadSeraBloccata.squadratura)}
        </div>
        <p className="text-slate-500">
          Bloccata il {quadSeraBloccata.dataOra}
        </p>
      </div>
    )}
  </div>
</div>

              <Button
                className="w-full rounded-2xl"
                onClick={chiudiGiornata}
                disabled={giornataChiusa}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {giornataChiusa ? "Giornata chiusa" : "Chiudi giornata"}
              </Button>
              {giornataChiusa && isAdmin && (
                <Button
                  variant="outline"
                  className="w-full rounded-2xl border-amber-300 bg-amber-50 font-semibold text-amber-800 hover:bg-amber-100"
                  onClick={riapriGiornata}
                >
                  Riapri giornata
                </Button>
            )}
            </CardContent>
          </Card>
        </aside>

  );
}
