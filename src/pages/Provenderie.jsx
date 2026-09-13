import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Wheat, AlertTriangle, TriangleAlert, Package } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StockListItem from "@/components/provenderie/StockListItem";
import StockForm from "@/components/provenderie/StockForm";
import ConsommationForm from "@/components/provenderie/ConsommationForm";
import ReapproForm from "@/components/provenderie/ReapproForm";
import PullToRefresh from "@/components/shared/PullToRefresh";
import useBackClose from "@/hooks/useBackClose";
import { useLanguage } from "@/lib/LanguageContext";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";

export default function Provenderie() {
  const [showForm, setShowForm] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [showConsoForm, setShowConsoForm] = useState(null);
  const [showReapproForm, setShowReapproForm] = useState(null);
  const [filterTab, setFilterTab] = useState("all");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  useBackClose(showForm, () => { setShowForm(false); setEditingStock(null); });
  useBackClose(!!showConsoForm, () => setShowConsoForm(null));
  useBackClose(!!showReapproForm, () => setShowReapproForm(null));

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  const { data: stocks = [], isLoading } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => base44.entities.StockAliment.list("-created_date"),
  });

  const { data: bandes = [] } = useQuery({
    queryKey: ["bandes", user?.id],
    queryFn: () => user?.id ? base44.entities.Bande.filter({ created_by_id: user.id, statut: "active" }) : [],
    enabled: !!user?.id,
  });

  const { data: allBandes = [] } = useQuery({
    queryKey: ["allBandes", user?.id],
    queryFn: () => user?.id ? base44.entities.Bande.filter({ created_by_id: user.id }) : [],
    enabled: !!user?.id,
  });

  const { data: consommations = [] } = useQuery({
    queryKey: ["consommations", user?.id],
    queryFn: () => user?.id ? base44.entities.ConsommationAliment.filter({ created_by_id: user.id }, "-date") : [],
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StockAliment.create({ ...data, capacite_max_kg: data.quantite_kg }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["stocks"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StockAliment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["stocks"] }); setShowForm(false); setEditingStock(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StockAliment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stocks"] }),
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
            bande_id: data.bande_id || null,
            description: `Consommation ${stock.nom} — ${data.quantite_kg} kg`,
            mode_paiement: "especes",
          });
        }
      }
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["consommations", user?.id] });
      const previous = queryClient.getQueryData(["consommations", user?.id]);
      const optimistic = { id: `temp-${Date.now()}`, ...data, created_by_id: user?.id };
      queryClient.setQueryData(["consommations", user?.id], (old = []) => [optimistic, ...old]);
      setShowConsoForm(null);
      return { previous };
    },
    onError: (err, data, context) => queryClient.setQueryData(["consommations", user?.id], context.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["consommations"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const reapproMutation = useMutation({
    // Note: l'achat/réapprovisionnement de stock n'est plus comptabilisé comme une dépense —
    // seule la consommation réelle génère une transaction, pour éviter le double comptage.
    mutationFn: async ({ stockId, quantite, date, fournisseur, prixParKg }) => {
      const stock = stocks.find((s) => s.id === stockId);
      if (stock) {
        const newQuantite = (stock.quantite_kg || 0) + quantite;
        const updates = { quantite_kg: newQuantite };
        if (prixParKg !== undefined) updates.prix_par_kg = prixParKg;
        if (fournisseur) updates.fournisseur = fournisseur;
        if (newQuantite > (stock.capacite_max_kg || 0)) updates.capacite_max_kg = newQuantite;
        await base44.entities.StockAliment.update(stock.id, updates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      setShowReapproForm(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, archived }) => base44.entities.StockAliment.update(id, { archived }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stocks"] }),
  });

  // Summary stats
  const valeurTotale = stocks.reduce((s, st) => s + (st.quantite_kg || 0) * (st.prix_par_kg || 0), 0);
  const alertes = stocks.filter((s) => s.seuil_alerte_kg && s.quantite_kg <= s.seuil_alerte_kg).length;
  const consoMois = useMemo(() => {
    return consommations
      .filter((c) => {
        if (!c.date) return false;
        try { return isWithinInterval(parseISO(c.date), { start: monthStart, end: monthEnd }); }
        catch { return false; }
      })
      .reduce((s, c) => s + (c.quantite_kg || 0), 0);
  }, [consommations, monthStart, monthEnd]);

  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => {
      const matchSearch = !search || s.nom.toLowerCase().includes(search.toLowerCase());
      const isArchived = !!s.archived;
      if (filterTab === "archived") return matchSearch && isArchived;
      if (isArchived) return false; // hide archived from non-archived tabs
      const matchTab =
        filterTab === "all" ||
        (filterTab === "stock" && !(s.seuil_alerte_kg && s.quantite_kg <= s.seuil_alerte_kg)) ||
        (filterTab === "alerte" && s.seuil_alerte_kg && s.quantite_kg <= s.seuil_alerte_kg);
      return matchSearch && matchTab;
    });
  }, [stocks, search, filterTab]);

  // Historique: last consommations with bande name
  const historique = useMemo(() => {
    return [...consommations]
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 20)
      .map((c) => {
        const stock = stocks.find((s) => s.id === c.aliment_id);
        const bande = allBandes.find((b) => b.id === c.bande_id);
        return { ...c, stockNom: stock?.nom || "—", bandeNom: bande?.nom || "—", prixParKg: stock?.prix_par_kg || 0 };
      });
  }, [consommations, stocks, allBandes]);

  const formatFCFA = (n) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M FCFA`;
    if (n >= 1_000) return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} FCFA`;
    return `${new Intl.NumberFormat("fr-FR").format(n)} FCFA`;
  };

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = parseISO(dateStr);
      const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      if (diff === 0) return t("common.today");
      if (diff === 1) return t("common.yesterday");
      return t("common.daysAgo", { n: diff });
    } catch { return dateStr; }
  };

  const handleRefresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["stocks"] }),
    queryClient.invalidateQueries({ queryKey: ["consommations"] }),
    queryClient.invalidateQueries({ queryKey: ["bandes"] }),
    queryClient.invalidateQueries({ queryKey: ["allBandes"] }),
  ]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      <PageHeader
        title={t("provenderie.title")}
        description={stocks.length === 1 ? t("provenderie.descOne", { n: stocks.length }) : t("provenderie.descMany", { n: stocks.length })}
        actions={
          <Button onClick={() => { setEditingStock(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> {t("provenderie.newFood")}
          </Button>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10"><Wheat className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="text-2xl font-bold font-heading">{formatFCFA(valeurTotale)}</p>
            <p className="text-sm text-muted-foreground">{t("provenderie.totalValue")}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-destructive/10"><TriangleAlert className="w-5 h-5 text-destructive" /></div>
          <div>
            <p className="text-2xl font-bold font-heading">{alertes}</p>
            <p className="text-sm text-muted-foreground">{t("provenderie.lowAlerts")}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-muted"><Package className="w-5 h-5 text-muted-foreground" /></div>
          <div>
            <p className="text-2xl font-bold font-heading">{consoMois.toLocaleString("fr-FR")}</p>
            <p className="text-sm text-muted-foreground">{t("provenderie.monthConsumption")}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <StockForm
          stock={editingStock}
          onSubmit={(data) => editingStock ? updateMutation.mutate({ id: editingStock.id, data }) : createMutation.mutate(data)}
          onCancel={() => { setShowForm(false); setEditingStock(null); }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {showConsoForm && (
        <ConsommationForm
          stock={showConsoForm}
          bandes={bandes}
          onSubmit={(data) => consoMutation.mutate(data)}
          onCancel={() => setShowConsoForm(null)}
          isLoading={consoMutation.isPending}
        />
      )}

      {showReapproForm && (
        <ReapproForm
          stock={showReapproForm}
          onSubmit={({ quantite, date, fournisseur, prixParKg }) =>
            reapproMutation.mutate({ stockId: showReapproForm.id, quantite, date, fournisseur, prixParKg })
          }
          onCancel={() => setShowReapproForm(null)}
          isLoading={reapproMutation.isPending}
        />
      )}

      <div className="flex gap-6 items-start">
        {/* Left: stock list */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder={t("provenderie.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
            <div className="flex gap-1 flex-wrap">
              {[
                 { key: "all", labelKey: "provenderie.filter.all" },
                 { key: "stock", labelKey: "provenderie.filter.stock" },
                 { key: "alerte", labelKey: "provenderie.filter.alert" },
                 { key: "archived", labelKey: "provenderie.filter.archived" },
               ].map((f) => (
                 <button
                   key={f.key}
                   onClick={() => setFilterTab(f.key)}
                   className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                     filterTab === f.key
                       ? "bg-primary text-primary-foreground"
                       : "text-muted-foreground hover:bg-muted"
                   }`}
                 >
                   {t(f.labelKey)}
                 </button>
               ))}
            </div>
          </div>

          {filteredStocks.length === 0 && !isLoading ? (
            <EmptyState
              icon={Wheat}
              title={t("provenderie.empty.title")}
              description={t("provenderie.empty.desc")}
              action={
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> {t("provenderie.empty.action")}
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredStocks.map((stock) => (
                <StockListItem
                  key={stock.id}
                  stock={stock}
                  onEdit={() => { setEditingStock(stock); setShowForm(true); }}
                  onDelete={() => deleteMutation.mutate(stock.id)}
                  onConsommation={() => setShowConsoForm(stock)}
                  onReappro={() => setShowReapproForm(stock)}
                  onArchive={() => archiveMutation.mutate({ id: stock.id, archived: !stock.archived })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: historique */}
        <div className="w-72 shrink-0 hidden lg:block">
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h3 className="font-heading font-semibold">{t("provenderie.history.title")}</h3>
            {historique.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("provenderie.history.empty")}</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {historique.map((c) => (
                  <div key={c.id} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{c.stockNom}</p>
                      <p className="text-xs text-muted-foreground">{c.bandeNom}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeDate(c.date)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{c.quantite_kg} kg</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFCFA((c.quantite_kg || 0) * c.prixParKg)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}