import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bird, TrendingUp, TrendingDown, Skull, Scale } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import BandesOverview from "@/components/dashboard/BandesOverview";
import StockAlerts from "@/components/dashboard/StockAlerts";
import QuickNav from "@/components/dashboard/QuickNav";
import { Link } from "react-router-dom";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format, subMonths } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import PeriodFilter from "@/components/shared/PeriodFilter";
import PullToRefresh from "@/components/shared/PullToRefresh";
import { useLanguage } from "@/lib/LanguageContext";

const formatFCFA = (n) => {
  const abs = Math.abs(n);
  let str;
  if (abs >= 1_000_000) str = `${(abs / 1_000_000).toFixed(2)}M`;
  else if (abs >= 1_000) str = `${(abs / 1_000).toFixed(2).replace(/\.?0+$/, "")}K`;
  else str = new Intl.NumberFormat("fr-FR").format(abs);
  return (n < 0 ? "−" : "") + str + " FCFA";
};

export default function Dashboard() {
  const now = new Date();
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const dateLocale = lang === "en" ? enUS : fr;
  const [periodMode, setPeriodMode] = React.useState("single");
  const [filterMonth, setFilterMonth] = React.useState(format(now, "yyyy-MM"));
  const [dateFrom, setDateFrom] = React.useState(format(subMonths(now, 2), "yyyy-MM"));
  const [dateTo, setDateTo] = React.useState(format(now, "yyyy-MM"));

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  const { data: bandes = [] } = useQuery({
    queryKey: ["bandes", user?.id],
    queryFn: () => user?.id ? base44.entities.Bande.filter({ created_by_id: user.id }, "-created_date") : [],
    enabled: !!user?.id,
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: () => user?.id ? base44.entities.Transaction.filter({ created_by_id: user.id }, "-date") : [],
    enabled: !!user?.id,
  });
  const { data: mortalites = [] } = useQuery({
    queryKey: ["mortalites", user?.id],
    queryFn: () => user?.id ? base44.entities.Mortalite.filter({ created_by_id: user.id }, "-date") : [],
    enabled: !!user?.id,
  });
  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => base44.entities.StockAliment.list(),
  });

  const bandesActives = bandes.filter((b) => b.statut === "active");
  const stocksBas = stocks.filter((s) => s.seuil_alerte_kg && s.quantite_kg <= s.seuil_alerte_kg);
  const totalMortalite = mortalites.reduce((s, m) => s + (m.nombre || 0), 0);

  const periodTx = useMemo(() => transactions.filter((t) => {
    if (!t.date) return false;
    try {
      if (periodMode === "all") return true;
      if (periodMode === "single") {
        const [y, m] = filterMonth.split("-").map(Number);
        const start = new Date(y, m - 1, 1);
        const end = endOfMonth(start);
        return isWithinInterval(parseISO(t.date), { start, end });
      }
      if (periodMode === "range" && dateFrom && dateTo) {
        const from = dateFrom <= dateTo ? dateFrom : dateTo;
        const to = dateFrom <= dateTo ? dateTo : dateFrom;
        const [fry, frm] = from.split("-").map(Number);
        const [toy, tom] = to.split("-").map(Number);
        const start = new Date(fry, frm - 1, 1);
        const end = endOfMonth(new Date(toy, tom - 1, 1));
        return isWithinInterval(parseISO(t.date), { start, end });
      }
    } catch { return false; }
    return false;
  }), [transactions, periodMode, filterMonth, dateFrom, dateTo]);

  const periodLabel = periodMode === "all"
    ? t("common.allMonths")
    : periodMode === "range" && dateFrom && dateTo
      ? `${format(new Date(dateFrom + "-01"), "MMM yyyy", { locale: dateLocale })} → ${format(new Date(dateTo + "-01"), "MMM yyyy", { locale: dateLocale })}`
      : format(new Date(filterMonth + "-01"), "MMMM yyyy", { locale: dateLocale });

  const revenusMois = periodTx.filter((t) => t.type === "revenu").reduce((s, t) => s + (t.montant || 0), 0);
  const depensesMois = periodTx.filter((t) => t.type === "depense").reduce((s, t) => s + (t.montant || 0), 0);
  const soldeMois = revenusMois - depensesMois;

  const handleRefresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["bandes"] }),
    queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    queryClient.invalidateQueries({ queryKey: ["mortalites"] }),
    queryClient.invalidateQueries({ queryKey: ["stocks"] }),
  ]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
      />

      {/* Quick nav */}
      <QuickNav />

      {/* Period filter */}
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground font-medium mb-3">{t("dashboard.period")}</p>
        <PeriodFilter
          mode={periodMode}
          onModeChange={setPeriodMode}
          filterMonth={filterMonth}
          onFilterMonth={setFilterMonth}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFrom={setDateFrom}
          onDateTo={setDateTo}
        />
        {periodLabel && <p className="text-xs text-muted-foreground mt-2">{t("dashboard.display")} : <span className="font-semibold text-foreground">{periodLabel}</span></p>}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label={`${t("dashboard.revenues")} · ${periodLabel}`} value={formatFCFA(revenusMois)} icon={TrendingUp} variant="primary" />
        <StatCard label={`${t("dashboard.expenses")} · ${periodLabel}`} value={formatFCFA(depensesMois)} icon={TrendingDown} variant="warning" />
        <StatCard
          label={`${t("dashboard.balance")} · ${periodLabel}`}
          value={formatFCFA(soldeMois)}
          icon={Scale}
          variant={soldeMois >= 0 ? "primary" : "danger"}
        />
        <StatCard
          label={t("dashboard.mortality")}
          value={totalMortalite}
          icon={Skull}
          variant={totalMortalite > 0 ? "danger" : "default"}
        />
        <StatCard
          label={t("dashboard.activeBands")}
          value={bandesActives.length}
          icon={Bird}
          trendLabel={`${bandesActives.reduce((s, b) => s + (b.effectif_actuel || b.effectif_initial || 0), 0)} ${t("dashboard.subjects")}`}
          trend="up"
          variant="primary"
        />
      </div>

      {/* Charts */}
      <DashboardCharts transactions={transactions} mortalites={mortalites} bandes={bandes} />

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={transactions} />
        </div>
        <div className="space-y-6">
          <BandesOverview bandes={bandesActives} />
          <StockAlerts stocks={stocks} />
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}