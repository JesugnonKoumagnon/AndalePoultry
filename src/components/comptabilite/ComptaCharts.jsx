import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { format, parseISO, getDaysInMonth } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLanguage } from "@/lib/LanguageContext";

const PIE_COLORS_DEP = ["#ef4444","#f97316","#f59e0b","#ec4899","#a855f7","#6366f1","#14b8a6","#84cc16"];
const PIE_COLORS_REV = ["#22c55e","#16a34a","#4ade80","#86efac","#15803d","#bbf7d0","#166534","#6ee7b7"];

const fmtK = (v) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(abs / 1_000)}k`;
  return String(abs);
};

const tooltipStyle = {
  contentStyle: {
    borderRadius: "8px",
    border: "1px solid hsl(90,15%,88%)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    fontSize: "12px",
  },
};

// Determine if filterMonth is a single month (yyyy-MM) or "all"
export default function ComptaCharts({ transactions, filterMonth }) {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "en" ? enUS : fr;
  const numberLocale = lang === "en" ? "en-US" : "fr-FR";
  const catLabel = (cat) => t(`cat.${cat}`) || cat;
  const fmtFull = (v) => new Intl.NumberFormat(numberLocale).format(Math.round(v || 0)) + " FCFA";
  const fmtN = (v) => new Intl.NumberFormat(numberLocale).format(Math.round(v || 0));
  const isSingleMonth = filterMonth && filterMonth !== "all";

  // Bar chart data: daily (single month) or monthly (all)
  const barData = useMemo(() => {
    if (isSingleMonth) {
      const [y, m] = filterMonth.split("-").map(Number);
      const daysCount = getDaysInMonth(new Date(y, m - 1));
      const days = Array.from({ length: daysCount }, (_, i) => ({
        key: String(i + 1).padStart(2, "0"),
        label: `${i + 1}`,
        revenus: 0,
        depenses: 0,
      }));
      transactions.forEach((tx) => {
        if (!tx.date) return;
        const d = parseISO(tx.date);
        const tY = d.getFullYear();
        const tM = d.getMonth() + 1;
        if (tY !== y || tM !== m) return;
        const dayIdx = d.getDate() - 1;
        if (tx.type === "revenu") days[dayIdx].revenus += tx.montant || 0;
        else days[dayIdx].depenses += tx.montant || 0;
      });
      return days;
    } else {
      const map = {};
      transactions.forEach((tx) => {
        if (!tx.date) return;
        const key = format(parseISO(tx.date), "yyyy-MM");
        const label = format(parseISO(tx.date), "MMM yy", { locale: dateLocale });
        if (!map[key]) map[key] = { key, label: label.charAt(0).toUpperCase() + label.slice(1), revenus: 0, depenses: 0 };
        if (tx.type === "revenu") map[key].revenus += tx.montant || 0;
        else map[key].depenses += tx.montant || 0;
      });
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
    }
  }, [transactions, filterMonth, isSingleMonth, dateLocale]);

  // Pie: dépenses by category
  const depPieData = useMemo(() => {
    const map = {};
    transactions.filter((tx) => tx.type === "depense").forEach((tx) => {
      const cat = tx.categorie || "autre";
      map[cat] = (map[cat] || 0) + (tx.montant || 0);
    });
    return Object.entries(map).map(([cat, val]) => ({ name: catLabel(cat), value: val }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, t]);

  // Pie: revenus by category
  const revPieData = useMemo(() => {
    const map = {};
    transactions.filter((tx) => tx.type === "revenu").forEach((tx) => {
      const cat = tx.categorie || "autre";
      map[cat] = (map[cat] || 0) + (tx.montant || 0);
    });
    return Object.entries(map).map(([cat, val]) => ({ name: catLabel(cat), value: val }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, t]);

  // Top 5 dépenses du mois (or period)
  const top5Dep = useMemo(() => {
    return [...transactions]
      .filter((tx) => tx.type === "depense")
      .sort((a, b) => (b.montant || 0) - (a.montant || 0))
      .slice(0, 5);
  }, [transactions]);

  const hasBarData = barData.some((d) => d.revenus > 0 || d.depenses > 0);

  const renderLegendPct = (value, entry) => {
    const p = entry && entry.payload && typeof entry.payload.percent === "number"
      ? entry.payload.percent : 0;
    return <span>{value} — {(p * 100).toFixed(0)}%</span>;
  };

  return (
    <div className="space-y-4">
      {/* Bar chart */}
      {hasBarData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">
              {isSingleMonth ? t("charts.revenusDepensesJour") : t("charts.revenusDepensesMois")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={2} barCategoryGap="30%" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(90,15%,88%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={isSingleMonth ? 2 : 0} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK} width={48} />
                  <Tooltip {...tooltipStyle} formatter={(v, name) => [fmtFull(v), name === "revenus" ? t("charts.revenus") : t("charts.depenses")]} />
                  <Legend />
                  <Bar dataKey="revenus" name={t("charts.revenus")} fill="#22c55e" radius={[3,3,0,0]} />
                  <Bar dataKey="depenses" name={t("charts.depenses")} fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pie charts + Top 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pie dépenses */}
        {depPieData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">{t("charts.expensesByCategory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={depPieData} cx="50%" cy="42%" outerRadius={80} innerRadius={36} paddingAngle={2} dataKey="value">
                      {depPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS_DEP[i % PIE_COLORS_DEP.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v, name) => [fmtFull(v), name]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} formatter={renderLegendPct} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pie revenus */}
        {revPieData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">{t("charts.revenueByCategory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={revPieData} cx="50%" cy="42%" outerRadius={80} innerRadius={36} paddingAngle={2} dataKey="value">
                      {revPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS_REV[i % PIE_COLORS_REV.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v, name) => [fmtFull(v), name]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} formatter={renderLegendPct} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 5 dépenses */}
        {top5Dep.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">{t("charts.top5")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {top5Dep.map((tx, i) => {
                  const total = top5Dep.reduce((s, d) => s + (d.montant || 0), 0);
                  const pct = total > 0 ? Math.round(((tx.montant || 0) / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs text-muted-foreground truncate min-w-0">
                          {catLabel(tx.categorie)}{tx.description ? ` · ${tx.description}` : ""}
                        </span>
                        <span className="text-xs font-semibold text-destructive whitespace-nowrap">
                          {fmtN(tx.montant || 0)} FCFA
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-destructive h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}