import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Download, Calculator, TrendingUp, TrendingDown, Scale, Hash, Search, FileText, Loader2, Sheet } from "lucide-react";
import * as XLSX from "xlsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import TransactionForm from "@/components/comptabilite/TransactionForm";
import TransactionList from "@/components/comptabilite/TransactionList";
import ComptaCharts from "@/components/comptabilite/ComptaCharts";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import PeriodFilter from "@/components/shared/PeriodFilter";
import PullToRefresh from "@/components/shared/PullToRefresh";
import useBackClose from "@/hooks/useBackClose";
import { useLanguage } from "@/lib/LanguageContext";

const formatFCFA = (n) => {
  const abs = Math.abs(n);
  let str;
  if (abs >= 1_000_000) str = `${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M FCFA`;
  else if (abs >= 1_000) str = `${Math.round(abs / 1_000)}k FCFA`;
  else str = `${new Intl.NumberFormat("fr-FR").format(abs)} FCFA`;
  return n < 0 ? `−${str}` : str;
};

export default function Comptabilite() {
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterCategorie, setFilterCategorie] = useState("all");
  const [periodMode, setPeriodMode] = useState("single"); // "single" | "all" | "range"
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "yyyy-MM"));
  const [dateFrom, setDateFrom] = useState(format(subMonths(new Date(), 2), "yyyy-MM"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM"));
  const [filterBande, setFilterBande] = useState("all");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  useBackClose(showForm, () => { setShowForm(false); setEditingTx(null); });
  const { t, lang } = useLanguage();
  const dateLocale = lang === "en" ? enUS : fr;

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: () => user?.id ? base44.entities.Transaction.filter({ created_by_id: user.id }, "-date") : [],
    enabled: !!user?.id,
  });

  const { data: bandes = [] } = useQuery({
    queryKey: ["bandes", user?.id],
    queryFn: () => user?.id ? base44.entities.Bande.filter({ created_by_id: user.id }) : [],
    enabled: !!user?.id,
  });

  const { data: fournisseurs = [] } = useQuery({
    queryKey: ["fournisseurs"],
    queryFn: () => base44.entities.Fournisseur.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const allBandes = bandes;

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

  // Real-time: auto-refresh transactions when any change happens
  useEffect(() => {
    const unsub = base44.entities.Transaction.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    });
    return unsub;
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["transactions", user?.id] });
      const previous = queryClient.getQueryData(["transactions", user?.id]);
      const optimistic = { id: `temp-${Date.now()}`, ...data, created_by_id: user?.id };
      queryClient.setQueryData(["transactions", user?.id], (old = []) => [optimistic, ...old]);
      setShowForm(false);
      return { previous };
    },
    onError: (err, data, context) => queryClient.setQueryData(["transactions", user?.id], context.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Transaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setShowForm(false);
      setEditingTx(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transaction.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["transactions", user?.id] });
      const previous = queryClient.getQueryData(["transactions", user?.id]);
      queryClient.setQueryData(["transactions", user?.id], (old = []) => old.filter((t) => t.id !== id));
      return { previous };
    },
    onError: (err, id, context) => queryClient.setQueryData(["transactions", user?.id], context.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategorie !== "all" && t.categorie !== filterCategorie) return false;
      if (filterBande !== "all" && t.bande_id !== filterBande) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchDesc = (t.description || "").toLowerCase().includes(q);
        const matchCat = (t.categorie || "").toLowerCase().includes(q);
        const matchMontant = String(t.montant || "").includes(q);
        if (!matchDesc && !matchCat && !matchMontant) return false;
      }
      if (periodMode === "single") {
        if (!t.date) return false;
        try {
          const [y, m] = filterMonth.split("-").map(Number);
          const start = new Date(y, m - 1, 1);
          const end = endOfMonth(start);
          return isWithinInterval(parseISO(t.date), { start, end });
        } catch { return false; }
      }
      if (periodMode === "range" && dateFrom && dateTo) {
        if (!t.date) return false;
        try {
          const [fy, fm] = dateFrom.split("-").map(Number);
          const [ty, tm] = dateTo.split("-").map(Number);
          const from = dateFrom <= dateTo ? dateFrom : dateTo;
          const to = dateFrom <= dateTo ? dateTo : dateFrom;
          const [fry, frm] = from.split("-").map(Number);
          const [toy, tom] = to.split("-").map(Number);
          const start = new Date(fry, frm - 1, 1);
          const end = endOfMonth(new Date(toy, tom - 1, 1));
          return isWithinInterval(parseISO(t.date), { start, end });
        } catch { return false; }
      }
      return true; // "all"
    });
  }, [transactions, filterType, filterCategorie, periodMode, filterMonth, dateFrom, dateTo, filterBande, search]);

  const totalRevenus = filtered.filter((t) => t.type === "revenu").reduce((s, t) => s + (t.montant || 0), 0);
  const totalDepenses = filtered.filter((t) => t.type === "depense").reduce((s, t) => s + (t.montant || 0), 0);
  const marge = totalRevenus - totalDepenses;

  const CAT_LABELS = {
    vente_volaille: "Vente volaille", vente_oeufs: "Vente œufs", vente_fumier: "Vente fumier",
    achat_aliment: "Achat aliment", achat_poussins: "Achat poussins", medicaments: "Médicaments",
    main_oeuvre: "Main d'œuvre", equipement: "Équipement", transport: "Transport",
    electricite_eau: "Élec./Eau", autre: "Autre",
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1 — Résumé
    const depByCategory = {};
    const revByCategory = {};
    filtered.filter(t => t.type === "depense").forEach(t => {
      depByCategory[t.categorie] = (depByCategory[t.categorie] || 0) + (t.montant || 0);
    });
    filtered.filter(t => t.type === "revenu").forEach(t => {
      revByCategory[t.categorie] = (revByCategory[t.categorie] || 0) + (t.montant || 0);
    });

    const resumeRows = [
      ["BILAN — " + monthLabel, ""],
      ["Généré le", new Date().toLocaleDateString("fr-FR")],
      [],
      ["RÉSUMÉ FINANCIER", ""],
      ["Revenus totaux (FCFA)", totalRevenus],
      ["Dépenses totales (FCFA)", totalDepenses],
      ["Solde net (FCFA)", marge],
      ["Nombre de transactions", filtered.length],
    ];
    const wsResume = XLSX.utils.aoa_to_sheet(resumeRows);
    wsResume["!cols"] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsResume, "Résumé");

    // Sheet 2 — Détail transactions
    const txRows = [
      ["Date", "Type", "Catégorie", "Description", "Montant (FCFA)", "Mode de paiement", "Bande"],
      ...filtered.map(t => {
        const bande = bandes.find(b => b.id === t.bande_id);
        return [
          t.date || "",
          t.type === "revenu" ? "Revenu" : "Dépense",
          CAT_LABELS[t.categorie] || t.categorie || "",
          t.description || "",
          t.montant || 0,
          t.mode_paiement || "especes",
          bande?.nom || "",
        ];
      }),
    ];
    const wsTx = XLSX.utils.aoa_to_sheet(txRows);
    wsTx["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 40 }, { wch: 16 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsTx, "Transactions");

    // Sheet 3 — Dépenses par catégorie
    const depRows = [
      ["Catégorie", "Montant (FCFA)", "% du total"],
      ...Object.entries(depByCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => [
        CAT_LABELS[cat] || cat,
        val,
        totalDepenses > 0 ? +((val / totalDepenses) * 100).toFixed(1) : 0,
      ]),
      ["TOTAL", totalDepenses, 100],
    ];
    const wsDep = XLSX.utils.aoa_to_sheet(depRows);
    wsDep["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsDep, "Dépenses par catégorie");

    // Sheet 4 — Revenus par catégorie
    const revRows = [
      ["Catégorie", "Montant (FCFA)", "% du total"],
      ...Object.entries(revByCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => [
        CAT_LABELS[cat] || cat,
        val,
        totalRevenus > 0 ? +((val / totalRevenus) * 100).toFixed(1) : 0,
      ]),
      ["TOTAL", totalRevenus, 100],
    ];
    const wsRev = XLSX.utils.aoa_to_sheet(revRows);
    wsRev["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsRev, "Revenus par catégorie");

    // Sheet 5 — Bandes actives
    const bandesRows = [
      ["Nom", "Espèce", "Effectif initial", "Effectif actuel", "Date entrée", "Statut"],
      ...allBandes.map(b => [
        b.nom,
        b.espece,
        b.effectif_initial || 0,
        b.effectif_actuel ?? b.effectif_initial ?? 0,
        b.date_entree || "",
        b.statut === "active" ? "Active" : b.statut === "terminee" ? "Terminée" : "Planifiée",
      ]),
    ];
    const wsBandes = XLSX.utils.aoa_to_sheet(bandesRows);
    wsBandes["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsBandes, "Bandes");

    XLSX.writeFile(wb, `AgriVolaille_Bilan_${monthLabel.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportCSV = () => {
    const sep = ";"; // Excel-friendly separator
    const BOM = "\uFEFF"; // UTF-8 BOM for Excel

    // Sheet 1: Résumé
    const depByCategory = {};
    const revByCategory = {};
    filtered.filter(t => t.type === "depense").forEach(t => {
      depByCategory[t.categorie] = (depByCategory[t.categorie] || 0) + (t.montant || 0);
    });
    filtered.filter(t => t.type === "revenu").forEach(t => {
      revByCategory[t.categorie] = (revByCategory[t.categorie] || 0) + (t.montant || 0);
    });

    let csv = BOM;

    // === SHEET 1: RÉSUMÉ ===
    csv += `BILAN MENSUEL — ${monthLabel}\n`;
    csv += `Généré le${sep}${format(new Date(), "dd/MM/yyyy")}\n\n`;

    csv += `RÉSUMÉ FINANCIER\n`;
    csv += `Revenus totaux${sep}${totalRevenus}\n`;
    csv += `Dépenses totales${sep}${totalDepenses}\n`;
    csv += `Solde net${sep}${marge}\n\n`;

    // === SHEET 2: DÉPENSES PAR CATÉGORIE ===
    csv += `DÉPENSES PAR CATÉGORIE\n`;
    csv += `Catégorie${sep}Montant (FCFA)${sep}% du total\n`;
    Object.entries(depByCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, val]) => {
      const pct = totalDepenses > 0 ? ((val / totalDepenses) * 100).toFixed(1) : "0";
      csv += `${CAT_LABELS[cat] || cat}${sep}${val}${sep}${pct}%\n`;
    });
    csv += `TOTAL${sep}${totalDepenses}${sep}100%\n\n`;

    // === SHEET 3: REVENUS PAR CATÉGORIE ===
    csv += `REVENUS PAR CATÉGORIE\n`;
    csv += `Catégorie${sep}Montant (FCFA)${sep}% du total\n`;
    Object.entries(revByCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, val]) => {
      const pct = totalRevenus > 0 ? ((val / totalRevenus) * 100).toFixed(1) : "0";
      csv += `${CAT_LABELS[cat] || cat}${sep}${val}${sep}${pct}%\n`;
    });
    csv += `TOTAL${sep}${totalRevenus}${sep}100%\n\n`;

    // === SHEET 4: DÉTAIL TRANSACTIONS ===
    csv += `DÉTAIL DES TRANSACTIONS\n`;
    csv += `Date${sep}Type${sep}Catégorie${sep}Description${sep}Montant (FCFA)${sep}Mode de paiement${sep}Bande\n`;
    filtered.forEach((t) => {
      const bande = bandes.find(b => b.id === t.bande_id);
      csv += `${t.date}${sep}${t.type === "revenu" ? "Revenu" : "Dépense"}${sep}${CAT_LABELS[t.categorie] || t.categorie}${sep}${(t.description || "").replace(/;/g, ",")}${sep}${t.montant}${sep}${t.mode_paiement || ""}${sep}${bande?.nom || ""}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bilan_${monthLabel.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    const depByCategory = {};
    const revByCategory = {};
    const periodTx = filterMonth === "all" ? transactions : filtered;
    periodTx.filter(t => t.type === "depense").forEach(t => {
      depByCategory[t.categorie] = (depByCategory[t.categorie] || 0) + (t.montant || 0);
    });
    periodTx.filter(t => t.type === "revenu").forEach(t => {
      revByCategory[t.categorie] = (revByCategory[t.categorie] || 0) + (t.montant || 0);
    });

    const totalMorts = mortalites.filter(m => {
      if (filterMonth === "all") return true;
      return m.date && m.date.startsWith(filterMonth);
    }).reduce((s, m) => s + (m.nombre || 0), 0);

    // Mortality rate based on ALL flocks (any status), using sum of initial counts
    const totalInitialAllBandes = allBandes.reduce((s, b) => s + (b.effectif_initial || 0), 0);
    const tauxMortalite = totalInitialAllBandes > 0 ? ((totalMorts / totalInitialAllBandes) * 100).toFixed(1) : "0";

    const consoKg = consommations.filter(c => {
      if (filterMonth === "all") return true;
      return c.date && c.date.startsWith(filterMonth);
    }).reduce((s, c) => s + (c.quantite_kg || 0), 0);

    const fmtN = (n) => new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR").format(Math.round(n || 0));
    const catLabel = (cat) => t("cat." + cat) || cat;
    const especeLabel = (espece) => (espece ? (t("espece." + espece) || espece) : "");
    const statusLabel = (s) => s === "active" ? t("rapport.statusActive") : s === "terminee" ? t("rapport.statusCompleted") : t("rapport.statusPlanned");

    const tableRow = (label, val, cls = "") =>
      "<tr><td>" + label + "</td><td class=\"amount " + cls + "\">" + val + "</td></tr>";

    const catTableRows = (obj, total) =>
      Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([cat, val]) =>
        "<tr><td>" + catLabel(cat) + "</td><td class=\"amount\">" + fmtN(val) + " FCFA</td><td class=\"amount\">" + (total > 0 ? ((val / total) * 100).toFixed(1) : 0) + "%</td></tr>"
      ).join("") + "<tr class=\"total-row\"><td><strong>" + t("rapport.total") + "</strong></td><td class=\"amount\"><strong>" + fmtN(total) + " FCFA</strong></td><td class=\"amount\"><strong>100%</strong></td></tr>";

    const html = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/>" +
      "<title>" + t("rapport.sheetTitle", { period: monthLabel }) + "</title>" +
      "<style>" +
      "body{font-family:Arial,sans-serif;max-width:850px;margin:30px auto;padding:20px;color:#111;font-size:13px}" +
      "h1{color:#2d6a4f;font-size:22px;border-bottom:3px solid #2d6a4f;padding-bottom:8px;margin-bottom:4px}" +
      "h2{color:#2d6a4f;font-size:15px;margin-top:28px;margin-bottom:8px;border-left:4px solid #2d6a4f;padding-left:10px}" +
      ".subtitle{color:#666;font-size:12px;margin-bottom:24px}" +
      ".kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}" +
      ".kpi{background:#f0faf4;border:1px solid #b7e4c7;border-radius:8px;padding:14px;text-align:center}" +
      ".kpi.red{background:#fff5f5;border-color:#fed7d7}" +
      ".kpi .value{font-size:18px;font-weight:bold;color:#2d6a4f}" +
      ".kpi.red .value{color:#c53030}" +
      ".kpi .label{font-size:11px;color:#666;margin-top:3px}" +
      "table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}" +
      "th{background:#2d6a4f;color:white;padding:8px 10px;text-align:left;font-weight:bold}" +
      "td{padding:7px 10px;border-bottom:1px solid #e5e7eb}" +
      "tr:nth-child(even) td{background:#f9fafb}" +
      ".amount{text-align:right}" +
      ".total-row td{background:#f0faf4!important;font-weight:bold;border-top:2px solid #2d6a4f}" +
      ".footer{text-align:center;color:#999;font-size:11px;margin-top:40px;border-top:1px solid #eee;padding-top:16px}" +
      ".print-btn{background:#2d6a4f;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:13px;margin-bottom:20px}" +
      "@media print{.print-btn{display:none}}" +
      "</style></head><body>" +
      "<button class=\"print-btn\" onclick=\"window.print()\">" + t("rapport.print") + "</button>" +
      "<div style=\"text-align:center;margin-bottom:6px;font-size:28px\">🐔</div>" +
      "<h1>" + t("rapport.sheetTitle", { period: monthLabel }) + "</h1>" +
      "<div class=\"subtitle\">" + t("rapport.generatedSubtitle", { date: format(new Date(), "d MMMM yyyy", { locale: dateLocale }) }) + "</div>" +
      "<div class=\"kpi-grid\">" +
      "<div class=\"kpi\"><div class=\"value\">" + fmtN(totalRevenus) + " FCFA</div><div class=\"label\">" + t("rapport.revenues") + "</div></div>" +
      "<div class=\"kpi red\"><div class=\"value\">" + fmtN(totalDepenses) + " FCFA</div><div class=\"label\">" + t("rapport.expenses") + "</div></div>" +
      "<div class=\"kpi " + (marge >= 0 ? "" : "red") + "\"><div class=\"value\">" + fmtN(Math.abs(marge)) + " FCFA</div><div class=\"label\">" + t("rapport.netBalanceEmoji", { emoji: marge >= 0 ? "✅" : "⚠️" }) + "</div></div>" +
      "<div class=\"kpi\"><div class=\"value\">" + totalMorts + "</div><div class=\"label\">" + t("rapport.mortalityLabel") + "</div></div>" +
      "<div class=\"kpi\"><div class=\"value\">" + tauxMortalite + "%</div><div class=\"label\">" + t("rapport.mortalityRate") + "</div></div>" +
      "<div class=\"kpi\"><div class=\"value\">" + fmtN(consoKg) + " kg</div><div class=\"label\">" + t("rapport.consumedFeed") + "</div></div>" +
      "<div class=\"kpi\"><div class=\"value\">" + allBandes.filter(b => b.statut === "active").length + "</div><div class=\"label\">" + t("rapport.activeBandes") + "</div></div>" +
      "<div class=\"kpi\"><div class=\"value\">" + allBandes.length + "</div><div class=\"label\">" + t("rapport.totalBandes") + "</div></div>" +
      "</div>" +
      "<h2>" + t("rapport.financialSummary") + "</h2>" +
      "<table>" +
      "<tr><th>" + t("rapport.indicatorLabel") + "</th><th class=\"amount\">" + t("rapport.amountLabel") + "</th></tr>" +
      tableRow("<strong>" + t("rapport.totalRevenusLabel") + "</strong>", "<strong>" + fmtN(totalRevenus) + " FCFA</strong>", "green") +
      tableRow("<strong>" + t("rapport.totalDepensesLabel") + "</strong>", "<strong>" + fmtN(totalDepenses) + " FCFA</strong>") +
      tableRow("<strong>" + t("rapport.netBalanceLabel") + "</strong>", "<strong>" + fmtN(marge) + " FCFA</strong>", marge >= 0 ? "" : "red") +
      tableRow(t("rapport.txCountLabel"), filtered.length) +
      "</table>" +
      "<h2>" + t("rapport.expensesByCat") + "</h2>" +
      "<table>" +
      "<tr><th>" + t("rapport.categoryCol") + "</th><th class=\"amount\">" + t("rapport.amountFcfaCol") + "</th><th class=\"amount\">" + t("rapport.pctCol") + "</th></tr>" +
      catTableRows(depByCategory, totalDepenses) +
      "</table>" +
      "<h2>" + t("rapport.revenuesByCat") + "</h2>" +
      "<table>" +
      "<tr><th>" + t("rapport.categoryCol") + "</th><th class=\"amount\">" + t("rapport.amountFcfaCol") + "</th><th class=\"amount\">" + t("rapport.pctCol") + "</th></tr>" +
      catTableRows(revByCategory, totalRevenus) +
      "</table>" +
      "<h2>" + t("rapport.allBandesTable") + "</h2>" +
      "<table>" +
      "<tr><th>" + t("rapport.nameCol") + "</th><th>" + t("rapport.speciesCol") + "</th><th class=\"amount\">" + t("rapport.countCol") + "</th><th>" + t("rapport.statusCol") + "</th></tr>" +
      (allBandes.map(b =>
        "<tr><td><strong>" + b.nom + "</strong></td><td>" + especeLabel(b.espece) + "</td><td class=\"amount\">" + (b.effectif_actuel || b.effectif_initial) + "</td><td>" + statusLabel(b.statut) + "</td></tr>"
      ).join("") || "<tr><td colspan=\"4\" style=\"text-align:center;color:#999\">" + t("rapport.noFlocks") + "</td></tr>") +
      "</table>" +
      "<div class=\"footer\">" + t("rapport.footer", { date: format(new Date(), "d MMMM yyyy", { locale: dateLocale }) }) + "</div>" +
      "</body></html>";

    const win = window.open("", "_blank");
    if (!win) {
      alert(t("rapport.popupBlocked"));
      setIsGeneratingPDF(false);
      return;
    }
    win.document.write(html);
    win.document.close();
    setIsGeneratingPDF(false);
  };

  const monthLabel = periodMode === "all"
    ? t("common.allMonths")
    : periodMode === "range" && dateFrom && dateTo
      ? `${format(new Date(dateFrom + "-01"), "MMM yyyy", { locale: dateLocale })} → ${format(new Date(dateTo + "-01"), "MMM yyyy", { locale: dateLocale })}`
      : format(new Date(filterMonth + "-01"), "MMMM yyyy", { locale: dateLocale });

  const handleRefresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    queryClient.invalidateQueries({ queryKey: ["bandes"] }),
    queryClient.invalidateQueries({ queryKey: ["mortalites"] }),
    queryClient.invalidateQueries({ queryKey: ["consommations"] }),
    queryClient.invalidateQueries({ queryKey: ["stocks"] }),
  ]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      <PageHeader
        title={t("comptabilite.title")}
        description={t("comptabilite.exercice", { period: monthLabel })}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportExcel} className="gap-2">
              <Download className="w-4 h-4" /> {t("comptabilite.excel")}
            </Button>
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="w-4 h-4" /> {t("comptabilite.csv")}
            </Button>
            <Button variant="outline" onClick={generatePDF} disabled={isGeneratingPDF} className="gap-2">
              {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {t("comptabilite.pdfReport")}
            </Button>
            <Button onClick={() => { setEditingTx(null); setShowForm(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> {t("comptabilite.newTransaction")}
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold font-heading text-primary">{formatFCFA(totalRevenus)}</p>
            <div className="p-2 rounded-xl bg-primary/10"><TrendingUp className="w-5 h-5 text-primary" /></div>
          </div>
          <p className="text-sm text-muted-foreground">{t("comptabilite.revenues")}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold font-heading text-destructive">{formatFCFA(totalDepenses)}</p>
            <div className="p-2 rounded-xl bg-destructive/10"><TrendingDown className="w-5 h-5 text-destructive" /></div>
          </div>
          <p className="text-sm text-muted-foreground">{t("comptabilite.expenses")}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className={`text-3xl font-bold font-heading ${marge >= 0 ? "text-primary" : "text-destructive"}`}>
              {marge < 0 ? `−${formatFCFA(Math.abs(marge))}` : formatFCFA(marge)}
            </p>
            <div className={`p-2 rounded-xl ${marge >= 0 ? "bg-primary/10" : "bg-destructive/10"}`}>
              <Scale className={`w-5 h-5 ${marge >= 0 ? "text-primary" : "text-destructive"}`} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t("comptabilite.netBalance")}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold font-heading">{filtered.length}</p>
            <div className="p-2 rounded-xl bg-muted"><Hash className="w-5 h-5 text-muted-foreground" /></div>
          </div>
          <p className="text-sm text-muted-foreground">{t("comptabilite.txCount")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
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
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("comptabilite.filter.type")}</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("comptabilite.filter.allTypes")}</SelectItem>
              <SelectItem value="revenu">{t("comptabilite.filter.income")}</SelectItem>
              <SelectItem value="depense">{t("comptabilite.filter.expense")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("comptabilite.filter.category")}</label>
          <Select value={filterCategorie} onValueChange={setFilterCategorie}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("comptabilite.filter.allCategories")}</SelectItem>
              <SelectItem value="vente_volaille">{t("cat.vente_volaille")}</SelectItem>
              <SelectItem value="vente_oeufs">{t("cat.vente_oeufs")}</SelectItem>
              <SelectItem value="vente_fumier">{t("cat.vente_fumier")}</SelectItem>
              <SelectItem value="achat_aliment">{t("cat.achat_aliment")}</SelectItem>
              <SelectItem value="achat_poussins">{t("cat.achat_poussins")}</SelectItem>
              <SelectItem value="medicaments">{t("cat.medicaments")}</SelectItem>
              <SelectItem value="main_oeuvre">{t("cat.main_oeuvre")}</SelectItem>
              <SelectItem value="equipement">{t("cat.equipement")}</SelectItem>
              <SelectItem value="transport">{t("cat.transport")}</SelectItem>
              <SelectItem value="electricite_eau">{t("cat.electricite_eau")}</SelectItem>
              <SelectItem value="autre">{t("cat.autre")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("comptabilite.filter.band")}</label>
          <Select value={filterBande} onValueChange={setFilterBande}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("comptabilite.filter.allBands")}</SelectItem>
              {bandes.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("comptabilite.filter.search")}</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={t("comptabilite.filter.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-48"
            />
          </div>
        </div>
      </div>

      {showForm && (
        <TransactionForm
          transaction={editingTx}
          bandes={bandes}
          onSubmit={(data) => editingTx ? updateMutation.mutate({ id: editingTx.id, data }) : createMutation.mutate(data)}
          onCancel={() => { setShowForm(false); setEditingTx(null); }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Charts */}
      <ComptaCharts transactions={filtered} filterMonth={filterMonth} />

      {/* Transactions list */}
      {filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={Calculator}
          title={t("comptabilite.empty.title")}
          description={t("comptabilite.empty.desc")}
          action={
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" /> {t("comptabilite.empty.action")}
            </Button>
          }
        />
      ) : (
        <TransactionList
          transactions={filtered}
          bandes={bandes}
          onEdit={(t) => { setEditingTx(t); setShowForm(true); }}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
    </PullToRefresh>
  );
}