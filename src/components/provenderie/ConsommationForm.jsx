import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

export default function ConsommationForm({ stock, stocks = [], bandes, onSubmit, onCancel, isLoading }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    aliment_id: stock?.id || "",
    bande_id: "",
    date: new Date().toISOString().split("T")[0],
    quantite_kg: "",
    notes: "",
  });

  const selectedStock = stock || stocks.find((s) => s.id === form.aliment_id);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, quantite_kg: Number(form.quantite_kg) });
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-secondary/30">
        <CardHeader>
          <CardTitle className="font-heading">
            {stock ? t("conso.form.title.stock", { stock: stock.nom }) : t("conso.form.title.default")}
          </CardTitle>
          {stock && <p className="text-sm text-muted-foreground">{t("conso.form.currentStock", { n: stock.quantite_kg })}</p>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!stock && (
              <div className="space-y-2 md:col-span-2">
                <Label>{t("conso.form.feed")}</Label>
                <Select value={form.aliment_id} onValueChange={(v) => setForm({ ...form, aliment_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t("conso.form.feedPlaceholder")} /></SelectTrigger>
                  <SelectContent>
                    {stocks.filter(s => !s.archived).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nom} ({s.quantite_kg} kg)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("conso.form.bande")}</Label>
              <Select value={form.bande_id} onValueChange={(v) => setForm({ ...form, bande_id: v })}>
                <SelectTrigger><SelectValue placeholder={t("conso.form.bandePlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {bandes.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("conso.form.qty")}</Label>
              <Input type="number" max={selectedStock?.quantite_kg} value={form.quantite_kg} onChange={(e) => setForm({ ...form, quantite_kg: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("conso.form.date")}</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t("conso.form.notes")}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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