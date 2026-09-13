import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Skull, Wheat } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLanguage } from "@/lib/LanguageContext";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

const especeLabels = {
  poulet_chair: "Poulet 🐔",
  pondeuse: "Pondeuse 🥚",
  pintade: "Pintade",
  canard: "Canard",
  dinde: "Dinde",
  caille: "Caille",
};

const statutConfig = {
  active: { labelKey: "bande.card.statusActive", className: "bg-primary/10 text-primary border-primary/20" },
  terminee: { labelKey: "bande.card.statusSold", className: "bg-blue-50 text-blue-600 border-blue-200" },
  planifiee: { labelKey: "bande.card.statusPlanned", className: "bg-secondary/10 text-secondary border-secondary/30" },
  perdue: { labelKey: "bande.card.statusLost", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function BandeCard({ bande, mortalite, coutProvende, onEdit, onDelete, onAddMortalite }) {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "en" ? enUS : fr;
  const formatFCFA = (n) => {
    if (!n && n !== 0) return "0 FCFA";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M FCFA`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k FCFA`;
    return `${new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR").format(n)} FCFA`;
  };
  const effectif = bande.effectif_actuel ?? bande.effectif_initial;
  const joursElevage = bande.date_entree
    ? differenceInDays(new Date(), parseISO(bande.date_entree))
    : 0;
  const progressPercent = bande.effectif_initial > 0
    ? Math.round((effectif / bande.effectif_initial) * 100)
    : 0;

  const progressColor = progressPercent > 60
    ? "bg-primary"
    : progressPercent > 30
    ? "bg-secondary"
    : "bg-destructive";

  const statut = statutConfig[bande.statut] || statutConfig.active;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link to={`/bandes/${bande.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-heading font-bold text-base">{bande.nom}</h3>
              <p className="text-xs text-muted-foreground">{bande.espece ? t(`espece.${bande.espece}`) : bande.espece}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${statut.className}`}>
                {t(statut.labelKey)}
              </Badge>
              <div onClick={(e) => e.preventDefault()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(); }}>
                    <Pencil className="w-4 h-4 mr-2" /> {t("common.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); onAddMortalite(); }}>
                    <Skull className="w-4 h-4 mr-2" /> {t("bande.card.mortality")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); onDelete(); }} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" /> {t("common.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="font-semibold text-foreground">{effectif} {t("common.heads")}</span>
            <span className="flex items-center gap-1">
              <span className="text-destructive">↘</span> {t("bande.card.deaths", { n: mortalite })}
            </span>
            <span className="flex items-center gap-1">
              🗓 {t("bande.card.days", { n: joursElevage })}
            </span>
          </div>

          {/* Progress */}
          <div className="space-y-1 mb-3">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${progressColor}`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {effectif} / {bande.effectif_initial} {t("common.heads")}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            {bande.date_entree && (
              <span>{t("bande.card.enteredOn", { date: format(parseISO(bande.date_entree), "d MMM yyyy", { locale: dateLocale }) })}</span>
            )}
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Wheat className="w-3 h-3" /> {formatFCFA(coutProvende || 0)}
            </span>
          </div>
        </CardContent>
      </Card>
      </Link>
    </motion.div>
  );
}