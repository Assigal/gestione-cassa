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
  return null;
}
