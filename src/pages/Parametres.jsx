import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import { User, Lock, Phone, Shield, LogOut, CheckCircle2, Loader2, Eye, EyeOff, Globe } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/LanguageContext";
import DeleteAccountDrawer from "@/components/parametres/DeleteAccountDrawer";

export default function Parametres() {
  const qc = useQueryClient();
  const { lang, changeLang, t } = useLanguage();

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  // Profile form
  const [profileForm, setProfileForm] = useState({ full_name: "", telephone: "" });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || "",
        telephone: user.telephone || "",
      });
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      qc.invalidateQueries(["me"]);
      setProfileEditing(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      toast({ title: t("settings.toastTitle"), description: t("settings.toastDesc") });
    },
  });

  // Password form
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError("");
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError(t("settings.pwMismatch"));
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwError(t("settings.pwTooShort"));
      return;
    }
    setPwLoading(true);
    try {
      await base44.auth.updateMe({ password: pwForm.newPw });
      setPwForm({ current: "", newPw: "", confirm: "" });
      toast({ title: t("settings.pwToastTitle"), description: t("settings.pwToastDesc") });
    } catch (err) {
      setPwError(err.message || t("settings.genericError"));
    } finally {
      setPwLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />

      {/* Language selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{t("settings.language")}</CardTitle>
              <CardDescription>{t("settings.languageDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              onClick={() => changeLang("fr")}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${lang === "fr" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            >
              🇫🇷 {t("settings.french")}
            </button>
            <button
              onClick={() => changeLang("en")}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${lang === "en" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            >
              🇬🇧 {t("settings.english")}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Profil card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{t("settings.profile")}</CardTitle>
                <CardDescription>{t("settings.profileDesc")}</CardDescription>
              </div>
            </div>
            {profileSaved && (
              <Badge className="bg-green-100 text-green-700 gap-1">
                <CheckCircle2 className="w-3 h-3" /> {t("settings.saved")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar display */}
          <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
              {(profileForm.full_name || user?.email || "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg">{profileForm.full_name || "—"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className="mt-1 text-xs gap-1 text-primary border-primary/40">
                <Shield className="w-3 h-3" /> {user?.role === "admin" ? t("settings.admin") : t("settings.user")}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">{t("settings.fullName")}</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) => { setProfileForm({ ...profileForm, full_name: e.target.value }); setProfileEditing(true); }}
                placeholder={t("settings.fullNamePlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telephone" className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {t("settings.phone")}
              </Label>
              <Input
                id="telephone"
                value={profileForm.telephone}
                onChange={(e) => { setProfileForm({ ...profileForm, telephone: e.target.value }); setProfileEditing(true); }}
                placeholder="+225 07 XX XX XX XX"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("settings.email")}</Label>
              <Input value={user?.email || ""} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">{t("settings.emailNote")}</p>
            </div>
          </div>

          <Button
            onClick={() => updateProfile.mutate({ full_name: profileForm.full_name, telephone: profileForm.telephone })}
            disabled={!profileEditing || updateProfile.isPending}
            className="w-full"
          >
            {updateProfile.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("settings.saving")}</>
            ) : (
              t("settings.saveChanges")
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Mot de passe */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{t("settings.password")}</CardTitle>
              <CardDescription>{t("settings.passwordDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {pwError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{pwError}</div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="newPw">{t("settings.newPassword")}</Label>
              <div className="relative">
                <Input
                  id="newPw"
                  type={showPw ? "text" : "password"}
                  value={pwForm.newPw}
                  onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                  placeholder={t("settings.pwPlaceholder")}
                  className="pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPw">{t("settings.confirmPassword")}</Label>
              <Input
                id="confirmPw"
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" disabled={pwLoading} variant="outline" className="w-full">
              {pwLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("settings.changing")}</>
              ) : (
                t("settings.changePassword")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sécurité & Compte */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{t("settings.account")}</CardTitle>
              <CardDescription>{t("settings.accountDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-medium">{t("settings.memberSince")}</p>
              <p className="text-xs text-muted-foreground">
                {user?.created_date ? new Date(user.created_date).toLocaleDateString(lang === "en" ? "en-US" : "fr-FR", { year: "numeric", month: "long", day: "numeric" }) : "—"}
              </p>
            </div>
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">{t("settings.active")}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div>
              <p className="text-sm font-medium">{t("settings.role")}</p>
              <p className="text-xs text-muted-foreground">{user?.role === "admin" ? t("settings.adminDesc") : t("settings.userDesc")}</p>
            </div>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </div>
          <Button
            variant="destructive"
            className="w-full gap-2 mt-2"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="w-4 h-4" /> {t("settings.logout")}
          </Button>
          <DeleteAccountDrawer user={user} />
        </CardContent>
      </Card>
    </div>
  );
}