import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Minus, Wheat, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

const typeLabels = {
  demarrage: "Démarrage",
  croissance: "Croissance",
  finition: "Finition",
  pondeuse: "Ponte",
  premix: "Prémix",
  autre: "Autre",
};

export default function StockCard({ stock, onEdit, onDelete, onConsommation }) {
  const isLow = stock.seuil_alerte_kg && stock.quantite_kg <= stock.seuil_alerte_kg;
  const maxRef = stock.capacite_max_kg || (stock.seuil_alerte_kg ? stock.seuil_alerte_kg * 3 : stock.quantite_kg) || 1;
  const progressPercent = Math.min(100, (stock.quantite_kg / maxRef) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`hover:shadow-md transition-shadow ${isLow ? "border-destructive/30" : ""}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isLow ? "bg-destructive/10" : "bg-primary/10"}`}>
                {isLow ? <AlertTriangle className="w-5 h-5 text-destructive" /> : <Wheat className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <h3 className="font-heading font-semibold">{stock.nom}</h3>
                <p className="text-xs text-muted-foreground">{typeLabels[stock.type_aliment] || stock.type_aliment}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onConsommation}>
                  <Minus className="w-4 h-4 mr-2" /> Enregistrer consommation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" /> Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{stock.quantite_kg} kg</span>
              {isLow && <Badge variant="destructive" className="text-xs">Stock bas</Badge>}
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {stock.seuil_alerte_kg && <span>Seuil: {stock.seuil_alerte_kg} kg</span>}
              {stock.prix_par_kg && <span>{new Intl.NumberFormat("fr-FR").format(stock.prix_par_kg)} FCFA/kg</span>}
            </div>
            {stock.fournisseur && (
              <p className="text-xs text-muted-foreground">Fournisseur: {stock.fournisseur}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}