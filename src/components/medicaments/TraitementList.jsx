import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Syringe, Bird, CalendarClock, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import TraitementForm from "./TraitementForm";

const motifLabels = {
  vaccination: "Vaccination",
  traitement_maladie: "Traitement maladie",
  prevention: "Prévention",
  deworming: "Déparasitage",
  autre: "Autre",
};

const motifColors = {
  vaccination: "bg-primary/10 text-primary",
  traitement_maladie: "bg-destructive/10 text-destructive",
  prevention: "bg-secondary/20 text-secondary-foreground",
  deworming: "bg-chart-4/10 text-chart-4",
  autre: "bg-muted text-muted-foreground",
};

export default function TraitementList({ traitements, bandes, medicaments, onNouveauTraitement }) {
  const [editingTraitement, setEditingTraitement] = useState(null);
  const queryClient = useQueryClient();

  const getBandeName = (id) => bandes.find((b) => b.id === id)?.nom || "—";
  const getMedName = (id) => medicaments.find((m) => m.id === id)?.nom || "—";

  const today = new Date().toISOString().split("T")[0];
  const rappels = traitements.filter((t) => t.prochain_rappel && t.prochain_rappel >= today);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TraitementSanitaire.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["traitements"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TraitementSanitaire.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["traitements"] });
      setEditingTraitement(null);
    },
  });

  if (editingTraitement) {
    return (
      <TraitementForm
        bande={bandes.find(b => b.id === editingTraitement.bande_id) || { id: editingTraitement.bande_id }}
        bandes={bandes}
        medicaments={medicaments}
        traitement={editingTraitement}
        onSubmit={(data) => updateMutation.mutate({ id: editingTraitement.id, data })}
        onCancel={() => setEditingTraitement(null)}
        isLoading={updateMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-4">
      {rappels.length > 0 && (
        <div className="p-4 rounded-xl border border-secondary/40 bg-secondary/10">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-secondary-foreground" />
            <h3 className="text-sm font-semibold">Rappels à venir ({rappels.length})</h3>
          </div>
          <div className="space-y-2">
            {rappels.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm bg-card rounded-lg p-2.5 border border-border">
                <div className="flex items-center gap-2">
                  <Syringe className="w-4 h-4 text-muted-foreground" />
                  <span>{getMedName(t.medicament_id)} — {getBandeName(t.bande_id)}</span>
                </div>
                <span className="text-xs font-medium text-secondary-foreground">
                  {format(parseISO(t.prochain_rappel), "d MMM yyyy", { locale: fr })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {traitements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Syringe className="w-10 h-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aucun traitement enregistré</p>
              <Button onClick={onNouveauTraitement} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> Nouveau traitement
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {traitements.map((t) => (
                <div key={t.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                    <Syringe className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge className={`text-xs ${motifColors[t.motif] || motifColors.autre}`}>
                        {motifLabels[t.motif] || t.motif}
                      </Badge>
                      {t.medicament_id && (
                        <span className="text-sm font-medium">{getMedName(t.medicament_id)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Bird className="w-3 h-3" /> {getBandeName(t.bande_id)}
                      </span>
                      <span>{t.date && format(parseISO(t.date), "d MMM yyyy", { locale: fr })}</span>
                      {t.quantite_utilisee && <span>{t.quantite_utilisee} unités utilisées</span>}
                    </div>
                    {t.notes && <p className="text-xs text-muted-foreground mt-1">{t.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {t.prochain_rappel && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Rappel</p>
                        <p className="text-xs font-medium">{format(parseISO(t.prochain_rappel), "d MMM yy", { locale: fr })}</p>
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingTraitement(t)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(t.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}