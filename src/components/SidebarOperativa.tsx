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

  SidebarMetric: any;
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
  SidebarMetric,
}: SidebarOperativaProps) {
  return null;
}
