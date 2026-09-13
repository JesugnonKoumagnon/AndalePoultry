import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Syringe } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import MedicamentCard from "@/components/medicaments/MedicamentCard";
import MedicamentForm from "@/components/medicaments/MedicamentForm";
import TraitementForm from "@/components/medicaments/TraitementForm";
import TraitementList from "@/components/medicaments/TraitementList";
import StatCard from "@/components/shared/StatCard";
import { AlertTriangle, CalendarClock, ShieldCheck } from "lucide-react";
import CalendrierVaccins from "@/components/medicaments/CalendrierVaccins";
import useBackClose from "@/hooks/useBackClose";
import { useLanguage } from "@/lib/LanguageContext";

export default function Medicaments() {
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [showTraitementForm, setShowTraitementForm] = useState(null);
  const [activeTab, setActiveTab] = useState("stock");
  const queryClient = useQueryClient();

  useBackClose(showForm, () => { setShowForm(false); setEditingMed(null); });
  useBackClose(!!showTraitementForm, () => setShowTraitementForm(null));
  const { t, lang } = useLanguage();

  useEffect(() => {
    const u1 = base44.entities.TraitementSanitaire.subscribe(() => queryClient.invalidateQueries({ queryKey: ["traitements"] }));
    const u2 = base44.entities.Medicament.subscribe(() => queryClient.invalidateQueries({ queryKey: ["medicaments"] }));
    return () => { u1(); u2(); };
  }, [queryClient]);
  

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  const { data: medicaments = [], isLoading } = useQuery({
    queryKey: ["medicaments", user?.id],
    queryFn: () => user?.id ? base44.entities.Medicament.filter({ created_by_id: user.id }, "-created_date") : [],
    enabled: !!user?.id,
  });

  const { data: traitements = [] } = useQuery({
    queryKey: ["traitements", user?.id],
    queryFn: () => user?.id ? base44.entities.TraitementSanitaire.filter({ created_by_id: user.id }, "-date") : [],
    enabled: !!user?.id,
  });

  const { data: bandes = [] } = useQuery({
    queryKey: ["bandes", user?.id],
    queryFn: () => user?.id ? base44.entities.Bande.filter({ created_by_id: user.id, statut: "active" }) : [],
    enabled: !!user?.id,
  });

  const createMedMutation = useMutation({
    // Note: l'achat de stock n'est plus comptabilisé comme une dépense — seule la consommation
    // réelle (traitement) génère une transaction, pour éviter le double comptage.
    mutationFn: (data) => base44.entities.Medicament.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicaments"] });
      setShowForm(false);
    },
  });

  const updateMedMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Medicament.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicaments"] });
      setShowForm(false);
      setEditingMed(null);
    },
  });

  const deleteMedMutation = useMutation({
    mutationFn: (id) => base44.entities.Medicament.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["medicaments"] }),
  });

  const archiveMedMutation = useMutation({
    mutationFn: ({ id, archived }) => base44.entities.Medicament.update(id, { archived }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["medicaments"] }),
  });

  const traitementMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.TraitementSanitaire.create(data);
      if (data.medicament_id && data.quantite_utilisee) {
        const med = medicaments.find((m) => m.id === data.medicament_id);
        if (med) {
          await base44.entities.Medicament.update(med.id, {
            quantite: Math.max(0, (med.quantite || 0) - data.quantite_utilisee),
          });
          // Consommation médicament → transaction automatique
          const montant = data.quantite_utilisee * (med.prix_unitaire || 0);
          if (montant > 0) {
            const bandeName = bandes.find((b) => b.id === data.bande_id)?.nom;
            await base44.entities.Transaction.create({
              type: "depense",
              categorie: "medicaments",
              montant,
              date: data.date || new Date().toISOString().split("T")[0],
              bande_id: data.bande_id || null,
              description: `Traitement ${med.nom} — ${data.quantite_utilisee} ${med.unite || "unités"}${bandeName ? ` (${bandeName})` : ""}`,
              mode_paiement: "especes",
            });
          }
        }
      }
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["traitements", user?.id] });
      const previous = queryClient.getQueryData(["traitements", user?.id]);
      const optimistic = { id: `temp-${Date.now()}`, ...data, created_by_id: user?.id };
      queryClient.setQueryData(["traitements", user?.id], (old = []) => [optimistic, ...old]);
      setShowTraitementForm(null);
      return { previous };
    },
    onError: (err, data, context) => queryClient.setQueryData(["traitements", user?.id], context.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["traitements"] });
      queryClient.invalidateQueries({ queryKey: ["medicaments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const activeMedicaments = medicaments.filter((m) => !m.archived);
  const archivedMedicaments = medicaments.filter((m) => m.archived);
  const stocksBas = activeMedicaments.filter((m) => m.seuil_alerte && m.quantite != null && m.quantite <= m.seuil_alerte);
  const today = new Date().toISOString().split("T")[0];
  const rappelsProchains = traitements.filter((t) => t.prochain_rappel && t.prochain_rappel >= today).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("medicaments.title")}
        description={t("medicaments.description")}
        actions={
          <Button onClick={() => { setEditingMed(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> {t("medicaments.newMedicament")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t("medicaments.inStock")} value={activeMedicaments.length} icon={ShieldCheck} variant="primary" />
        <StatCard label={t("medicaments.lowStockAlerts")} value={stocksBas.length} icon={AlertTriangle} variant={stocksBas.length > 0 ? "danger" : "default"} />
        <StatCard label={t("medicaments.upcomingReminders")} value={rappelsProchains} icon={CalendarClock} variant={rappelsProchains > 0 ? "warning" : "default"} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: "stock", label: t("medicaments.tabs.stock") },
           { key: "traitements", label: t("medicaments.tabs.history") },
           { key: "rappels", label: `${t("medicaments.upcomingReminders")}${rappelsProchains > 0 ? ` (${rappelsProchains})` : ""}` },
           { key: "calendrier", label: t("medicaments.tabs.calendar") },
           { key: "archives", label: `${t("medicaments.tabs.archived")}${archivedMedicaments.length > 0 ? ` (${archivedMedicaments.length})` : ""}` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {showForm && (
        <MedicamentForm
          medicament={editingMed}
          onSubmit={(data) =>
            editingMed
              ? updateMedMutation.mutate({ id: editingMed.id, data })
              : createMedMutation.mutate(data)
          }
          onCancel={() => { setShowForm(false); setEditingMed(null); }}
          isLoading={createMedMutation.isPending || updateMedMutation.isPending}
        />
      )}

      {showTraitementForm && (
        <TraitementForm
          bande={showTraitementForm}
          bandes={bandes}
          medicaments={medicaments}
          onSubmit={(data) => traitementMutation.mutate(data)}
          onCancel={() => setShowTraitementForm(null)}
          isLoading={traitementMutation.isPending}
        />
      )}

      {activeTab === "stock" && (
        <>
          {activeMedicaments.length === 0 && !isLoading ? (
            <EmptyState
              icon={Syringe}
              title={t("medicaments.empty.title")}
              description={t("medicaments.empty.desc")}
              action={
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> {t("medicaments.empty.action")}
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeMedicaments.map((med) => (
                <MedicamentCard
                  key={med.id}
                  medicament={med}
                  bandes={bandes}
                  onEdit={() => { setEditingMed(med); setShowForm(true); }}
                  onDelete={() => deleteMedMutation.mutate(med.id)}
                  onArchive={() => archiveMedMutation.mutate({ id: med.id, archived: !med.archived })}
                  onTraitement={() => setShowTraitementForm({ id: "", nom: t("medicaments.selectBande"), medicament_id: med.id })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "archives" && (
        <>
          {archivedMedicaments.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center">
              <p className="text-sm text-muted-foreground">{t("medicaments.archive.empty")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {archivedMedicaments.map((med) => (
                <MedicamentCard
                  key={med.id}
                  medicament={med}
                  bandes={bandes}
                  onEdit={() => { setEditingMed(med); setShowForm(true); }}
                  onDelete={() => deleteMedMutation.mutate(med.id)}
                  onArchive={() => archiveMedMutation.mutate({ id: med.id, archived: !med.archived })}
                  onTraitement={() => setShowTraitementForm({ id: "", nom: t("medicaments.selectBande"), medicament_id: med.id })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "calendrier" && (
        <CalendrierVaccins
          traitements={traitements}
          bandes={bandes}
          medicaments={medicaments}
        />
      )}

      {activeTab === "traitements" && (
        <TraitementList
          traitements={traitements}
          bandes={bandes}
          medicaments={medicaments}
          onNouveauTraitement={() => setShowTraitementForm({ id: "" })}
        />
      )}

      {activeTab === "rappels" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setShowTraitementForm({ id: "" })} className="gap-2" size="sm">
               <Plus className="w-4 h-4" /> {t("medicaments.reminders.add")}
             </Button>
          </div>
          {traitements.filter((t) => t.prochain_rappel && t.prochain_rappel >= today).length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center">
              <CalendarClock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">{t("medicaments.reminders.empty")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("medicaments.reminders.emptyDesc")}</p>
              <Button onClick={() => setShowTraitementForm({ id: "" })} className="mt-4 gap-2" size="sm">
                <Plus className="w-4 h-4" /> {t("medicaments.reminders.add")}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {traitements
                .filter((tr) => tr.prochain_rappel && tr.prochain_rappel >= today)
                .sort((a, b) => a.prochain_rappel.localeCompare(b.prochain_rappel))
                .map((tr) => {
                  const med = medicaments.find((m) => m.id === tr.medicament_id);
                  const bande = bandes.find((b) => b.id === tr.bande_id);
                  const daysLeft = Math.ceil((new Date(tr.prochain_rappel) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={tr.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${daysLeft <= 3 ? "bg-destructive/10" : "bg-secondary/10"}`}>
                          <CalendarClock className={`w-4 h-4 ${daysLeft <= 3 ? "text-destructive" : "text-secondary-foreground"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{med?.nom || t("medicaments.unknownMed")}</p>
                          <p className="text-xs text-muted-foreground">{bande?.nom || "—"} · {tr.motif}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${daysLeft <= 3 ? "text-destructive" : "text-secondary-foreground"}`}>
                          {daysLeft === 1 ? t("medicaments.daysLeftOne", { n: daysLeft }) : t("medicaments.daysLeftMany", { n: daysLeft })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tr.prochain_rappel).toLocaleDateString(lang === "en" ? "en-US" : "fr-FR")}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}