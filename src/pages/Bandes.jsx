import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Bird, Skull, Wheat } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import BandeCard from "@/components/bandes/BandeCard";
import BandeForm from "@/components/bandes/BandeForm";
import MortaliteForm from "@/components/bandes/MortaliteForm";
import PullToRefresh from "@/components/shared/PullToRefresh";
import useBackClose from "@/hooks/useBackClose";
import { useLanguage } from "@/lib/LanguageContext";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

const FILTERS = [
  { key: "all", labelKey: "bandes.all" },
  { key: "active", labelKey: "bandes.active" },
  { key: "terminee", labelKey: "bandes.sold" },
  { key: "planifiee", labelKey: "bandes.planned" },
];

export default function Bandes() {
  const [showForm, setShowForm] = useState(false);
  const [editingBande, setEditingBande] = useState(null);
  const [showMortaliteForm, setShowMortaliteForm] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  useBackClose(showForm, () => { setShowForm(false); setEditingBande(null); });
  useBackClose(!!showMortaliteForm, () => setShowMortaliteForm(null));

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  const { data: bandes = [], isLoading } = useQuery({
    queryKey: ["bandes", user?.id],
    queryFn: () => user?.id ? base44.entities.Bande.filter({ created_by_id: user.id }, "-created_date") : [],
    enabled: !!user?.id,
  });

  const { data: mortalites = [] } = useQuery({
    queryKey: ["mortalites", user?.id],
    queryFn: () => user?.id ? base44.entities.Mortalite.filter({ created_by_id: user.id }, "-date") : [],
    enabled: !!user?.id,
  });

  const { data: consommations = [] } = useQuery({
    queryKey: ["consommations", user?.id],
    queryFn: () => user?.id ? base44.entities.ConsommationAliment.filter({ created_by_id: user.id }, "-date") : [],
    enabled: !!user?.id,
  });

  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => base44.entities.StockAliment.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Bande.create({ ...data, effectif_actuel: data.effectif_initial }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["bandes", user?.id] });
      const previous = queryClient.getQueryData(["bandes", user?.id]);
      const optimistic = { id: `temp-${Date.now()}`, ...data, effectif_actuel: data.effectif_initial, created_by_id: user?.id };
      queryClient.setQueryData(["bandes", user?.id], (old = []) => [optimistic, ...old]);
      setShowForm(false);
      return { previous };
    },
    onError: (err, data, context) => queryClient.setQueryData(["bandes", user?.id], context.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["bandes"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bande.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bandes"] }); setShowForm(false); setEditingBande(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Bande.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["bandes", user?.id] });
      const previous = queryClient.getQueryData(["bandes", user?.id]);
      queryClient.setQueryData(["bandes", user?.id], (old = []) => old.filter((b) => b.id !== id));
      return { previous };
    },
    onError: (err, id, context) => queryClient.setQueryData(["bandes", user?.id], context.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["bandes"] }),
  });

  const mortaliteMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Mortalite.create(data);
      const bande = bandes.find((b) => b.id === data.bande_id);
      if (bande) {
        await base44.entities.Bande.update(bande.id, {
          effectif_actuel: (bande.effectif_actuel ?? bande.effectif_initial) - data.nombre,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bandes"] });
      queryClient.invalidateQueries({ queryKey: ["mortalites"] });
      setShowMortaliteForm(null);
    },
  });

  const getMortaliteForBande = (bandeId) =>
    mortalites.filter((m) => m.bande_id === bandeId).reduce((s, m) => s + (m.nombre || 0), 0);

  const getCoutProvendeForBande = (bandeId) => {
    return consommations
      .filter((c) => c.bande_id === bandeId)
      .reduce((sum, c) => {
        const stock = stocks.find((s) => s.id === c.aliment_id);
        return sum + (c.quantite_kg || 0) * (stock?.prix_par_kg || 0);
      }, 0);
  };

  // Monthly stats
  const mortaliteCeMois = useMemo(() => {
    return mortalites.filter((m) => {
      if (!m.date) return false;
      try {
        return isWithinInterval(parseISO(m.date), { start: monthStart, end: monthEnd });
      } catch { return false; }
    }).reduce((s, m) => s + (m.nombre || 0), 0);
  }, [mortalites, monthStart, monthEnd]);

  const coutProvendeCeMois = useMemo(() => {
    return consommations
      .filter((c) => {
        if (!c.date) return false;
        try {
          return isWithinInterval(parseISO(c.date), { start: monthStart, end: monthEnd });
        } catch { return false; }
      })
      .reduce((sum, c) => {
        const stock = stocks.find((s) => s.id === c.aliment_id);
        return sum + (c.quantite_kg || 0) * (stock?.prix_par_kg || 0);
      }, 0);
  }, [consommations, stocks, monthStart, monthEnd]);

  const formatFCFA = (n) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M FCFA`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k FCFA`;
    return `${new Intl.NumberFormat("fr-FR").format(n)} FCFA`;
  };

  const filteredBandes = activeFilter === "all"
    ? bandes
    : bandes.filter((b) => b.statut === activeFilter);

  const activeBandes = bandes.filter((b) => b.statut === "active");

  const handleRefresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["bandes"] }),
    queryClient.invalidateQueries({ queryKey: ["mortalites"] }),
    queryClient.invalidateQueries({ queryKey: ["consommations"] }),
    queryClient.invalidateQueries({ queryKey: ["stocks"] }),
  ]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      <PageHeader
        title={t("bandes.title")}
        description={activeBandes.length === 1 ? t("bandes.descOne", { n: activeBandes.length }) : t("bandes.descMany", { n: activeBandes.length })}
        actions={
          <Button onClick={() => { setEditingBande(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> {t("bandes.newBande")}
          </Button>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10"><Bird className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="text-2xl font-bold font-heading">{activeBandes.length}</p>
            <p className="text-sm text-muted-foreground">{t("bandes.totalActive")}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-destructive/10"><Skull className="w-5 h-5 text-destructive" /></div>
          <div>
            <p className="text-2xl font-bold font-heading">{mortaliteCeMois}</p>
            <p className="text-sm text-muted-foreground">{t("bandes.monthMortality")}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-secondary/10"><Wheat className="w-5 h-5 text-secondary-foreground" /></div>
          <div>
            <p className="text-2xl font-bold font-heading">{formatFCFA(coutProvendeCeMois)}</p>
            <p className="text-sm text-muted-foreground">{t("bandes.monthFeedCost")}</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === f.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{filteredBandes.length === 1 ? t("bandes.totalSingular", { n: filteredBandes.length }) : t("bandes.totalPlural", { n: filteredBandes.length })}</p>

      {showForm && (
        <BandeForm
          bande={editingBande}
          onSubmit={(data) => editingBande ? updateMutation.mutate({ id: editingBande.id, data }) : createMutation.mutate(data)}
          onCancel={() => { setShowForm(false); setEditingBande(null); }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {showMortaliteForm && (
        <MortaliteForm
          bande={showMortaliteForm}
          onSubmit={(data) => mortaliteMutation.mutate(data)}
          onCancel={() => setShowMortaliteForm(null)}
          isLoading={mortaliteMutation.isPending}
        />
      )}

      {filteredBandes.length === 0 && !isLoading ? (
        <EmptyState
          icon={Bird}
          title={t("bandes.empty.title")}
          description={t("bandes.empty.desc")}
          action={
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" /> {t("bandes.empty.action")}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBandes.map((bande) => (
            <BandeCard
              key={bande.id}
              bande={bande}
              mortalite={getMortaliteForBande(bande.id)}
              coutProvende={getCoutProvendeForBande(bande.id)}
              onEdit={() => { setEditingBande(bande); setShowForm(true); }}
              onDelete={() => deleteMutation.mutate(bande.id)}
              onAddMortalite={() => setShowMortaliteForm(bande)}
            />
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}