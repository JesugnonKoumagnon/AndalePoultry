import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Syringe, AlertTriangle, ShieldCheck, Calendar, Archive, ArchiveRestore } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format, parseISO, isPast, isWithinInterval, addDays } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

const typeColors = {
  vaccin: "bg-primary/10 text-primary",
  antibiotique: "bg-chart-3/10 text-chart-3",
  antiparasitaire: "bg-chart-4/10 text-chart-4",
  vitamines: "bg-secondary/20 text-secondary-foreground",
  desinfectant: "bg-chart-5/10 text-chart-5",
  autre: "bg-muted text-muted-foreground",
};

export default function MedicamentCard({ medicament, onEdit, onDelete, onTraitement, onArchive }) {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "en" ? enUS : fr;
  const isLowStock = medicament.seuil_alerte && medicament.quantite != null && medicament.quantite <= medicament.seuil_alerte;
  const progressPercent = medicament.seuil_alerte
    ? Math.min(100, ((medicament.quantite || 0) / (medicament.seuil_alerte * 3)) * 100)
    : 60;

  const isExpired = medicament.date_expiration && isPast(parseISO(medicament.date_expiration));
  const expiresSoon = medicament.date_expiration && !isExpired &&
    isWithinInterval(parseISO(medicament.date_expiration), { start: new Date(), end: addDays(new Date(), 30) });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`hover:shadow-md transition-shadow ${isLowStock || isExpired ? "border-destructive/30" : ""}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isLowStock || isExpired ? "bg-destructive/10" : "bg-primary/10"}`}>
                {isLowStock || isExpired
                  ? <AlertTriangle className="w-5 h-5 text-destructive" />
                  : <Syringe className="w-5 h-5 text-primary" />
                }
              </div>
              <div>
                <h3 className="font-heading font-semibold">{medicament.nom}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge className={`text-xs ${typeColors[medicament.type] || typeColors.autre}`}>
                    {t(`med.type.${medicament.type}`)}
                  </Badge>
                  {medicament.archived && <Badge variant="outline" className="text-xs">{t("med.archived")}</Badge>}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onTraitement}>
                  <Syringe className="w-4 h-4 mr-2" /> {t("med.registerTreatment")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" /> {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onArchive}>
                  {medicament.archived
                    ? <><ArchiveRestore className="w-4 h-4 mr-2" /> {t("med.unarchive")}</>
                    : <><Archive className="w-4 h-4 mr-2" /> {t("med.archive")}</>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3 mt-3">
            {medicament.quantite != null && (
              <>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">{medicament.quantite}</span>
                  <span className="text-sm text-muted-foreground">{medicament.unite ? t(`med.units.${medicament.unite}`) : t("med.units.doses")}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                {isLowStock && <Badge variant="destructive" className="text-xs">{t("med.stockLow")}</Badge>}
              </>
            )}

            {medicament.date_expiration && (
              <div className={`flex items-center gap-1.5 text-xs ${isExpired ? "text-destructive" : expiresSoon ? "text-secondary-foreground" : "text-muted-foreground"}`}>
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {isExpired ? t("med.expiredOn") : t("med.expiresOn")} {format(parseISO(medicament.date_expiration), "d MMM yyyy", { locale: dateLocale })}
                </span>
                {isExpired && <Badge variant="destructive" className="text-xs ml-1">{t("med.expired")}</Badge>}
                {expiresSoon && !isExpired && <Badge className="text-xs ml-1 bg-secondary/20 text-secondary-foreground">{t("med.soonBadge")}</Badge>}
              </div>
            )}

            {medicament.prix_unitaire && (
              <p className="text-xs text-muted-foreground">
                {new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR").format(medicament.prix_unitaire)} FCFA / {medicament.unite ? t(`med.units.${medicament.unite}`) : t("med.units.doses")}
              </p>
            )}
            {medicament.fournisseur && (
              <p className="text-xs text-muted-foreground">{t("med.supplierLabel", { name: medicament.fournisseur })}</p>
            )}
            {medicament.date_achat && (
              <p className="text-xs text-muted-foreground">
                {t("med.boughtOn")} {format(parseISO(medicament.date_achat), "d MMM yyyy", { locale: dateLocale })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}