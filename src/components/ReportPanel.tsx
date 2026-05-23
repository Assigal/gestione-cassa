import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ReportPanel() {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold">Report</h2>
          <p className="text-sm text-slate-500">
            Area reportistica e stampe operative
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Button
            variant="outline"
            className="h-24 rounded-2xl text-base font-semibold"
          >
            Giornata di cassa
          </Button>

          <Button
            variant="outline"
            className="h-24 rounded-2xl text-base font-semibold"
          >
            Report range date
          </Button>

          <Button
            variant="outline"
            className="h-24 rounded-2xl text-base font-semibold"
          >
            Report sospesi
          </Button>

          <Button
            variant="outline"
            className="h-24 rounded-2xl text-base font-semibold"
          >
            Chiusure subagenti
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
