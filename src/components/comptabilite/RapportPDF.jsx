import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

function getMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = subMonths(now, i);
    const value = format(d, "yyyy-MM");
    const label = format(d, "MMMM yyyy", { locale: fr });
    opts.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return opts;
}

const MONTH_OPTIONS = getMonthOptions();

const fmtFCFA = (n) => {
  const abs = Math.abs(n || 0);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(2)}M FCFA`;
  if (abs >= 1_000) return `${new Intl.NumberFormat("fr-FR").format(Math.round(abs))} FCFA`;
  return `${new Intl.NumberFormat("fr-FR").format(abs)} FCFA`;
};

const CAT_LABELS = {
  vente_volaille: "Vente volaille", vente_oeufs: "Vente œufs", vente_fumier: "Vente fumier",
  achat_aliment: "Achat aliment", achat_poussins: "Achat poussins", medicaments: "Médicaments",
  main_oeuvre: "Main d'œuvre", equipement: "Équipement", transport: "Transport",
  electricite_eau: "Élec./Eau", autre: "Autre",
};

export default function RapportPDF({ transactions, bandes, mortalites, consommations, stocks }) {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [isGenerating, setIsGenerating] = useState(false);

  const [y, m] = selectedMonth.split("-").map(Number);
  const periodStart = new Date(y, m - 1, 1);
  const periodEnd = endOfMonth(periodStart);
  const monthLabel = MONTH_OPTIONS.find(o => o.value === selectedMonth)?.label || selectedMonth;

  const inPeriod = (dateStr) => {
    if (!dateStr) return false;
    try { return isWithinInterval(parseISO(dateStr), { start: periodStart, end: periodEnd }); }
    catch { return false; }
  };

  const periodTx = transactions.filter((t) => inPeriod(t.date));
  const revenus = periodTx.filter((t) => t.type === "revenu").reduce((s, t) => s + (t.montant || 0), 0);
  const depenses = periodTx.filter((t) => t.type === "depense").reduce((s, t) => s + (t.montant || 0), 0);
  const solde = revenus - depenses;

  const depByCategory = {};
  periodTx.filter((t) => t.type === "depense").forEach((t) => {
    depByCategory[t.categorie] = (depByCategory[t.categorie] || 0) + (t.montant || 0);
  });

  const totalMortsPeriode = mortalites.filter((m) => inPeriod(m.date)).reduce((s, m) => s + (m.nombre || 0), 0);
  const totalBirdsActive = bandes.filter((b) => b.statut === "active").reduce((s, b) => s + (b.effectif_actuel || b.effectif_initial || 0), 0);
  const tauxMortalite = totalBirdsActive > 0 ? ((totalMortsPeriode / totalBirdsActive) * 100).toFixed(1) : "0";

  const consoKg = (consommations || []).filter((c) => inPeriod(c.date)).reduce((s, c) => s + (c.quantite_kg || 0), 0);

  const generatePDF = async () => {
    setIsGenerating(true);
    const prompt = `
Tu es un assistant comptable pour une ferme avicole. Génère un rapport mensuel professionnel en français pour ${monthLabel}.

**DONNÉES DU MOIS :**
- Revenus totaux : ${fmtFCFA(revenus)}
- Dépenses totales : ${fmtFCFA(depenses)}
- Solde net : ${fmtFCFA(solde)} (${solde >= 0 ? "bénéfice" : "déficit"})
- Taux de mortalité moyen : ${tauxMortalite}%
- Mortalités enregistrées : ${totalMortsPeriode} sujets
- Consommation aliments : ${consoKg.toLocaleString("fr-FR")} kg
- Bandes actives : ${bandes.filter(b => b.statut === "active").length}
- Nombre de transactions : ${periodTx.length}

**DÉTAIL DÉPENSES PAR CATÉGORIE :**
${Object.entries(depByCategory).map(([cat, val]) => `- ${CAT_LABELS[cat] || cat}: ${fmtFCFA(val)}`).join("\n")}

