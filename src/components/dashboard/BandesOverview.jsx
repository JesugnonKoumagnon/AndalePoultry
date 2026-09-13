import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bird } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function BandesOverview({ bandes }) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading">{t("dashboard.activeBandsHeading")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bandes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t("common.noActiveBands")}</p>
        ) : (
          bandes.slice(0, 5).map((b) => (
            <div key={b.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Bird className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{b.nom}</p>
                  <p className="text-xs text-muted-foreground">{b.espece ? t(`espece.${b.espece}`) : ""}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {b.effectif_actuel || b.effectif_initial} {t("common.subjects")}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}