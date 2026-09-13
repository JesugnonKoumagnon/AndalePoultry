import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Pencil, Bird, Skull, Wheat, TrendingUp, Clock } from "lucide-react";
import * as XLSX from "xlsx";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLanguage } from "@/lib/LanguageContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import MortaliteForm from "@/components/bandes/MortaliteForm";
import BandeForm from "@/components/bandes/BandeForm";
import ConsommationForm from "@/components/provenderie/ConsommationForm";
import TraitementForm from "@/components/medicaments/TraitementForm";
import RentabiliteTab from "@/components/bandes/RentabiliteTab";
import DetailHeader from "@/components/shared/DetailHeader";
import useBackClose from "@/hooks/useBackClose";

const especeLabels = {
  poulet_chair: "Poulet 🐔",
  pondeuse: "Pondeuse 🥚",
  pintade: "Pintade",
  canard: "Canard 🦆",
  dinde: "Dinde",
  caille: "Caille",
};

// Courbes de croissance de référence par souche - g par jour
const GROWTH_REFERENCES = {
  "cobb 500": [
    { j: 0, poids: 40 }, { j: 7, poids: 180 }, { j: 14, poids: 470 }, { j: 21, poids: 900 },
    { j: 28, poids: 1400 }, { j: 35, poids: 1950 }, { j: 42, poids: 2500 }, { j: 49, poids: 2900 },
  ],
  "ross 308": [
    { j: 0, poids: 42 }, { j: 7, poids: 190 }, { j: 14, poids: 480 }, { j: 21, poids: 920 },
    { j: 28, poids: 1450 }, { j: 35, poids: 2000 }, { j: 42, poids: 2550 }, { j: 49, poids: 2950 },
  ],
  "isa brown": [
    { j: 0, poids: 38 }, { j: 7, poids: 60 }, { j: 14, poids: 120 }, { j: 21, poids: 220 },
    { j: 28, poids: 340 }, { j: 35, poids: 480 }, { j: 42, poids: 650 }, { j: 49, poids: 850 },
  ],
};
const DEFAULT_GROWTH_REF = GROWTH_REFERENCES["cobb 500"];

function getGrowthRef(souche) {
  if (!souche) return { key: "Cobb 500", data: DEFAULT_GROWTH_REF };
  const match = Object.keys(GROWTH_REFERENCES).find((k) => souche.toLowerCase().includes(k));
  return match ? { key: souche, data: GROWTH_REFERENCES[match] } : { key: souche, data: DEFAULT_GROWTH_REF };
}

const TABS = [
  { key: "apercu", labelKey: "bandeDetail.tabOverview" },
  { key: "sante", labelKey: "bandeDetail.tabHealth" },
  { key: "mortalite", labelKey: "bandeDetail.tabMortality" },
  { key: "provende", labelKey: "bandeDetail.tabFeed" },
  { key: "rentabilite", labelKey: "bandeDetail.tabProfitability" },
];

