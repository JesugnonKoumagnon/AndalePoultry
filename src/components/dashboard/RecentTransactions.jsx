import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";

export default function RecentTransactions({ transactions }) {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "en" ? enUS : fr;
  const recent = transactions.slice(0, 8);

  const formatFCFA = (n) => {
    const abs = Math.abs(n);
    const locale = lang === "en" ? "en-US" : "fr-FR";
    if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(2)}M FCFA`;
    if (abs >= 1_000) return `${(abs / 1_000).toFixed(2).replace(/\.?0+$/, "")}K FCFA`;
    return `${new Intl.NumberFormat(locale).format(abs)} FCFA`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-heading">{t("dashboard.recentTx")}</CardTitle>
          <Link to="/comptabilite">
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary hover:text-primary">
              {t("common.viewAll")} <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("common.noTransaction")}</p>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${tx.type === "revenu" ? "bg-primary/10" : "bg-red-50"}`}>
                    {tx.type === "revenu"
                      ? <ArrowUpRight className="w-4 h-4 text-primary" />
                      : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.description || t(`cat.${tx.categorie}`)}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.date && format(parseISO(tx.date), "d MMM yyyy", { locale: dateLocale })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.type === "revenu" ? "text-primary" : "text-red-500"}`}>
                  {tx.type === "revenu" ? "+" : "−"}{formatFCFA(tx.montant)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}