**BANDES ACTIVES :**
${bandes.filter(b => b.statut === "active").map(b => `- ${b.nom} (${b.effectif_actuel || b.effectif_initial} sujets, ${b.espece})`).join("\n") || "Aucune"}

Génère un rapport complet avec :
1. Résumé exécutif (2-3 phrases)
2. Performance financière (tableau récapitulatif)
3. Analyse des dépenses par catégorie
4. Indicateurs zootechniques (mortalité, consommation)
5. Points d'attention et recommandations
6. Conclusion

Format: texte structuré avec titres clairs, adapté à l'impression.
    `;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });

    // Create printable window
    const win = window.open("", "_blank");
    if (!win) {
      alert("Le navigateur a bloqué l'ouverture du rapport. Veuillez autoriser les popups pour ce site.");
      setIsGenerating(false);
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Rapport mensuel - ${monthLabel}</title>
        <style>
          body { font-family: 'Georgia', serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 1.6; }
          h1 { color: #2d6a4f; border-bottom: 3px solid #2d6a4f; padding-bottom: 10px; }
          h2 { color: #2d6a4f; margin-top: 28px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header .logo { font-size: 36px; }
          .header .subtitle { color: #666; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
          .kpi { background: #f0faf4; border: 1px solid #b7e4c7; border-radius: 8px; padding: 16px; text-align: center; }
          .kpi .value { font-size: 20px; font-weight: bold; color: #2d6a4f; }
          .kpi .label { font-size: 12px; color: #666; margin-top: 4px; }
          .kpi.red { background: #fff5f5; border-color: #fed7d7; }
          .kpi.red .value { color: #c53030; }
          pre { white-space: pre-wrap; font-family: Georgia, serif; }
          @media print { button { display: none; } }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
          .print-btn { background: #2d6a4f; color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-size: 14px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
        <div class="header">
          <div class="logo">🐔</div>
          <h1>Rapport Mensuel — ${monthLabel}</h1>
          <div class="subtitle">PoultryGestion · Généré le ${format(new Date(), "d MMMM yyyy", { locale: fr })}</div>
        </div>
        <div class="kpi-grid">
          <div class="kpi"><div class="value">${fmtFCFA(revenus)}</div><div class="label">Revenus</div></div>
          <div class="kpi red"><div class="value">${fmtFCFA(depenses)}</div><div class="label">Dépenses</div></div>
          <div class="kpi ${solde >= 0 ? "" : "red"}"><div class="value">${fmtFCFA(Math.abs(solde))}</div><div class="label">Solde net ${solde >= 0 ? "✅" : "⚠️"}</div></div>
          <div class="kpi"><div class="value">${tauxMortalite}%</div><div class="label">Taux mortalité</div></div>
          <div class="kpi"><div class="value">${consoKg.toLocaleString("fr-FR")} kg</div><div class="label">Aliments consommés</div></div>
          <div class="kpi"><div class="value">${bandes.filter(b => b.statut === "active").length}</div><div class="label">Bandes actives</div></div>
        </div>
        <pre>${result}</pre>
        <div class="footer">PoultryGestion — Rapport généré automatiquement</div>
      </body>
      </html>
    `);
    win.document.close();
    setIsGenerating(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Rapport mensuel PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">Revenus</p>
            <p className="font-bold text-primary">{fmtFCFA(revenus)}</p>
          </div>
          <div className="rounded-lg bg-destructive/5 p-3">
            <p className="text-xs text-muted-foreground">Dépenses</p>
            <p className="font-bold text-destructive">{fmtFCFA(depenses)}</p>
          </div>
          <div className={`rounded-lg p-3 ${solde >= 0 ? "bg-primary/5" : "bg-destructive/5"}`}>
            <p className="text-xs text-muted-foreground">Solde net</p>
            <p className={`font-bold ${solde >= 0 ? "text-primary" : "text-destructive"}`}>{fmtFCFA(Math.abs(solde))}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generatePDF} disabled={isGenerating} className="gap-2">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {isGenerating ? "Génération en cours..." : "Générer le rapport"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}