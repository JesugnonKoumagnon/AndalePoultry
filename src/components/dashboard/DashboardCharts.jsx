import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLanguage } from "@/lib/LanguageContext";

const COLORS = [
  "hsl(145, 55%, 36%)",
  "hsl(42, 90%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(25, 85%, 57%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 72%, 51%)",
];

const formatTick = (v) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)}k`;
  return v;
};

const tooltipStyle = {
  contentStyle: {
    borderRadius: "8px",
    border: "1px solid hsl(90,15%,88%)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    fontSize: "12px",
  },
};

export default function DashboardCharts({ transactions, mortalites, bandes }) {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "en" ? enUS : fr;
  const [chartPeriod, setChartPeriod] = useState("6");

  const catLabel = (key) => (key ? t(`cat.${key}`) : t("cat.autre"));

  const formatFCFA = (n) => `${new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR").format(n)} FCFA`;

  // Bar chart - configurable months
  const monthlyData = useMemo(() => {
    const numMonths = parseInt(chartPeriod);
    const now = new Date();
    const months = Array.from({ length: numMonths }, (_, i) => {
      const d = subMonths(now, numMonths - 1 - i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM", { locale: dateLocale });
      return { key, label: label.charAt(0).toUpperCase() + label.slice(1), revenus: 0, depenses: 0 };
    });
    transactions.forEach((tx) => {
      if (!tx.date) return;
      const key = format(parseISO(tx.date), "yyyy-MM");
      const m = months.find((mo) => mo.key === key);
      if (!m) return;
      if (tx.type === "revenu") m.revenus += tx.montant || 0;
      else m.depenses += tx.montant || 0;
    });
    return months;
  }, [transactions, chartPeriod, dateLocale]);

  const soldeNet6Mois = monthlyData.reduce((s, m) => s + m.revenus - m.depenses, 0);

  // Expense categories pie
  const categorieDepenses = useMemo(() => {
    const map = {};
    transactions.filter((tx) => tx.type === "depense").forEach((tx) => {
      const label = catLabel(tx.categorie);
      map[label] = (map[label] || 0) + (tx.montant || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions, lang]);

  // Revenue categories pie
  const categorieRevenus = useMemo(() => {
    const map = {};
    transactions.filter((tx) => tx.type === "revenu").forEach((tx) => {
      const label = catLabel(tx.categorie);
      map[label] = (map[label] || 0) + (tx.montant || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions, lang]);

  // Top 5 expenses of the month by category
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const top5DepensesMois = useMemo(() => {
    const map = {};
    transactions
      .filter((tx) => {
        if (tx.type !== "depense" || !tx.date) return false;
        try { return isWithinInterval(parseISO(tx.date), { start: monthStart, end: monthEnd }); }
        catch { return false; }
      })
      .forEach((tx) => {
        const label = catLabel(tx.categorie);
        map[label] = (map[label] || 0) + (tx.montant || 0);
      });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [transactions, monthStart, monthEnd, lang]);

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={tooltipStyle.contentStyle} className="p-3 min-w-[160px]">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.fill }} className="text-xs">
            {p.name === "revenus" ? t("common.revenus") : t("common.depenses")} : {formatFCFA(p.value)}
          </p>
        ))}
        <p className="text-xs text-muted-foreground mt-1 border-t pt-1">
          {t("dashboard.charts.balance")} : {formatFCFA((payload[0]?.value || 0) - (payload[1]?.value || 0))}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Bar chart full width */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-heading">{t("dashboard.charts.headerTitle")}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("dashboard.charts.lastMonths", { n: chartPeriod })}</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={chartPeriod} onValueChange={setChartPeriod}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">{t("dashboard.charts.monthsN", { n: 3 })}</SelectItem>
                  <SelectItem value="6">{t("dashboard.charts.monthsN", { n: 6 })}</SelectItem>
                  <SelectItem value="12">{t("dashboard.charts.monthsN", { n: 12 })}</SelectItem>
                </SelectContent>
              </Select>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${soldeNet6Mois >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                {t("dashboard.charts.balance")} : {soldeNet6Mois >= 0 ? "+" : ""}{formatFCFA(soldeNet6Mois)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={6} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(90,15%,88%)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={formatTick} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "hsl(90,15%,93%)" }} />
                <Bar dataKey="revenus" fill="hsl(145, 55%, 36%)" radius={[5, 5, 0, 0]} name="revenus" />
                <Bar dataKey="depenses" fill="hsl(0, 72%, 51%)" radius={[5, 5, 0, 0]} name="depenses" />
                <Legend formatter={(v) => v === "revenus" ? t("common.revenus") : t("common.depenses")} wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie charts + top 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">{t("dashboard.charts.expByCat")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              {categorieDepenses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categorieDepenses} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {categorieDepenses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v) => formatFCFA(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-xs text-muted-foreground">{t("common.noData")}</div>}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              {categorieDepenses.slice(0, 5).map((item, i) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">{t("dashboard.charts.revByCat")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              {categorieRevenus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categorieRevenus} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {categorieRevenus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v) => formatFCFA(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-xs text-muted-foreground">{t("common.noData")}</div>}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              {categorieRevenus.slice(0, 5).map((item, i) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 expenses of the month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">{t("dashboard.charts.top5")}</CardTitle>
          </CardHeader>
          <CardContent>
            {top5DepensesMois.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">{t("dashboard.charts.noExpense")}</p>
            ) : (
              <div className="space-y-3">
                {top5DepensesMois.map((item, i) => {
                  const max = top5DepensesMois[0].value;
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{formatFCFA(item.value)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-destructive/70 transition-all" style={{ width: `${(item.value / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}