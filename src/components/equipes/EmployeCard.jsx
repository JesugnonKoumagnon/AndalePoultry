import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Phone, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

const statutConfig = {
  actif: { class: "bg-primary/10 text-primary border-primary/20", key: "emp.statut.actif" },
  inactif: { class: "bg-muted text-muted-foreground border-border", key: "emp.statut.inactif" },
  conge: { class: "bg-secondary/15 text-secondary-foreground border-secondary/30", key: "emp.statut.conge" },
};

const avatarColors = [
  "bg-primary/20 text-primary",
  "bg-secondary/30 text-secondary-foreground",
  "bg-chart-3/20 text-chart-3",
  "bg-chart-4/20 text-chart-4",
  "bg-chart-5/20 text-chart-5",
];

export default function EmployeCard({ employe, onEdit, onDelete }) {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "en" ? enUS : fr;
  const config = statutConfig[employe.statut] || statutConfig.actif;
  const initials = (employe.nom || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const colorIdx = (employe.nom || "A").charCodeAt(0) % avatarColors.length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-heading font-bold text-sm ${avatarColors[colorIdx]}`}>
                {initials}
              </div>
              <div>
                <h3 className="font-heading font-semibold">{employe.nom}</h3>
                <p className="text-xs text-muted-foreground">{t(`emp.poste.${employe.poste}`) || employe.poste}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${config.class}`}>{t(config.key)}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="w-4 h-4 mr-2" /> {t("boutique.menuEdit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" /> {t("boutique.menuDelete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2">
            {employe.salaire_mensuel && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground">{t("emp.card.salaryMonth")}</span>
                <span className="text-sm font-semibold">{new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR").format(employe.salaire_mensuel)} FCFA</span>
              </div>
            )}
            {employe.telephone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                <span>{employe.telephone}</span>
              </div>
            )}
            {employe.date_embauche && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{t("emp.card.hiredOn", { date: format(parseISO(employe.date_embauche), "d MMMM yyyy", { locale: dateLocale }) })}</span>
              </div>
            )}
            {employe.notes && (
              <p className="text-xs text-muted-foreground mt-1 border-t border-border pt-2">{employe.notes}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}