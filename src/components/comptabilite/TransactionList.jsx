import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const categorieLabels = {
  vente_volaille: "Vente volaille",
  vente_oeufs: "Vente œufs",
  vente_fumier: "Vente fumier",
  achat_aliment: "Achat aliment",
  achat_poussins: "Achat poussins",
  medicaments: "Médicaments",
  main_oeuvre: "Main d'œuvre",
  equipement: "Équipement",
  transport: "Transport",
  electricite_eau: "Élec./Eau",
  autre: "Autre",
};

const modeLabels = {
  especes: "Espèces",
  mobile_money: "Mobile Money",
  virement: "Virement",
  cheque: "Chèque",
};

export default function TransactionList({ transactions, bandes, onEdit, onDelete }) {
  const getBandeName = (id) => bandes.find((b) => b.id === id)?.nom || "—";
  const formatFCFA = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(2)}M FCFA`;
    if (abs >= 1_000) return `${(abs / 1_000).toFixed(2).replace(/\.?0+$/, "")}k FCFA`;
    return `${new Intl.NumberFormat("fr-FR").format(abs)} FCFA`;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Bande</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm">
                    {t.date && format(parseISO(t.date), "d MMM yy", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${t.type === "revenu" ? "text-primary" : "text-secondary-foreground"}`}>
                      {t.type === "revenu" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {t.type === "revenu" ? "Revenu" : "Dépense"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{categorieLabels[t.categorie] || t.categorie}</Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{t.description || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.bande_id ? getBandeName(t.bande_id) : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{modeLabels[t.mode_paiement] || t.mode_paiement}</TableCell>
                  <TableCell className={`text-right font-semibold text-sm ${t.type === "revenu" ? "text-primary" : "text-destructive"}`}>
                    {t.type === "revenu" ? "+" : "-"}{formatFCFA(t.montant)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(t)}>
                          <Pencil className="w-4 h-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(t.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}