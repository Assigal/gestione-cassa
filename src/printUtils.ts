import type { Sospeso } from "./types";
import type { Movimento } from "./types";

export function stampaModuloSospeso(sospeso: Sospeso) {
    const scadenza = window.prompt(
      "Entro quale data il cliente si impegna a chiudere il sospeso? Formato: gg/mm/aaaa"
    );
  
    if (!scadenza) return;
  
    const html = `
      <html>
        <head>
          <title>Modulo sospeso</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
            h1 { text-align: center; font-size: 22px; margin-bottom: 30px; }
            .box { border: 1px solid #333; padding: 18px; margin-bottom: 20px; }
            .row { margin: 10px 0; font-size: 14px; }
            .label { font-weight: bold; }
            .firma { margin-top: 60px; display: flex; justify-content: space-between; }
            .linea { border-top: 1px solid #333; width: 220px; text-align: center; padding-top: 8px; }
            @media print {
              body { padding: 30px; }
            }
          </style>
        </head>
        <body>
          <h1>Modulo riconoscimento sospeso</h1>
  
          <div class="box">
            <div class="row"><span class="label">Data sospeso:</span> ${sospeso.dataSospeso}</div>
            <div class="row"><span class="label">Contraente:</span> ${sospeso.contraente}</div>
            <div class="row"><span class="label">Polizza:</span> ${sospeso.ramo}/${sospeso.polizza}</div>
            <div class="row"><span class="label">Importo sospeso:</span> ${euro(sospeso.residuo)}</div>
            <div class="row"><span class="label">Referente:</span> ${sospeso.referenteSospesi}</div>
            <div class="row"><span class="label">Scadenza impegno pagamento:</span> ${scadenza}</div>
          </div>
  
          <p>
            Il sottoscritto riconosce il debito sopra indicato e si impegna a regolarizzare
            l'importo sospeso entro la data indicata.
          </p>
  
          <div class="firma">
            <div class="linea">Firma cliente</div>
            <div class="linea">Operatore</div>
          </div>
  
          <script>
            window.print();
          </script>
        </body>
      </html>
    `;
  
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

 export function stampaModuloAbbuono(movimento: Movimento, motivazione: string) {
    const html = `
      <html>
        <head>
          <title>Modulo abbuono provvigioni</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
            h1 { text-align: center; font-size: 22px; margin-bottom: 30px; }
            .box { border: 1px solid #333; padding: 18px; margin-bottom: 20px; }
            .row { margin: 10px 0; font-size: 14px; }
            .label { font-weight: bold; }
            .firma { margin-top: 60px; display: flex; justify-content: space-between; }
            .linea { border-top: 1px solid #333; width: 220px; text-align: center; padding-top: 8px; }
          </style>
        </head>
        <body>
          <h1>Modulo abbuono provvigioni</h1>
  
          <div class="box">
            <div class="row"><span class="label">Data:</span> ${giornataCorrente}</div>
            <div class="row"><span class="label">Contraente:</span> ${movimento.contraente}</div>
            <div class="row"><span class="label">Polizza:</span> ${movimento.ramo}/${movimento.polizza}</div>
            <div class="row"><span class="label">Importo lordo:</span> ${euro(movimento.importo)}</div>
            <div class="row"><span class="label">Sconto applicato:</span> ${euro(movimento.sconto)}</div>
            <div class="row"><span class="label">Motivazione:</span> ${motivazione}</div>
          </div>
  
          <p>
            Il cliente dichiara di essere stato informato dell'abbuono provvigionale applicato.
          </p>
  
          <div class="firma">
            <div class="linea">Firma cliente</div>
            <div class="linea">Operatore</div>
          </div>
  
          <script>
            window.print();
          </script>
        </body>
      </html>
    `;
  
    const win = window.open("", "_blank");
  
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }
  
