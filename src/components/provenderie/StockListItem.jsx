import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, AlertTriangle, Archive, ArchiveRestore } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLanguage } from "@/lib/LanguageContext";

export default function StockListItem({ stock, onEdit, onDelete, onConsommation, onReappro, onArchive }) {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "en" ? enUS : fr;
  const numFmt = lang === "en" ? "en-US" : "fr-FR";
  const isLow = stock.seuil_alerte_kg && stock.quantite_kg <= stock.seuil_alerte_kg;
  const maxRef = stock.capacite_max_kg || (stock.seuil_alerte_kg ? stock.seuil_alerte_kg * 3 : stock.quantite_kg) || 1;
  const progressPercent = Math.min(100, (stock.quantite_kg / maxRef) * 100);

  const formatDate = (d) => {
    try { return format(parseISO(d), "dd/MM/yyyy", { locale: dateLocale }); }
    catch { return d; }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`hover:shadow-md transition-shadow ${isLow ? "border-destructive/30" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Top row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {isLow && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                  <h3 className="font-heading font-semibold text-sm">{stock.nom}</h3>
                </div>
                {stock.prix_par_kg && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Intl.NumberFormat(numFmt).format(stock.prix_par_kg)} FCFA/kg
                  </span>
                )}
              </div>

              {/* Subtitle */}
              <p className="text-xs text-muted-foreground mb-2">
                {stock.quantite_kg} kg
                {stock.seuil_alerte_kg ? ` ${t("stock.initialKg", { n: stock.seuil_alerte_kg })}` : ""}
                {stock.prix_par_kg
                  ? ` → ${new Intl.NumberFormat(numFmt).format(Math.round((stock.quantite_kg || 0) * (stock.prix_par_kg || 0)))} FCFA`
                  : ""}
              </p>

              {/* Progress */}
              <div className="w-full bg-muted rounded-full h-2 mb-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${isLow ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {stock.updated_date
                    ? t("stock.lastUpdate", { date: formatDate(stock.updated_date) })
                    : stock.fournisseur
                    ? stock.fournisseur
                    : ""}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onReappro}>
                    {t("stock.reappro")}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onConsommation}>
                    {t("stock.consumption")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" /> {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onArchive}>
                  {stock.archived
                    ? <><ArchiveRestore className="w-4 h-4 mr-2" /> {t("med.unarchive")}</>
                    : <><Archive className="w-4 h-4 mr-2" /> {t("med.archive")}</>
                  }
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> {t("common.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}