import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

export default function TransactionForm({ transaction, bandes, onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState({
    type: transaction?.type || "depense",
    categorie: transaction?.categorie || "achat_aliment",
    montant: transaction?.montant ?? "",
    date: transaction?.date || new Date().toISOString().split("T")[0],
    bande_id: transaction?.bande_id || "",
    description: transaction?.description || "",
    mode_paiement: transaction?.mode_paiement || "especes",
    employe_nom: transaction?.employe_nom || "",
    client_nom: transaction?.client_nom || "",
  });

  const { data: employes = [] } = useQuery({
    queryKey: ["employes"],
    queryFn: () => base44.entities.Employe.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, montant: Number(form.montant), bande_id: form.bande_id || undefined };
    // Clean up fields not relevant to this transaction
    if (form.type !== "depense" || form.categorie !== "main_oeuvre") delete payload.employe_nom;
    if (form.type !== "revenu") delete payload.client_nom;
    onSubmit(payload);
  };

  const handleTypeChange = (v) => {
    setForm({ ...form, type: v, categorie: v === "revenu" ? "vente_volaille" : "achat_aliment", employe_nom: "", client_nom: "" });
  };

  const categories = form.type === "revenu"
    ? [
        { value: "vente_volaille", label: "Vente volaille" },
        { value: "vente_oeufs", label: "Vente œufs" },
        { value: "vente_fumier", label: "Vente fumier" },
        { value: "autre", label: "Autre" },
      ]
    : [
        { value: "achat_aliment", label: "Achat aliment" },
        { value: "achat_poussins", label: "Achat poussins" },
        { value: "medicaments", label: "Médicaments" },
        { value: "main_oeuvre", label: "Main d'œuvre" },
        { value: "equipement", label: "Équipement" },
        { value: "transport", label: "Transport" },
        { value: "electricite_eau", label: "Élec./Eau" },
        { value: "autre", label: "Autre" },
      ];

  const showEmployeField = form.type === "depense" && form.categorie === "main_oeuvre";
  const showClientField = form.type === "revenu";

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{transaction ? "Modifier la transaction" : "Nouvelle transaction"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={handleTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenu">Revenu</SelectItem>
                  <SelectItem value="depense">Dépense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v, employe_nom: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employé — affiché uniquement pour dépense > main d'œuvre */}
            {showEmployeField && (
              <div className="space-y-2 md:col-span-2">
                <Label>Employé concerné</Label>
                <Select value={form.employe_nom} onValueChange={(v) => setForm({ ...form, employe_nom: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un employé..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>— Aucun —</SelectItem>
                    {employes.filter(e => e.statut === "actif" || !e.statut).map((e) => (
                      <SelectItem key={e.id} value={e.nom}>
                        {e.nom} {e.poste ? `· ${e.poste}` : ""}
                      </SelectItem>
                    ))}
                    {employes.length === 0 && (
                      <SelectItem value={null} disabled>Aucun employé enregistré</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Client — affiché uniquement pour les revenus */}
            {showClientField && (
              <div className="space-y-2 md:col-span-2">
                <Label>Client</Label>
                <Select value={form.client_nom} onValueChange={(v) => setForm({ ...form, client_nom: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un client..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>— Aucun / Anonyme —</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.nom}>
                        {c.nom} {c.telephone ? `· ${c.telephone}` : ""}
                      </SelectItem>
                    ))}
                    {clients.length === 0 && (
                      <SelectItem value={null} disabled>Aucun client enregistré</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Montant (FCFA)</Label>
              <Input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Bande associée</Label>
              <Select value={form.bande_id} onValueChange={(v) => setForm({ ...form, bande_id: v })}>
                <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Aucune</SelectItem>
                  {bandes.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select value={form.mode_paiement} onValueChange={(v) => setForm({ ...form, mode_paiement: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description de la transaction..." />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Enregistrement..." : transaction ? "Mettre à jour" : "Enregistrer"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}