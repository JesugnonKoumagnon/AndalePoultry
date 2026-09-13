import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/LanguageContext";

export default function DeleteAccountDrawer({ user }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!open) setAcknowledged(false);
  }, [open]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: user?.email,
        subject: t("settings.deleteEmailSubject"),
        body: t("settings.deleteEmailBody").replace("{email}", user?.email || ""),
      });
      toast({ title: t("settings.deleteSubmittedTitle"), description: t("settings.deleteSubmittedDesc") });
      setOpen(false);
      base44.auth.logout();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="destructive" className="w-full gap-2">
          <Trash2 className="w-4 h-4" /> {t("settings.deleteAccount")}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {t("settings.deleteConfirmTitle")}
          </DrawerTitle>
          <DrawerDescription>{t("settings.deleteConfirmDesc")}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-2 space-y-3">
          <p className="text-sm rounded-md bg-muted border border-border p-3 text-muted-foreground">
            {t("settings.deleteBackupNote")}
          </p>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 accent-destructive"
            />
            <span>{t("settings.deleteAcknowledgeLabel")}</span>
          </label>
        </div>
        <DrawerFooter>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting || !acknowledged}
            className="gap-2"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {t("settings.deleteConfirmButton")}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={isDeleting}>{t("common.cancel")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}