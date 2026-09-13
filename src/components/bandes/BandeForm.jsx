import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

const SOUCHES_PREDEFINIES = {
  poulet_chair: ["Cobb 500", "Ross 308", "Hubbard", "Arbor Acres", "Ross 708", "Autre"],
  pondeuse: ["Isa Brown", "Lohmann Brown", "Novogen Brown", "Hyline Brown", "Autre"],
  pintade: ["Pintade grise", "Pintade blanche", "Autre"],
  canard: ["Pékin", "Muscovy", "Mulard", "Autre"],
  dinde: ["BUT 9", "Nicholas 700", "Autre"],
  caille: ["Japonaise", "Coturnix", "Autre"],
};

export default function BandeForm({ bande, onSubmit, onCancel, isLoading }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    nom: bande?.nom || "",
    espece: bande?.espece || "poulet_chair",
    souche: bande?.souche || "",
    effectif_initial: bande?.effectif_initial || "",
    date_entree: bande?.date_entree || "",
    date_sortie: bande?.date_sortie || "",
    statut: bande?.statut || "active",
    poids_moyen_kg: bande?.poids_moyen_kg || "",
    notes: bande?.notes || "",
  });
  const [soucheManuelle, setSoucheManuelle] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      effectif_initial: Number(form.effectif_initial),
      poids_moyen_kg: form.poids_moyen_kg ? Number(form.poids_moyen_kg) : undefined,
      souche: form.souche || undefined,
    });
  };

  const souchesDisponibles = SOUCHES_PREDEFINIES[form.espece] || ["Autre"];

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{bande ? t("bande.form.editTitle") : t("bande.form.newTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("bande.form.name")}</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder={t("bande.form.namePlaceholder")} required />
            </div>
            <div className="space-y-2">
              <Label>{t("bande.form.species")}</Label>
              <Select value={form.espece} onValueChange={(v) => setForm({ ...form, espece: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="poulet_chair">{t("espece.poulet_chair")}</SelectItem>
                  <SelectItem value="pondeuse">{t("espece.pondeuse")}</SelectItem>
                  <SelectItem value="pintade">{t("espece.pintade")}</SelectItem>
                  <SelectItem value="canard">{t("espece.canard")}</SelectItem>
                  <SelectItem value="dinde">{t("espece.dinde")}</SelectItem>
                  <SelectItem value="caille">{t("espece.caille")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("bande.form.strain")}</Label>
              {soucheManuelle ? (
                <div className="flex gap-2">
                  <Input value={form.souche} onChange={(e) => setForm({ ...form, souche: e.target.value })} placeholder={t("bande.form.strainManualPlaceholder")} />
                  <Button type="button" variant="outline" size="sm" onClick={() => setSoucheManuelle(false)}>←</Button>
                </div>
              ) : (
                <Select value={form.souche} onValueChange={(v) => { if (v === "__manuel__") setSoucheManuelle(true); else setForm({ ...form, souche: v }); }}>
                  <SelectTrigger><SelectValue placeholder={t("bande.form.strainPlaceholder")} /></SelectTrigger>
                  <SelectContent>
                    {souchesDisponibles.filter(s => s !== "Autre").map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                    <SelectItem value="__manuel__">{t("bande.form.strainManual")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("bande.form.initialCount")}</Label>
              <Input type="number" value={form.effectif_initial} onChange={(e) => setForm({ ...form, effectif_initial: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("bande.form.status")}</Label>
              <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("bandeDetail.statusActive")}</SelectItem>
                  <SelectItem value="terminee">{t("bandeDetail.statusCompleted")}</SelectItem>
                  <SelectItem value="planifiee">{t("bandeDetail.statusPlanned")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("bandeDetail.entryDate")}</Label>
              <Input type="date" value={form.date_entree} onChange={(e) => setForm({ ...form, date_entree: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("bande.form.exitDate")}</Label>
              <Input type="date" value={form.date_sortie} onChange={(e) => setForm({ ...form, date_sortie: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("bande.form.avgWeight")}</Label>
              <Input type="number" step="0.01" value={form.poids_moyen_kg} onChange={(e) => setForm({ ...form, poids_moyen_kg: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("common.notes")}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("bande.form.notesPlaceholder")} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? t("bande.form.saving") : bande ? t("common.update") : t("common.create")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}