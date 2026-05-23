import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type LoginPanelProps = {
  loginEmail: string;
  setLoginEmail: React.Dispatch<React.SetStateAction<string>>;
  loginPassword: string;
  setLoginPassword: React.Dispatch<React.SetStateAction<string>>;
  login: () => void;
};

export function LoginPanel({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  login,
}: LoginPanelProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div>
            <h1 className="text-xl font-semibold">Accesso Gestione Cassa</h1>
            <p className="text-sm text-slate-500">
              Inserisci le credenziali operative.
            </p>
          </div>
  
          <input
            type="email"
            className="w-full rounded-2xl border px-3 py-2"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />
  
          <input
            type="password"
            className="w-full rounded-2xl border px-3 py-2"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />
  
          <Button className="w-full rounded-2xl" onClick={login}>
            Accedi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