export default function BandeDetail() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const dateLocale = lang === "en" ? enUS : fr;
  const formatFCFA = (n) => {
    if (!n && n !== 0) return "0 FCFA";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M FCFA`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(2).replace(/\.?0+$/, "")}k FCFA`;
    return `${new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR").format(n)} FCFA`;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("apercu");
  const [showMortaliteForm, setShowMortaliteForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showConsoForm, setShowConsoForm] = useState(false);
  const [showTraitementForm, setShowTraitementForm] = useState(false);
  const [editingMortalite, setEditingMortalite] = useState(null);

  useBackClose(showMortaliteForm, () => setShowMortaliteForm(false));
  useBackClose(showEditForm, () => setShowEditForm(false));
  useBackClose(showConsoForm, () => setShowConsoForm(false));
  useBackClose(showTraitementForm, () => setShowTraitementForm(false));
  useBackClose(!!editingMortalite, () => setEditingMortalite(null));

  const { data: bande, isLoading } = useQuery({
    queryKey: ["bande", id],
    queryFn: () => base44.entities.Bande.filter({ id }),
    select: (data) => data[0],
  });

  const { data: mortalites = [] } = useQuery({
    queryKey: ["mortalites", id],
    queryFn: () => base44.entities.Mortalite.filter({ bande_id: id }),
  });

  const { data: traitements = [] } = useQuery({
    queryKey: ["traitements", id],
    queryFn: () => base44.entities.TraitementSanitaire.filter({ bande_id: id }),
  });

  const { data: consommations = [] } = useQuery({
    queryKey: ["consommations", id],
    queryFn: () => base44.entities.ConsommationAliment.filter({ bande_id: id }),
  });

  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => base44.entities.StockAliment.list(),
  });

  const { data: medicaments = [] } = useQuery({
    queryKey: ["medicaments"],
    queryFn: () => base44.entities.Medicament.list(),
  });

  const { data: bandes = [] } = useQuery({
    queryKey: ["bandes"],
    queryFn: () => base44.entities.Bande.filter({ statut: "active" }),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => base44.entities.Transaction.list("-date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bande.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bande", id] });
      queryClient.invalidateQueries({ queryKey: ["bandes"] });
      setShowEditForm(false);
    },
  });

  const mortaliteMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Mortalite.create(data);
      if (bande) {
        await base44.entities.Bande.update(bande.id, {
          effectif_actuel: (bande.effectif_actuel ?? bande.effectif_initial) - data.nombre,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bande", id] });
      queryClient.invalidateQueries({ queryKey: ["mortalites", id] });
      queryClient.invalidateQueries({ queryKey: ["bandes"] });
      setShowMortaliteForm(false);
    },
  });

  const updateMortaliteMutation = useMutation({
    mutationFn: async (data) => {
      const previous = editingMortalite;
      await base44.entities.Mortalite.update(previous.id, data);
      if (bande) {
        const diff = data.nombre - (previous.nombre || 0);
        if (diff !== 0) {
          await base44.entities.Bande.update(bande.id, {
            effectif_actuel: (bande.effectif_actuel ?? bande.effectif_initial) - diff,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bande", id] });
      queryClient.invalidateQueries({ queryKey: ["mortalites", id] });
      queryClient.invalidateQueries({ queryKey: ["bandes"] });
      setEditingMortalite(null);
    },
  });

  const consoMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ConsommationAliment.create(data);
      const stock = stocks.find((s) => s.id === data.aliment_id);
      if (stock) {
        await base44.entities.StockAliment.update(stock.id, {
          quantite_kg: Math.max(0, (stock.quantite_kg || 0) - data.quantite_kg),
        });
        const montant = (data.quantite_kg || 0) * (stock.prix_par_kg || 0);
        if (montant > 0) {
          await base44.entities.Transaction.create({
            type: "depense",
            categorie: "achat_aliment",
            montant,
            date: data.date || format(new Date(), "yyyy-MM-dd"),
            bande_id: bande?.id || null,
            description: `Consommation ${stock.nom} — ${data.quantite_kg} kg (${bande?.nom})`,
            mode_paiement: "especes",
          });
        }
      }
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["consommations", id] });
      const previous = queryClient.getQueryData(["consommations", id]);
      const optimistic = { id: `temp-${Date.now()}`, ...data };
      queryClient.setQueryData(["consommations", id], (old = []) => [optimistic, ...old]);
      setShowConsoForm(false);
      return { previous };
    },
    onError: (err, data, context) => {
      queryClient.setQueryData(["consommations", id], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["consommations", id] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const traitementMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.TraitementSanitaire.create(data);
      if (data.medicament_id && data.quantite_utilisee) {
        const med = medicaments.find((m) => m.id === data.medicament_id);
        if (med) {
          await base44.entities.Medicament.update(med.id, {
            quantite: Math.max(0, (med.quantite || 0) - data.quantite_utilisee),
          });
          const montant = data.quantite_utilisee * (med.prix_unitaire || 0);
          if (montant > 0) {
            await base44.entities.Transaction.create({
              type: "depense",
              categorie: "medicaments",
              montant,
              date: data.date || format(new Date(), "yyyy-MM-dd"),
              bande_id: bande?.id || null,
              description: `Traitement ${med.nom} — ${data.quantite_utilisee} ${med.unite || "unités"} (${bande?.nom})`,
              mode_paiement: "especes",
            });
          }
        }
      }
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["traitements", id] });
      const previous = queryClient.getQueryData(["traitements", id]);
      const optimistic = { id: `temp-${Date.now()}`, ...data };
      queryClient.setQueryData(["traitements", id], (old = []) => [optimistic, ...old]);
      setShowTraitementForm(false);
      return { previous };
    },
    onError: (err, data, context) => {
      queryClient.setQueryData(["traitements", id], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["traitements", id] });
      queryClient.invalidateQueries({ queryKey: ["medicaments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const totalMortalite = mortalites.reduce((s, m) => s + (m.nombre || 0), 0);
  const effectif = bande ? (bande.effectif_actuel ?? bande.effectif_initial) : 0;
  const tauxMortalite = bande?.effectif_initial > 0
    ? ((totalMortalite / bande.effectif_initial) * 100).toFixed(1)
    : "0";

  const coutProvende = consommations.reduce((sum, c) => {
    const stock = stocks.find((s) => s.id === c.aliment_id);
    return sum + (c.quantite_kg || 0) * (stock?.prix_par_kg || 0);
  }, 0);

  const joursElevage = bande?.date_entree
    ? differenceInDays(new Date(), parseISO(bande.date_entree)) + 1
    : 0;

  const coutParTete = effectif > 0 ? coutProvende / effectif : 0;

  // Courbe de croissance - dynamiquement adaptée à la souche de la bande
  const { key: growthRefLabel, data: growthRefData } = useMemo(() => getGrowthRef(bande?.souche), [bande?.souche]);
  const growthData = growthRefData.map((ref) => {
    const realEntry = consommations.find((c) => {
      if (!bande?.date_entree || !c.date) return false;
      const daysDiff = differenceInDays(parseISO(c.date), parseISO(bande.date_entree));
      return Math.abs(daysDiff - ref.j) < 3.5;
    });
    return {
      j: ref.j,
      reference: ref.poids,
      reel: realEntry ? bande?.poids_moyen_kg ? bande.poids_moyen_kg * 1000 : null : null,
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!bande) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{t("bandeDetail.notFound")}</p>
        <Link to="/bandes"><Button className="mt-4">{t("bandeDetail.backToFlocks")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DetailHeader title={bande.nom || t("bandeDetail.title")} fallbackPath="/bandes" />

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-heading font-bold">{bande.effectif_actuel ?? bande.effectif_initial}</h1>
              <span className="text-2xl text-secondary">💡</span>
              <span className="text-lg text-muted-foreground">{bande.espece ? t(`espece.${bande.espece}`) : bande.espece}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{t("bandeDetail.strain")}: {bande.souche || t("bandeDetail.strainUndefined")}</Badge>
              <Button variant="outline" size="sm" className="h-6 text-xs gap-1 px-2" onClick={() => setShowEditForm(true)}>
                <Pencil className="w-3 h-3" /> {t("common.edit")}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs px-3 py-1 ${bande.statut === "active" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"}`}>
            ● {bande.statut === "active" ? t("bandeDetail.statusActive") : bande.statut === "terminee" ? t("bandeDetail.statusCompleted") : t("bandeDetail.statusPlanned")}
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => {
            const wb = XLSX.utils.book_new();
            // Infos bande
            const infoRows = [
              [t("report.name"), bande.nom], [t("report.species"), bande.espece],
              [t("report.initialCount"), bande.effectif_initial],
              [t("report.currentCount"), bande.effectif_actuel ?? bande.effectif_initial],
              [t("report.entryDate"), bande.date_entree || ""], [t("report.status"), bande.statut],
              [t("report.avgWeight"), bande.poids_moyen_kg || ""], [t("common.notes"), bande.notes || ""],
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(infoRows), t("report.informationSheet"));
            // Mortalité
            const mortRows = [[t("report.date"), t("report.count"), t("report.cause"), t("common.notes")],
              ...mortalites.map(m => [m.date, m.nombre, m.cause || "", m.notes || ""])];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mortRows), t("report.mortalitySheet"));
            // Provende
            const provRows = [[t("report.date"), t("report.feed"), t("report.quantityKg"), t("report.costFcfa")],
              ...consommations.map(c => {
                const s = stocks.find(st => st.id === c.aliment_id);
                return [c.date, s?.nom || "", c.quantite_kg, (c.quantite_kg || 0) * (s?.prix_par_kg || 0)];
              })];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(provRows), t("report.feedSheet"));
            // Traitements
            const traitRows = [[t("report.date"), t("report.medication"), t("report.reason"), t("report.quantityUsed"), t("report.reminder")],
              ...traitements.map(tr => {
                const m = medicaments.find(me => me.id === tr.medicament_id);
                return [tr.date, m?.nom || "", tr.motif, tr.quantite_utilisee || "", tr.prochain_rappel || ""];
              })];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(traitRows), t("report.treatmentsSheet"));
            XLSX.writeFile(wb, `Bande_${bande.nom}_${new Date().toISOString().split("T")[0]}.xlsx`);
          }}>
            <Download className="w-3.5 h-3.5" /> {t("bandeDetail.excel")}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{t("bandeDetail.headsCurInit")}</p>
          <div className="flex items-center gap-2 mb-2">
            <Bird className="w-4 h-4 text-primary" />
            <p className="text-xl font-bold font-heading">{effectif} / {bande.effectif_initial} {t("common.heads")}</p>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min((effectif / bande.effectif_initial) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{t("bandeDetail.totalMortality")}</p>
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-destructive" />
            <p className="text-xl font-bold font-heading text-destructive">{t("bandeDetail.deaths", { n: totalMortalite })} ({tauxMortalite}%)</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{t("bandeDetail.totalFeedCost")}</p>
          <div className="flex items-center gap-2">
            <Wheat className="w-4 h-4 text-secondary-foreground" />
            <p className="text-xl font-bold font-heading">{formatFCFA(coutProvende)}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{t("bandeDetail.costPerHead")}</p>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-xl font-bold font-heading">{formatFCFA(coutParTete)}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{t("bandeDetail.rearingDuration")}</p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p className="text-xl font-bold font-heading">{t("bandeDetail.days", { n: joursElevage })}</p>
          </div>
        </div>
      </div>

      {/* Courbe de croissance */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-heading font-semibold text-sm">{t("bandeDetail.growthCurveTitle")}</h3>
            <p className="text-xs text-muted-foreground">
              {bande.espece ? t(`espece.${bande.espece}`) : bande.espece} - {growthRefLabel} - {t("bandeDetail.growthCurveTitle")}
            </p>
            {bande.date_entree && (
              <p className="text-xs text-muted-foreground">
                {t("bandeDetail.startLabel", { date: format(parseISO(bande.date_entree), "dd/MM/yyyy", { locale: dateLocale }) })}
              </p>
            )}
          </div>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground">{t("bandeDetail.slaughterBadge")}</Badge>
            <Badge variant="outline" className="text-muted-foreground">{t("bandeDetail.noRealRecord")}</Badge>
          </div>
        </div>
        <div className="h-52 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(90,15%,88%)" />
              <XAxis dataKey="j" label={{ value: t("bandeDetail.daysAxis"), position: "insideBottom", offset: -2, fontSize: 10 }} tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(2).replace(/\.?0+$/, "")}kg` : `${v}g`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v, name) => [v >= 1000 ? `${(v / 1000).toFixed(2)}kg` : `${v}g`, name === "reference" ? t("bandeDetail.reference") : t("bandeDetail.real")]} />
              <ReferenceLine x={42} stroke="hsl(145,55%,36%)" strokeDasharray="4 2" label={{ value: t("bandeDetail.slaughterLabel"), position: "top", fontSize: 9 }} />
              <Line type="monotone" dataKey="reference" stroke="hsl(42,90%,55%)" strokeDasharray="6 3" dot={false} name="reference" />
              <Line type="monotone" dataKey="reel" stroke="hsl(145,55%,36%)" dot={{ r: 3 }} name="reel" connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-3 mt-2 flex-wrap">
          <Badge variant="outline" className="text-xs text-primary border-primary/20">{t("bandeDetail.icTarget")}</Badge>
          <Badge variant="outline" className="text-xs text-destructive border-destructive/20">Mortalité cible: &lt; 3%</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Modals */}
      {showMortaliteForm && (
        <MortaliteForm
          bande={bande}
          onSubmit={(data) => mortaliteMutation.mutate(data)}
          onCancel={() => setShowMortaliteForm(false)}
          isLoading={mortaliteMutation.isPending}
        />
      )}
      {editingMortalite && (
        <MortaliteForm
          bande={bande}
          mortalite={editingMortalite}
          onSubmit={(data) => updateMortaliteMutation.mutate(data)}
          onCancel={() => setEditingMortalite(null)}
          isLoading={updateMortaliteMutation.isPending}
        />
      )}
      {showEditForm && (
        <BandeForm
          bande={bande}
          onSubmit={(data) => updateMutation.mutate({ id: bande.id, data })}
          onCancel={() => setShowEditForm(false)}
          isLoading={updateMutation.isPending}
        />
      )}
      {showConsoForm && (
        <ConsommationForm
          stock={null}
          stocks={stocks}
          bandes={bandes}
          onSubmit={(data) => consoMutation.mutate({ ...data, bande_id: bande.id })}
          onCancel={() => setShowConsoForm(false)}
          isLoading={consoMutation.isPending}
        />
      )}
      {showTraitementForm && (
        <TraitementForm
          bande={bande}
          medicaments={medicaments}
          onSubmit={(data) => traitementMutation.mutate({ ...data, bande_id: bande.id })}
          onCancel={() => setShowTraitementForm(false)}
          isLoading={traitementMutation.isPending}
        />
      )}

      {/* Tab Content */}
      {activeTab === "apercu" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h3 className="font-heading font-semibold text-sm">{t("bandeDetail.infoSection")}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("bandeDetail.species")} —</span>
                <span>{bande.espece ? t(`espece.${bande.espece}`) : bande.espece}</span>
              </div>
              {bande.souche && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t("bandeDetail.strain")} —</span>
                  <span>{bande.souche}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("bandeDetail.entryDate")} —</span>
                <span>{bande.date_entree ? format(parseISO(bande.date_entree), "dd/MM/yyyy", { locale: dateLocale }) : "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("bandeDetail.avgEntryWeight")} —</span>
                <span>{bande.poids_moyen_kg ? `${bande.poids_moyen_kg} kg` : "—"}</span>
              </div>
              {bande.notes && (
                <div>
                  <span className="text-muted-foreground">{t("common.notes")} — </span>
                  <span>{bande.notes}</span>
                </div>
              )}
            </div>
            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <Button variant="outline" className="w-full justify-center gap-2 text-sm" onClick={() => setShowMortaliteForm(true)}>
                {t("bandeDetail.registerMortality")}
              </Button>
              <Button variant="outline" className="w-full justify-center gap-2 text-sm" onClick={() => setShowTraitementForm(true)}>
                {t("bandeDetail.addHealthFollowup")}
              </Button>
              <Button variant="outline" className="w-full justify-center gap-2 text-sm" onClick={() => setShowConsoForm(true)}>
                {t("bandeDetail.registerConsumption")}
              </Button>
              <Button
                className="w-full justify-center gap-2 text-sm bg-primary"
                onClick={() => navigate("/ma-boutique", { state: { prefillBande: bande } })}
              >
                {t("bandeDetail.sell")}
              </Button>
              <Button variant="outline" className="w-full justify-center gap-2 text-sm text-muted-foreground">
                {t("bandeDetail.closeFlock")}
              </Button>
            </div>
          </div>

          {/* Derniers suivis santé */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-heading font-semibold text-sm mb-3">{t("bandeDetail.lastHealthFollowups")}</h3>
            {traitements.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("bandeDetail.noFollowup")}</p>
            ) : (
              <div className="space-y-2">
                {traitements.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{medicaments.find((m) => m.id === tx.medicament_id)?.nom || tx.motif}</p>
                      <p className="text-xs text-muted-foreground">{tx.date && format(parseISO(tx.date), "d MMM yyyy", { locale: dateLocale })}</p>
                    </div>
                    <Badge className="text-xs bg-primary/10 text-primary">{tx.motif}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "mortalite" && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">{t("bandeDetail.mortalityHistory")}</h3>
            <Button size="sm" onClick={() => setShowMortaliteForm(true)} className="gap-2">
              <Skull className="w-4 h-4" /> {t("bandeDetail.record")}
            </Button>
          </div>
          {mortalites.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t("bandeDetail.noMortality")}</p>
          ) : (
            <div className="divide-y divide-border">
              {mortalites.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-destructive">{t("bandeDetail.deaths", { n: m.nombre })}</p>
                    <p className="text-xs text-muted-foreground">{m.cause || t("bandeDetail.unknownCause")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{m.date && format(parseISO(m.date), "d MMM yyyy", { locale: dateLocale })}</p>
                      {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingMortalite(m)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "sante" && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">{t("bandeDetail.treatments")}</h3>
            <Button size="sm" onClick={() => setShowTraitementForm(true)} className="gap-2">
              {t("bandeDetail.addTreatment")}
            </Button>
          </div>
          {traitements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t("bandeDetail.noTreatment")}</p>
          ) : (
            <div className="divide-y divide-border">
              {traitements.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{medicaments.find((m) => m.id === tx.medicament_id)?.nom || "—"}</p>
                    <p className="text-xs text-muted-foreground">{tx.motif} — {t("bandeDetail.units", { n: tx.quantite_utilisee })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{tx.date && format(parseISO(tx.date), "d MMM yyyy", { locale: dateLocale })}</p>
                    {tx.prochain_rappel && (
                      <p className="text-xs text-secondary-foreground font-medium">
                        {t("bandeDetail.reminder", { date: format(parseISO(tx.prochain_rappel), "d MMM yyyy", { locale: dateLocale }) })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "provende" && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">{t("bandeDetail.feedConsumption")}</h3>
            <Button size="sm" onClick={() => setShowConsoForm(true)} className="gap-2">
              {t("bandeDetail.record")}
            </Button>
          </div>
          {consommations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t("bandeDetail.noConsumption")}</p>
          ) : (
            <div className="divide-y divide-border">
              {consommations.map((c) => {
                const stock = stocks.find((s) => s.id === c.aliment_id);
                return (
                  <div key={c.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{stock?.nom || "—"}</p>
                      <p className="text-xs text-muted-foreground">{c.date && format(parseISO(c.date), "d MMM yyyy", { locale: dateLocale })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{c.quantite_kg} kg</p>
                      <p className="text-xs text-muted-foreground">{formatFCFA((c.quantite_kg || 0) * (stock?.prix_par_kg || 0))}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="pt-3 border-t border-border mt-2 flex justify-between">
            <span className="text-sm font-semibold">{t("bandeDetail.totalFeedCostRow")}</span>
            <span className="text-sm font-bold text-primary">{formatFCFA(coutProvende)}</span>
          </div>
        </div>
      )}

      {activeTab === "rentabilite" && (
        <RentabiliteTab
          bande={bande}
          consommations={consommations}
          stocks={stocks}
          traitements={traitements}
          medicaments={medicaments}
          transactions={transactions}
        />
      )}
    </div>
  );
}