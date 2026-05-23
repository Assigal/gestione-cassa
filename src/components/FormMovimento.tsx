import React from "react";

type FormMovimentoProps = {
  editingMovement: number | null;
  setEditingMovement: React.Dispatch<React.SetStateAction<number | null>>;

  giornataChiusa: boolean;
  selectedImportRow: any;

  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  saveForm: () => void;
  resetForm: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  openImportFileDialog: () => void;
  handleTipoMovimentoChange: (tipo: string) => void;
  
  tipiMovimento: string[];
  modalitaPagamento: any[];
  referentiSospesi: any[];
  
  getDescrizioneModalita: (codice: string | null | undefined) => string;
  isVersamentoSubagente: (tipo: string) => boolean;
  euro: (value: number) => string;
  
  giornataCorrente: string;
  selectedSospesoIds: string[];
};

export function FormMovimento(props: FormMovimentoProps) {
  return (
    <div className="hidden">
      FormMovimento collegato
    </div>
  );
}
