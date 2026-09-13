import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

export default function EmployeForm({ employe, onSubmit, onCancel, isLoading }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    nom: employe?.nom || "",
    poste: employe?.poste || "eleveur",
    telephone: employe?.telephone || "",
    salaire_mensuel: employe?.salaire_mensuel ?? "",
    date_embauche: employe?.date_embauche || "",
    statut: employe?.statut || "actif",
    notes: employe?.notes || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      salaire_mensuel: form.salaire_mensuel ? Number(form.salaire_mensuel) : undefined,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{employe ? t("emp.form.editTitle") : t("emp.form.newTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("emp.form.fullName")}</Label>
              <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder={t("emp.form.namePlaceholder")} required />
            </div>
            <div className="space-y-2">
              <Label>{t("emp.form.role")}</Label>
              <Select value={form.poste} onValueChange={(v) => setForm({ ...form, poste: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="promoteur">{t("emp.poste.promoteur")}</SelectItem>
                  <SelectItem value="eleveur">{t("emp.poste.eleveur")}</SelectItem>
                  <SelectItem value="bascourier">{t("emp.poste.bascourier")}</SelectItem>
                  <SelectItem value="veterinaire">{t("emp.poste.veterinaire")}</SelectItem>
                  <SelectItem value="technicien">{t("emp.poste.technicien")}</SelectItem>
                  <SelectItem value="comptable">{t("emp.poste.comptable")}</SelectItem>
                  <SelectItem value="chauffeur">{t("emp.poste.chauffeur")}</SelectItem>
                  <SelectItem value="gardien">{t("emp.poste.gardien")}</SelectItem>
                  <SelectItem value="autre">{t("emp.poste.autre")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("emp.form.phone")}</Label>
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder={t("emp.form.phonePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("emp.form.salary")}</Label>
              <Input type="number" value={form.salaire_mensuel} onChange={(e) => setForm({ ...form, salaire_mensuel: e.target.value })} placeholder={t("emp.form.salaryPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("emp.form.hireDate")}</Label>
              <Input type="date" value={form.date_embauche} onChange={(e) => setForm({ ...form, date_embauche: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("emp.form.status")}</Label>
              <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">{t("emp.statut.actif")}</SelectItem>
                  <SelectItem value="inactif">{t("emp.statut.inactif")}</SelectItem>
                  <SelectItem value="conge">{t("emp.statut.conge")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("emp.form.notes")}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("emp.form.notesPlaceholder")} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("common.saving") : employe ? t("common.update") : t("common.add")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}