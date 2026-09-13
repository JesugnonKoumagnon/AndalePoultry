import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Phone, MapPin, FileText, MoreVertical, Pencil, Trash2, Truck } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { motion } from "framer-motion";
import useBackClose from "@/hooks/useBackClose";
import { useLanguage } from "@/lib/LanguageContext";

const DEFAULT_FORM = { nom: "", telephone: "", adresse: "", notes: "" };

export default function Fournisseurs() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const { t } = useLanguage();

  const { data: fournisseurs = [] } = useQuery({
    queryKey: ["fournisseurs"],
    queryFn: () => base44.entities.Fournisseur.list("-created_date"),
  });

  const create = useMutation({
    mutationFn: (d) => base44.entities.Fournisseur.create(d),
    onSuccess: () => { qc.invalidateQueries(["fournisseurs"]); closeForm(); },
  });
  const update = useMutation({
    mutationFn: ({ id, d }) => base44.entities.Fournisseur.update(id, d),
    onSuccess: () => { qc.invalidateQueries(["fournisseurs"]); closeForm(); },
  });
  const del = useMutation({
    mutationFn: (id) => base44.entities.Fournisseur.delete(id),
    onSuccess: () => qc.invalidateQueries(["fournisseurs"]),
  });

  const openNew = () => { setEditing(null); setForm(DEFAULT_FORM); setOpen(true); };
  const openEdit = (f) => { setEditing(f); setForm({ nom: f.nom, telephone: f.telephone || "", adresse: f.adresse || "", notes: f.notes || "" }); setOpen(true); };
  const closeForm = () => { setOpen(false); setEditing(null); };

  useBackClose(open, closeForm);

  const handleSubmit = (e) => {
    e.preventDefault();
    editing ? update.mutate({ id: editing.id, d: form }) : create.mutate(form);
  };

  const filtered = fournisseurs.filter((f) => !search || f.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("fournisseurs.title")}
        description={fournisseurs.length === 1 ? t("fournisseurs.descOne", { n: fournisseurs.length }) : t("fournisseurs.descMany", { n: fournisseurs.length })}
        actions={
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> {t("fournisseurs.newSupplier")}</Button>
        }
      />
      <Input placeholder={t("fournisseurs.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />

      {filtered.length === 0 ? (
        <EmptyState icon={Truck} title={t("fournisseurs.empty.title")} description={t("fournisseurs.empty.desc")}
          action={<Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> {t("fournisseurs.empty.action")}</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((f) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(f)}><Pencil className="w-4 h-4 mr-2" /> {t("fournisseurs.menu.edit")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => del.mutate(f.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> {t("fournisseurs.menu.delete")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-heading font-semibold mb-2">{f.nom}</h3>
                  {f.telephone && <p className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Phone className="w-3.5 h-3.5" />{f.telephone}</p>}
                  {f.adresse && <p className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><MapPin className="w-3.5 h-3.5" />{f.adresse}</p>}
                  {f.notes && <p className="flex items-start gap-2 text-sm text-muted-foreground mt-2"><FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />{f.notes}</p>}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? t("fournisseurs.form.editTitle") : t("fournisseurs.form.newTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2"><Label>{t("common.nameRequired")}</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></div>
            <div className="space-y-2"><Label>{t("common.phone")}</Label><Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("common.address")}</Label><Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("common.notes")}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeForm}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>{editing ? t("common.update") : t("common.create")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}