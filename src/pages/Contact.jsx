import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bird, Mail, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function Contact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.integrations.Core.SendEmail({
      to: "contact@andalepoultry.com",
      subject: `Message de ${form.nom} — Andale Poultry`,
      body: `Nom : ${form.nom}\nEmail : ${form.email}\n\n${form.message}`,
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full space-y-8">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Bird className="w-8 h-8 text-primary" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-primary">Andale Poultry</span>
        </div>

        <h1 className="text-4xl font-heading font-bold tracking-tight">Contactez-nous</h1>
        <p className="text-muted-foreground">Une question, une suggestion ou besoin d'aide ? Écrivez-nous.</p>

        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <Mail className="w-5 h-5 text-primary flex-shrink-0" />
          <a href="mailto:contact@andalepoultry.com" className="text-primary font-medium hover:underline">
            contact@andalepoultry.com
          </a>
        </div>

        {sent ? (
          <div className="rounded-xl border bg-accent p-6 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-primary mx-auto" />
            <p className="font-semibold">Message envoyé !</p>
            <p className="text-sm text-muted-foreground">Nous vous répondrons dans les plus brefs délais.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
            <div className="space-y-1">
              <label className="text-sm font-medium">Votre nom</label>
              <Input required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Jean Dupont" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Votre email</label>
              <Input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jean@example.com" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Message</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Votre message..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer le message"}
            </Button>
          </form>
        )}

        <Link to="/" className="text-muted-foreground hover:underline text-sm block text-center">← Retour au menu principal</Link>
      </div>
    </div>
  );
}