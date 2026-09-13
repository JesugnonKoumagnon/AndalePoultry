import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

export default function ReapproForm({ stock, onSubmit, onCancel, isLoading }) {
  const { t, lang } = useLanguage();
  const [quantite, setQuantite] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [fournisseur, setFournisseur] = useState(stock?.fournisseur || "");
  const [prixParKg, setPrixParKg] = useState(stock?.prix_par_kg ?? "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ quantite: Number(quantite), date, fournisseur, prixParKg: prixParKg !== "" ? Number(prixParKg) : undefined });
  };

  const montantEstime = quantite && prixParKg
    ? new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR").format(Number(quantite) * Number(prixParKg)) + " FCFA"
    : null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="font-heading">{t("reappro.title", { name: stock.nom })}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("reappro.currentStock", { n: stock.quantite_kg })}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("reappro.date")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t("reappro.quantity")}</Label>
              <Input type="number" min="0.1" step="0.1" value={quantite} onChange={(e) => setQuantite(e.target.value)} required placeholder={t("reappro.quantityPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("reappro.pricePerKg")}</Label>
              <Input type="number" min="0" step="1" value={prixParKg} onChange={(e) => setPrixParKg(e.target.value)} placeholder={stock?.prix_par_kg || t("reappro.pricePlaceholder")} />
              <p className="text-xs text-muted-foreground">{t("reappro.priceHint")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("reappro.supplier")}</Label>
              <Input value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} placeholder={t("reappro.supplierPlaceholder")} />
            </div>
            {montantEstime && (
              <div className="md:col-span-2 rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("reappro.estimatedCost")}</span>
                <span className="text-base font-bold text-primary">{montantEstime}</span>
              </div>
            )}
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? t("common.saving") : t("reappro.submit")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}