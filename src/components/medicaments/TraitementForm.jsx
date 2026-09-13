import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

export default function TraitementForm({ bande, bandes = [], medicaments, traitement, onSubmit, onCancel, isLoading }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    bande_id: traitement?.bande_id || bande?.id || "",
    medicament_id: traitement?.medicament_id || bande?.medicament_id || "",
    date: traitement?.date || new Date().toISOString().split("T")[0],
    quantite_utilisee: traitement?.quantite_utilisee ?? "",
    motif: traitement?.motif || "vaccination",
    prochain_rappel: traitement?.prochain_rappel || "",
    notes: traitement?.notes || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      quantite_utilisee: form.quantite_utilisee ? Number(form.quantite_utilisee) : undefined,
      bande_id: form.bande_id || undefined,
      medicament_id: form.medicament_id || undefined,
      prochain_rappel: form.prochain_rappel || undefined,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="font-heading">{t("trait.form.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bandes.length > 0 && !bande?.id && (
              <div className="space-y-2 md:col-span-2">
                <Label>{t("trait.form.bande")}</Label>
                <Select value={form.bande_id} onValueChange={(v) => setForm({ ...form, bande_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t("trait.form.bandePlaceholder")} /></SelectTrigger>
                  <SelectContent>
                    {bandes.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("trait.form.motif")}</Label>
              <Select value={form.motif} onValueChange={(v) => setForm({ ...form, motif: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vaccination">{t("trait.motif.vaccination")}</SelectItem>
                  <SelectItem value="traitement_maladie">{t("trait.motif.traitement_maladie")}</SelectItem>
                  <SelectItem value="prevention">{t("trait.motif.prevention")}</SelectItem>
                  <SelectItem value="deworming">{t("trait.motif.deworming")}</SelectItem>
                  <SelectItem value="autre">{t("trait.motif.autre")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("trait.form.med")}</Label>
              <Select value={form.medicament_id} onValueChange={(v) => setForm({ ...form, medicament_id: v })}>
                <SelectTrigger><SelectValue placeholder={t("trait.form.medPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>{t("trait.form.none")}</SelectItem>
                  {medicaments.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("trait.form.date")}</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("trait.form.qty")}</Label>
              <Input type="number" step="0.01" value={form.quantite_utilisee} onChange={(e) => setForm({ ...form, quantite_utilisee: e.target.value })} placeholder={t("trait.form.qtyPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("trait.form.reminder")}</Label>
              <Input type="date" value={form.prochain_rappel} onChange={(e) => setForm({ ...form, prochain_rappel: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("trait.form.notes")}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("trait.form.notesPlaceholder")} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? t("common.saving") : t("common.save")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}