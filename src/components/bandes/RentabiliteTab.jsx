import React from "react";
import { formatFCFA as fmt } from "@/lib/formatters";
import { TrendingUp, TrendingDown, DollarSign, Users, Percent, Wheat, Syringe, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

function KpiBox({ label, value, sub, color = "default", icon: Icon }) {
  const colorMap = {
    green: "bg-primary/8 border-primary/20 text-primary",
    red: "bg-destructive/8 border-destructive/20 text-destructive",
    yellow: "bg-secondary/15 border-secondary/30 text-secondary-foreground",
    default: "bg-muted/60 border-border text-foreground",
  };
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4 opacity-70" />}
        <p className="text-xs font-medium opacity-70">{label}</p>
      </div>
      <p className="text-xl font-bold font-heading">{value}</p>
      {sub && <p className="text-xs opacity-60">{sub}</p>}
    </div>
  );
}

export default function RentabiliteTab({ bande, consommations, stocks, traitements, medicaments, transactions }) {
  const { t } = useLanguage();
  const effectif = bande.effectif_actuel ?? bande.effectif_initial;

  // ── Revenus ── transactions liées à cette bande de type revenu
  const revenus = transactions
    .filter((t) => t.bande_id === bande.id && t.type === "revenu")
    .reduce((s, t) => s + (t.montant || 0), 0);

  // ── Dépenses par catégorie ──
  // Provende
  const coutProvende = consommations.reduce((sum, c) => {
    const stock = stocks.find((s) => s.id === c.aliment_id);
    return sum + (c.quantite_kg || 0) * (stock?.prix_par_kg || 0);
  }, 0);

  // Médicaments / traitements
  const coutMedicaments = traitements.reduce((sum, t) => {
    const med = medicaments.find((m) => m.id === t.medicament_id);
    return sum + (t.quantite_utilisee || 0) * (med?.prix_unitaire || 0);
  }, 0);

  // Autres dépenses (main d'oeuvre, équipement, etc.) liées à cette bande
  const autresDepenses = transactions
    .filter((t) => t.bande_id === bande.id && t.type === "depense" && t.categorie !== "achat_aliment" && t.categorie !== "medicaments")
    .reduce((s, t) => s + (t.montant || 0), 0);

  // Achat poussins
  const achatPoussins = transactions
    .filter((t) => t.bande_id === bande.id && t.type === "depense" && t.categorie === "achat_poussins")
    .reduce((s, t) => s + (t.montant || 0), 0);

  const totalDepenses = coutProvende + coutMedicaments + autresDepenses;
  const beneficeNet = revenus - totalDepenses;
  const marge = revenus > 0 ? ((beneficeNet / revenus) * 100).toFixed(1) : 0;
  const coutParTete = effectif > 0 ? totalDepenses / effectif : 0;
  const revenuParTete = effectif > 0 ? revenus / effectif : 0;

  const isProfit = beneficeNet >= 0;

  return (
    <div className="space-y-6">
      {/* Résumé en un coup d'œil */}
      <div className={`rounded-xl border-2 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isProfit ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{t("rentabilite.netBenefit")}</p>
          <p className={`text-4xl font-bold font-heading ${isProfit ? "text-primary" : "text-destructive"}`}>
            {isProfit ? "+" : "−"}{fmt(Math.abs(beneficeNet))}
          </p>
          {revenus > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("rentabilite.margin")}: <span className={`font-semibold ${isProfit ? "text-primary" : "text-destructive"}`}>{marge}%</span>
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 rounded-lg bg-background border">
            <p className="text-lg font-bold font-heading text-primary">{fmt(revenus)}</p>
            <p className="text-xs text-muted-foreground">{t("rentabilite.revenus")}</p>
          </div>
          <div className="text-center px-4 py-2 rounded-lg bg-background border">
            <p className="text-lg font-bold font-heading text-destructive">{fmt(totalDepenses)}</p>
            <p className="text-xs text-muted-foreground">{t("rentabilite.depenses")}</p>
          </div>
        </div>
      </div>

      {/* KPIs détaillés */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiBox label={t("rentabilite.revenuParTete")} value={fmt(revenuParTete)} sub={t("rentabilite.sujets", { n: effectif })} icon={DollarSign} color={revenus > 0 ? "green" : "default"} />
        <KpiBox label={t("rentabilite.coutParTete")} value={fmt(coutParTete)} sub={t("rentabilite.toutesDepenses")} icon={Users} color="red" />
        <KpiBox label={t("rentabilite.margeBeneficiaire")} value={`${marge}%`} sub={revenus > 0 ? t("rentabilite.surVentes") : t("rentabilite.pasDeRevenus")} icon={Percent} color={parseFloat(marge) > 15 ? "green" : parseFloat(marge) > 0 ? "yellow" : "red"} />
      </div>

      {/* Détail des dépenses */}
      <div className="rounded-xl border bg-card p-5">
        <h4 className="font-heading font-semibold mb-4 text-sm">{t("rentabilite.detailDepenses")}</h4>
        <div className="space-y-3">
          <DepenseLine icon={Wheat} label={t("rentabilite.alimentation")} montant={coutProvende} total={totalDepenses} color="text-secondary-foreground" />
          <DepenseLine icon={Syringe} label={t("rentabilite.medicamentsSoins")} montant={coutMedicaments} total={totalDepenses} color="text-chart-3" />
          {achatPoussins > 0 && <DepenseLine icon={ShoppingCart} label={t("rentabilite.achatPoussins")} montant={achatPoussins} total={totalDepenses} color="text-chart-4" />}
          {autresDepenses - achatPoussins > 0 && <DepenseLine icon={TrendingDown} label={t("rentabilite.autresCharges")} montant={autresDepenses - achatPoussins} total={totalDepenses} color="text-muted-foreground" />}
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-semibold text-sm">{t("rentabilite.totalDepenses")}</span>
            <span className="font-bold text-destructive">{fmt(totalDepenses)}</span>
          </div>
        </div>
      </div>

      {/* Guide de lecture */}
      {revenus === 0 && (
        <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4">
          <p className="text-sm font-medium text-secondary-foreground mb-1">{t("rentabilite.aucunRevenuTitle")}</p>
          <p className="text-xs text-muted-foreground">
            {t("rentabilite.aucunRevenuDesc")}
          </p>
        </div>
      )}
    </div>
  );
}

function DepenseLine({ icon: Icon, label, montant, total, color }) {
  const { t } = useLanguage();
  const pct = total > 0 ? ((montant / total) * 100).toFixed(0) : 0;
  return (
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-sm truncate">{label}</span>
          <span className="text-sm font-semibold ml-2">{fmt(montant)}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-destructive/60" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">{t("rentabilite.pctDesDepenses", { pct })}</span>
      </div>
    </div>
  );
}