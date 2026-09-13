import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MapPin, Phone, MoreVertical, Pencil, Trash2, Store, ShieldCheck, Share2, ExternalLink, Loader2, ImageIcon, Smartphone } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import useBackClose from "@/hooks/useBackClose";
import { useLanguage } from "@/lib/LanguageContext";

const PRODUIT_LABELS = { oeufs: "boutique.product.oeufs", poulet_chair: "boutique.product.poulet_chair", autre: "boutique.product.autre" };
const UNITE_LABELS = { plateau: "boutique.unit.plateau", piece: "boutique.unit.piece", kg: "boutique.unit.kg" };

const DEFAULT_FORM = {
  produit: "oeufs", titre: "", description: "", quantite: "", unite: "plateau",
  prix_unitaire: "", devise: "FCFA", ville: "", pays: "", whatsapp: "", nom_ferme: "",
};

const IMAGE_PROMPTS = {
  oeufs: "Professional product photo of fresh farm eggs in a rustic basket on a wooden table, warm natural lighting, African farm setting, clean and appetizing, marketing photo for social media, no text or price",
  poulet_chair: "Professional product photo of fresh whole broiler chicken on a clean white surface, fresh herbs and vegetables around, bright natural lighting, appetizing, African farm marketing photo for social media, no text or price",
  autre: "Professional farm product photo, natural agricultural setting, clean marketing image, African farm, warm lighting, social media ready, no text or price",
};

function buildShareText(a, t) {
  const ferme = a.nom_ferme || "AgriVolaille";
  const lieu = [a.ville, a.pays].filter(Boolean).join(", ") || t("boutique.share.locationFallback");
  const titre = a.produit === "autre"
    ? t("boutique.share.introDefault", { titre: (a.titre || "").toUpperCase() })
    : (a.produit === "oeufs"
      ? t("boutique.share.intro.oeufs")
      : t("boutique.share.intro.poulet_chair"));

  const lines = [
    titre,
    a.description || null,
    "",
    t("boutique.share.availableNow"),
    t("boutique.share.qtyAvailable", { n: a.quantite, unit: t(UNITE_LABELS[a.unite] || "common.kg") }),
    a.prix_unitaire
      ? t("boutique.share.pricePerUnit", { n: a.prix_unitaire, devise: a.devise || "FCFA", unit: t(UNITE_LABELS[a.unite] || "common.kg") })
      : null,
    t("boutique.share.fromFarm", { ferme }),
    "",
    t("boutique.share.locationLabel", { lieu }),
    a.whatsapp ? t("boutique.share.contactWhatsApp", { wa: a.whatsapp }) : null,
    "",
    t("boutique.share.beforeStockout"),
    "",
    t("boutique.share.viaApp"),
  ];

  return lines.filter((l) => l !== null && l !== "").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function copyShareContent(text, imageUrl) {
  try {
    if (imageUrl && navigator.clipboard?.write && window.ClipboardItem) {
      const blob = await (await fetch(imageUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob, "text/plain": new Blob([text], { type: "text/plain" }) }),
      ]);
      return true;
    }
  } catch {
    // fall through
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
  return false;
}

async function nativeShare(text, imageUrl) {
  if (!navigator.share) return false;
  try {
    if (imageUrl && navigator.canShare) {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], "annonce.png", { type: blob.type || "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return true;
      }
    }
    await navigator.share({ text });
    return true;
  } catch {
    return false;
  }
}

