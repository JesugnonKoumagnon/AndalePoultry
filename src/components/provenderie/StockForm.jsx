import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

export default function StockForm({ stock, onSubmit, onCancel, isLoading }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    nom: stock?.nom || "",
    type_aliment: stock?.type_aliment || "demarrage",
    quantite_kg: stock?.quantite_kg ?? "",
    seuil_alerte_kg: stock?.seuil_alerte_kg ?? "",
    prix_par_kg: stock?.prix_par_kg ?? "",
    fournisseur: stock?.fournisseur || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      quantite_kg: Number(form.quantite_kg),
      seuil_alerte_kg: form.seuil_alerte_kg ? Number(form.seuil_alerte_kg) : undefined,
      prix_par_kg: form.prix_par_kg ? Number(form.prix_par_kg) : undefined,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{stock ? t("feed.form.editTitle") : t("feed.form.newTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("feed.form.name")}</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder={t("feed.form.namePlaceholder")} required />
            </div>
            <div className="space-y-2">
              <Label>{t("feed.form.type")}</Label>
              <Select value={form.type_aliment} onValueChange={(v) => setForm({ ...form, type_aliment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="demarrage">{t("feed.type.demarrage")}</SelectItem>
                  <SelectItem value="croissance">{t("feed.type.croissance")}</SelectItem>
                  <SelectItem value="finition">{t("feed.type.finition")}</SelectItem>
                  <SelectItem value="pondeuse">{t("feed.type.pondeuse")}</SelectItem>
                  <SelectItem value="premix">{t("feed.type.premix")}</SelectItem>
                  <SelectItem value="autre">{t("feed.type.autre")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("feed.form.quantity")}</Label>
              <Input type="number" value={form.quantite_kg} onChange={(e) => setForm({ ...form, quantite_kg: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("feed.form.alertThreshold")}</Label>
              <Input type="number" value={form.seuil_alerte_kg} onChange={(e) => setForm({ ...form, seuil_alerte_kg: e.target.value })} placeholder={t("feed.form.optional")} />
            </div>
            <div className="space-y-2">
              <Label>{t("feed.form.pricePerKg")}</Label>
              <Input type="number" value={form.prix_par_kg} onChange={(e) => setForm({ ...form, prix_par_kg: e.target.value })} placeholder={t("feed.form.optional")} />
            </div>
            <div className="space-y-2">
              <Label>{t("feed.form.supplier")}</Label>
              <Input value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} placeholder={t("feed.form.optional")} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? t("common.saving") : stock ? t("common.update") : t("common.add")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}