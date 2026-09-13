import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bird, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full space-y-8">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Bird className="w-8 h-8 text-primary" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-primary">Andale Poultry</span>
        </div>

        <h1 className="text-4xl font-heading font-bold tracking-tight">À propos d'Andale Poultry</h1>

        <div className="space-y-4 text-foreground/80 leading-relaxed text-base">
          <p>
            <strong>Andale Poultry</strong> est une plateforme de gestion avicole complète, conçue pour aider les éleveurs de volailles — qu'ils soient petits producteurs familiaux ou exploitations industrielles — à piloter leur activité au quotidien avec précision et sérénité.
          </p>
          <p>
            Grâce à Andale Poultry, vous pouvez suivre vos bandes de poulets, pintades, canards, dindes et cailles en temps réel : effectifs, mortalités, poids moyens, traitements sanitaires, consommation d'aliments et rentabilité par bande. Tous vos indicateurs clés sont centralisés dans un tableau de bord clair et intuitif.
          </p>
          <p>
            La plateforme intègre également la gestion de la provenderie (stocks d'aliments, alertes de rupture, historique de consommation), un module de comptabilité (revenus, dépenses, rapports mensuels exportables en Excel ou PDF), et une boutique en ligne pour partager vos annonces de vente d'œufs ou de volailles via WhatsApp, Facebook et TikTok.
          </p>
          <p>
            Andale Poultry est développé par une équipe passionnée par l'agriculture africaine et les technologies numériques, avec pour mission de rendre la gestion avicole professionnelle accessible à tous les éleveurs, où qu'ils se trouvent.
          </p>
        </div>

        <div className="flex gap-4 pt-2">
          <Link to="/contact" className="text-primary font-medium hover:underline">Nous contacter →</Link>
          <Link to="/login" className="text-muted-foreground hover:underline">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}