function ShareMenu({ annonce, imageUrl }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const text = buildShareText(annonce, t);
  const encodedText = encodeURIComponent(text);
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://agrivolaille.app")}&quote=${encodedText}`;
  const tiktokUrl = `https://www.tiktok.com/upload`;
  const whatsappShareUrl = annonce.whatsapp
    ? `https://wa.me/${annonce.whatsapp.replace(/\D/g, "")}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  const shareToPlatform = async (url, platformName) => {
    const imageCopied = await copyShareContent(text, imageUrl);
    window.open(url, "_blank", "noopener,noreferrer");
    toast({
      title: t("boutique.share.openTitle", { name: platformName }),
      description: imageCopied ? t("boutique.share.imageCopied") : t("boutique.share.textCopied"),
    });
  };

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title={t("boutique.share.title")}>
          <Share2 className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {canNativeShare && (
          <DropdownMenuItem onClick={() => nativeShare(text, imageUrl)} className="cursor-pointer">
            <Smartphone className="w-3.5 h-3.5 mr-2" />
            <span className="text-sm">{t("boutique.share.withImage")}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => shareToPlatform(fbUrl, "Facebook")} className="cursor-pointer">
          <span className="text-blue-600 font-bold text-sm mr-2">f</span>
          <span className="text-sm">{t("boutique.share.toFacebook")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareToPlatform(whatsappShareUrl, "WhatsApp")} className="cursor-pointer">
          <span className="text-green-600 text-sm mr-2">📱</span>
          <span className="text-sm">{t("boutique.share.toWhatsApp")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareToPlatform(tiktokUrl, "TikTok")} className="cursor-pointer">
          <span className="text-black text-sm mr-2">♪</span>
          <span className="text-sm">{t("boutique.share.openTikTok")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyShareContent(text, imageUrl)}>
          <ExternalLink className="w-3.5 h-3.5 mr-2" />
          <span className="text-sm">{imageUrl ? t("boutique.share.copyTextImage") : t("boutique.share.copyText")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function prefillFromBande(bande, t) {
  const espece = bande?.espece;
  const produit = espece === "pondeuse" ? "oeufs" : espece === "poulet_chair" ? "poulet_chair" : "autre";
  const unite = espece === "pondeuse" ? "plateau" : espece === "poulet_chair" ? "piece" : "kg";
  const quantite = String(bande?.effectif_actuel ?? bande?.effectif_initial ?? "");
  const speciesName = espece ? (t(`espece.${espece}`) || espece) : "—";
  return {
    ...DEFAULT_FORM,
    produit,
    titre: `${t("bandeDetail.sell").replace(/^🛒\s*/, "")} ${speciesName} — ${bande?.nom || ""}`.trim(),
    unite,
    quantite,
  };
}

export default function MaBoutique() {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [generatingImageFor, setGeneratingImageFor] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const qc = useQueryClient();
  const location = useLocation();
  const prefillBande = location.state?.prefillBande;
  const prefillApplied = useRef(false);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: annonces = [] } = useQuery({
    queryKey: ["annonces", user?.id],
    queryFn: () => user?.id ? base44.entities.Annonce.filter({ created_by_id: user.id }, "-created_date") : [],
    enabled: !!user?.id,
  });

  const create = useMutation({
    mutationFn: (d) => base44.entities.Annonce.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["annonces"] }); closeForm(); },
  });
  const update = useMutation({
    mutationFn: ({ id, d }) => base44.entities.Annonce.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["annonces"] }); closeForm(); },
  });
  const del = useMutation({
    mutationFn: (id) => base44.entities.Annonce.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["annonces"] }),
  });

  const generateImage = async (annonce) => {
    setGeneratingImageFor(annonce.id);
    try {
      const prompt = IMAGE_PROMPTS[annonce.produit] || IMAGE_PROMPTS.autre;
      const result = await base44.integrations.Core.GenerateImage({ prompt });
      setGeneratedImages(prev => ({ ...prev, [annonce.id]: result.url }));
    } finally {
      setGeneratingImageFor(null);
    }
  };

  const openNew = () => { setEditing(null); setForm(DEFAULT_FORM); setShowForm(true); };
  const openEdit = (a) => {
    setEditing(a);
    setForm({
      produit: a.produit, titre: a.titre, description: a.description || "",
      quantite: a.quantite?.toString() || "", unite: a.unite,
      prix_unitaire: a.prix_unitaire?.toString() || "", devise: a.devise || "FCFA",
      ville: a.ville || "", pays: a.pays || "", whatsapp: a.whatsapp || "",
      nom_ferme: a.nom_ferme || "",
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  useBackClose(showForm, closeForm);

  // Pre-fill the form when navigating from "Sell" action on a flock
  useEffect(() => {
    if (prefillBande && !prefillApplied.current) {
      prefillApplied.current = true;
      setForm(prefillFromBande(prefillBande, t));
      setEditing(null);
      setShowForm(true);
    }
  }, [prefillBande, t]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const d = { ...form, quantite: Number(form.quantite), prix_unitaire: form.prix_unitaire ? Number(form.prix_unitaire) : undefined };
    editing ? update.mutate({ id: editing.id, d }) : create.mutate(d);
  };

  const previewFerme = form.nom_ferme || user?.full_name || t("boutique.preview.farm");

  const productEmoji = (p) => (p === "oeufs" ? "🥚" : p === "poulet_chair" ? "🐔" : "📦");
  const cleanProductLabel = (p) => t(PRODUIT_LABELS[p] || "boutique.product.autre").replace(/^[^ ]+ /, "");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("boutique.title")}
        description={t("boutique.description")}
        actions={
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> {t("boutique.newAd")}</Button>
        }
      />

      <div className="flex gap-6 items-start flex-col lg:flex-row">
        {/* Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-[420px] shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">{editing ? t("boutique.editAd") : t("boutique.newAd")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("boutique.product")}</Label>
                    <Select value={form.produit} onValueChange={(v) => setForm({ ...form, produit: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oeufs">{t("boutique.product.oeufs")}</SelectItem>
                        <SelectItem value="poulet_chair">{t("boutique.product.poulet_chair")}</SelectItem>
                        <SelectItem value="autre">{t("boutique.product.autre")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("boutique.titleLabel")}</Label>
                    <Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required placeholder={t("boutique.titlePlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("boutique.descriptionLabel")}</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t("boutique.qtyLabel")}</Label>
                      <Input type="number" min="1" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("boutique.unit")}</Label>
                      <Select value={form.unite} onValueChange={(v) => setForm({ ...form, unite: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plateau">{t("boutique.unit.plateau")}</SelectItem>
                          <SelectItem value="piece">{t("boutique.unit.piece")}</SelectItem>
                          <SelectItem value="kg">{t("boutique.unit.kg")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t("boutique.priceLabel")}</Label>
                      <Input type="number" min="0" value={form.prix_unitaire} onChange={(e) => setForm({ ...form, prix_unitaire: e.target.value })} placeholder={t("boutique.pricePlaceholder")} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("boutique.currency")}</Label>
                      <Select value={form.devise} onValueChange={(v) => setForm({ ...form, devise: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FCFA">FCFA</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t("boutique.city")}</Label>
                      <Input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("boutique.country")}</Label>
                      <Input value={form.pays} onChange={(e) => setForm({ ...form, pays: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("boutique.whatsapp")}</Label>
                    <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+225 07 XX XX XX XX" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("boutique.farmName")}</Label>
                    <Input value={form.nom_ferme} onChange={(e) => setForm({ ...form, nom_ferme: e.target.value })} />
                  </div>

                  {/* Aperçu */}
                  <div className="border rounded-xl p-4 bg-muted/40 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("boutique.preview")}</p>
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{productEmoji(form.produit)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{cleanProductLabel(form.produit)}</span>
                          <Badge variant="outline" className="text-xs gap-1 text-primary border-primary/40">
                            <ShieldCheck className="w-3 h-3" /> {t("boutique.verifiedFarm")}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-0.5">{form.titre || t("boutique.previewTitlePlaceholder")}</p>
                        <p className="text-xs text-muted-foreground">{t("boutique.preview.farm")}: {previewFerme}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {form.ville || "—"}, {form.pays || "—"}
                        </p>
                        <p className="text-xs mt-1">{t("boutique.preview.qtyAvailable")}: <strong>{form.quantite || "—"} {t(UNITE_LABELS[form.unite] || "common.kg")}</strong></p>
                        <p className="text-xs">{t("boutique.preview.unitPrice")}: <strong>{form.prix_unitaire ? `${form.prix_unitaire} ${form.devise}` : "—"}</strong></p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={closeForm}>{t("common.cancel")}</Button>
                    <Button type="submit" disabled={create.isPending || update.isPending}>
                      {editing ? t("common.update") : t("boutique.publish")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Annonces list */}
        <div className="flex-1 min-w-0">
          {annonces.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t("boutique.empty.title")}</p>
              <p className="text-sm mt-1">{t("boutique.empty.desc")}</p>
              <Button onClick={openNew} className="gap-2 mt-4"><Plus className="w-4 h-4" /> {t("boutique.newAd")}</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {annonces.map((a) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardContent className="p-5 flex flex-col h-full">
                      {generatedImages[a.id] && (
                        <div className="mb-3 rounded-lg overflow-hidden">
                          <img src={generatedImages[a.id]} alt={t("boutique.marketingVisual")} className="w-full h-40 object-cover" />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{productEmoji(a.produit)}</span>
                          <div>
                            <p className="text-xs text-muted-foreground">{cleanProductLabel(a.produit)}</p>
                            <Badge variant="outline" className="text-xs gap-1 text-primary border-primary/40 mt-0.5">
                              <ShieldCheck className="w-3 h-3" /> {t("boutique.verifiedFarm")}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title={t("boutique.marketingVisual")}
                            onClick={() => generateImage(a)}
                            disabled={generatingImageFor === a.id}
                          >
                            {generatingImageFor === a.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <ImageIcon className="w-3.5 h-3.5" />}
                          </Button>
                          <ShareMenu annonce={a} imageUrl={generatedImages[a.id]} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(a)}><Pencil className="w-4 h-4 mr-2" /> {t("boutique.menuEdit")}</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => del.mutate(a.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> {t("boutique.menuDelete")}</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <h3 className="font-heading font-semibold text-sm mb-1">{a.titre}</h3>
                      {a.nom_ferme && <p className="text-xs text-muted-foreground mb-1">{t("boutique.preview.farm")}: {a.nom_ferme}</p>}
                      {(a.ville || a.pays) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" />{a.ville || "—"}, {a.pays || "—"}
                        </p>
                      )}
                      <div className="mt-auto pt-2 border-t space-y-0.5">
                        <p className="text-xs">{t("boutique.qtyShort")}: <strong>{a.quantite} {t(UNITE_LABELS[a.unite] || "common.kg")}</strong></p>
                        {a.prix_unitaire && <p className="text-xs text-primary font-semibold">{a.prix_unitaire} {a.devise || "FCFA"}</p>}
                        {a.whatsapp && (
                          <a href={`https://wa.me/${a.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-green-600 hover:underline mt-1">
                            <Phone className="w-3 h-3" /> {a.whatsapp}
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}