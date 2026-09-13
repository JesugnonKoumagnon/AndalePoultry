import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

export default function MedicamentForm({ medicament, onSubmit, onCancel, isLoading }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    nom: medicament?.nom || "",
    type: medicament?.type || "vaccin",
    quantite: medicament?.quantite ?? "",
    unite: medicament?.unite || "doses",
    seuil_alerte: medicament?.seuil_alerte ?? "",
    prix_unitaire: medicament?.prix_unitaire ?? "",
    date_achat: medicament?.date_achat || new Date().toISOString().split("T")[0],
    date_expiration: medicament?.date_expiration || "",
    fournisseur: medicament?.fournisseur || "",
    notes: medicament?.notes || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      quantite: form.quantite !== "" ? Number(form.quantite) : undefined,
      seuil_alerte: form.seuil_alerte !== "" ? Number(form.seuil_alerte) : undefined,
      prix_unitaire: form.prix_unitaire !== "" ? Number(form.prix_unitaire) : undefined,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{medicament ? t("med.form.editTitle") : t("med.form.newTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("med.form.name")}</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder={t("med.form.namePlaceholder")} required />
            </div>
            <div className="space-y-2">
              <Label>{t("med.form.type")}</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vaccin">{t("med.type.vaccin")}</SelectItem>
                  <SelectItem value="antibiotique">{t("med.type.antibiotique")}</SelectItem>
                  <SelectItem value="antiparasitaire">{t("med.type.antiparasitaire")}</SelectItem>
                  <SelectItem value="vitamines">{t("med.type.vitamines")}</SelectItem>
                  <SelectItem value="desinfectant">{t("med.type.desinfectant")}</SelectItem>
                  <SelectItem value="autre">{t("med.type.autre")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("med.form.stockQuantity")}</Label>
              <Input type="number" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>{t("med.form.unit")}</Label>
              <Select value={form.unite} onValueChange={(v) => setForm({ ...form, unite: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="doses">{t("med.units.doses")}</SelectItem>
                  <SelectItem value="ml">{t("med.units.ml")}</SelectItem>
                  <SelectItem value="g">{t("med.units.g")}</SelectItem>
                  <SelectItem value="kg">{t("med.units.kg")}</SelectItem>
                  <SelectItem value="flacons">{t("med.units.flacons")}</SelectItem>
                  <SelectItem value="sachets">{t("med.units.sachets")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("med.form.alertThreshold")}</Label>
              <Input type="number" value={form.seuil_alerte} onChange={(e) => setForm({ ...form, seuil_alerte: e.target.value })} placeholder={t("med.form.optional")} />
            </div>
            <div className="space-y-2">
              <Label>{t("med.form.unitPrice")}</Label>
              <Input type="number" value={form.prix_unitaire} onChange={(e) => setForm({ ...form, prix_unitaire: e.target.value })} placeholder={t("med.form.optional")} />
            </div>
            <div className="space-y-2">
              <Label>{t("med.form.purchaseDate")}</Label>
              <Input type="date" value={form.date_achat} onChange={(e) => setForm({ ...form, date_achat: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("med.form.expirationDate")}</Label>
              <Input type="date" value={form.date_expiration} onChange={(e) => setForm({ ...form, date_expiration: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("med.form.supplier")}</Label>
              <Input value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} placeholder={t("med.form.optional")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("common.notes")}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? t("med.form.saving") : medicament ? t("common.update") : t("med.form.add")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}