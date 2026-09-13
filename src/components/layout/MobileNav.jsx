import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bird,
  Wheat,
  Calculator,
  Syringe,
  Users,
  Truck,
  UserCheck,
  Store,
  Sparkles,
  Settings,
  LayoutGrid,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const PRIMARY_ITEMS = [
  { path: "/", labelKey: "nav.home", icon: LayoutDashboard },
  { path: "/bandes", labelKey: "nav.bandes", icon: Bird },
  { path: "/provenderie", labelKey: "nav.provenderie", icon: Wheat },
  { path: "/comptabilite", labelKey: "nav.comptabilite", icon: Calculator },
];

const MORE_ITEMS = [
  { path: "/medicaments", labelKey: "nav.medicaments", icon: Syringe },
  { path: "/equipes", labelKey: "nav.equipes", icon: Users },
  { path: "/fournisseurs", labelKey: "nav.fournisseurs", icon: Truck },
  { path: "/clients", labelKey: "nav.clients", icon: UserCheck },
  { path: "/ma-boutique", labelKey: "nav.boutique", icon: Store },
  { path: "/assistant-ia", labelKey: "nav.assistant", icon: Sparkles },
  { path: "/parametres", labelKey: "nav.parametres", icon: Settings },
];

const ALL_ITEMS = [...PRIMARY_ITEMS, ...MORE_ITEMS];

const STORAGE_PREFIX = "navstack_";

function getTabForPath(pathname, items) {
  const matches = items.filter((item) =>
    item.path === "/" ? pathname === "/" : pathname.startsWith(item.path)
  );
  return matches.sort((a, b) => b.path.length - a.path.length)[0];
}

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const tab = getTabForPath(location.pathname, ALL_ITEMS);
    if (tab) {
      sessionStorage.setItem(STORAGE_PREFIX + tab.path, location.pathname);
    }
  }, [location.pathname]);

  const activeTab = getTabForPath(location.pathname, ALL_ITEMS);
  const moreActive = MORE_ITEMS.some((it) => it.path === activeTab?.path);

  const navigateTo = (item) => {
    const isActive = activeTab?.path === item.path;
    if (isActive) {
      sessionStorage.removeItem(STORAGE_PREFIX + item.path);
      navigate(item.path);
    } else {
      const savedPath = sessionStorage.getItem(STORAGE_PREFIX + item.path) || item.path;
      navigate(savedPath);
    }
  };

  const handleTabClick = (e, item) => {
    e.preventDefault();
    navigateTo(item);
  };

  const handleMoreClick = (item) => {
    navigateTo(item);
    setMoreOpen(false);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 md:hidden pb-safe no-select">
        <div className="flex items-center justify-around py-2">
          {PRIMARY_ITEMS.map((item) => {
            const isActive = activeTab?.path === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleTabClick(e, item)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors no-select ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">
                  {t(item.labelKey)}
                </span>
              </a>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-label={t("nav.more")}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors no-select ${
              moreActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">{t("nav.more")}</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>{t("nav.more")}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 p-4 pb-safe">
            {MORE_ITEMS.map((item) => {
              const isActive = activeTab?.path === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleMoreClick(item)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs font-medium text-center">{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}