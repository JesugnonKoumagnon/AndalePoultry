import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function StockAlerts({ stocks }) {
  const { t } = useLanguage();
  const lowStock = stocks.filter((s) => s.seuil_alerte_kg && s.quantite_kg <= s.seuil_alerte_kg);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading">{t("dashboard.stockAlerts")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stocks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t("common.noFeedRecorded")}</p>
        ) : (
          <>
            {lowStock.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-destructive/5 border border-destructive/15">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.nom}</p>
                  <p className="text-xs text-destructive">{t("dashboard.kgRemaining", { actual: s.quantite_kg, threshold: s.seuil_alerte_kg })}</p>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-primary/5 border border-primary/15">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm text-primary font-medium">{t("dashboard.allStocksOk")}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}