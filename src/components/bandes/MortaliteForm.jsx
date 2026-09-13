import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

export default function MortaliteForm({ bande, mortalite, onSubmit, onCancel, isLoading }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    bande_id: bande.id,
    date: mortalite?.date || new Date().toISOString().split("T")[0],
    nombre: mortalite?.nombre ?? "",
    cause: mortalite?.cause || "inconnue",
    notes: mortalite?.notes || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, nombre: Number(form.nombre) });
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="font-heading text-destructive">
            {mortalite ? t("mort.form.editTitle", { name: bande.nom }) : t("mort.form.newTitle", { name: bande.nom })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("mort.form.date")}</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("mort.form.count")}</Label>
              <Input type="number" min="1" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("mort.form.cause")}</Label>
              <Select value={form.cause} onValueChange={(v) => setForm({ ...form, cause: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="maladie">{t("mort.cause.maladie")}</SelectItem>
                  <SelectItem value="chaleur">{t("mort.cause.chaleur")}</SelectItem>
                  <SelectItem value="predateur">{t("mort.cause.predateur")}</SelectItem>
                  <SelectItem value="accident">{t("mort.cause.accident")}</SelectItem>
                  <SelectItem value="inconnue">{t("mort.cause.inconnue")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("mort.form.notes")}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>{t("common.cancel")}</Button>
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading ? t("common.saving") : mortalite ? t("common.update") : t("mort.form.actionNew")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}