import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import EmployeCard from "@/components/equipes/EmployeCard";
import EmployeForm from "@/components/equipes/EmployeForm";
import StatCard from "@/components/shared/StatCard";
import { UserCheck, UserX, Wallet } from "lucide-react";
import useBackClose from "@/hooks/useBackClose";
import { useLanguage } from "@/lib/LanguageContext";

export default function Equipes() {
  const [showForm, setShowForm] = useState(false);
  const [editingEmploye, setEditingEmploye] = useState(null);
  const queryClient = useQueryClient();

  useBackClose(showForm, () => { setShowForm(false); setEditingEmploye(null); });
  const { t } = useLanguage();

  const { data: employes = [], isLoading } = useQuery({
    queryKey: ["employes"],
    queryFn: () => base44.entities.Employe.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Employe.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employes"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employe.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employes"] });
      setShowForm(false);
      setEditingEmploye(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Employe.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employes"] }),
  });

  const actifs = employes.filter((e) => e.statut === "actif");
  const inactifs = employes.filter((e) => e.statut !== "actif");
  const masseSalariale = actifs.reduce((s, e) => s + (e.salaire_mensuel || 0), 0);
  const formatFCFA = (n) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("equipes.title")}
        description={t("equipes.description")}
        actions={
          <Button onClick={() => { setEditingEmploye(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> {t("equipes.newEmploye")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t("equipes.activeEmployees")} value={actifs.length} icon={UserCheck} variant="primary" />
        <StatCard label={t("equipes.payrollPerMonth")} value={formatFCFA(masseSalariale)} icon={Wallet} variant="warning" />
        <StatCard label={t("equipes.inactiveOrLeave")} value={inactifs.length} icon={UserX} />
      </div>

      {showForm && (
        <EmployeForm
          employe={editingEmploye}
          onSubmit={(data) =>
            editingEmploye
              ? updateMutation.mutate({ id: editingEmploye.id, data })
              : createMutation.mutate(data)
          }
          onCancel={() => { setShowForm(false); setEditingEmploye(null); }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {employes.length === 0 && !isLoading ? (
        <EmptyState
          icon={Users}
          title={t("equipes.empty.title")}
          description={t("equipes.empty.desc")}
          action={
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" /> {t("equipes.empty.action")}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employes.map((employe) => (
            <EmployeCard
              key={employe.id}
              employe={employe}
              onEdit={() => { setEditingEmploye(employe); setShowForm(true); }}
              onDelete={() => deleteMutation.mutate(employe.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}