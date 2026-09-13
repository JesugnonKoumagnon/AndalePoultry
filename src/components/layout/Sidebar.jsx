import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Bird,
  Wheat,
  Calculator,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Syringe,
  Truck,
  Store,
  UserCheck,
  Settings,
  Sparkles } from
"lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

const NAV_KEYS = [
{ path: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
{ path: "/bandes", labelKey: "nav.bandes", icon: Bird },
{ path: "/provenderie", labelKey: "nav.provenderie", icon: Wheat },
{ path: "/medicaments", labelKey: "nav.medicaments", icon: Syringe },
{ path: "/equipes", labelKey: "nav.equipes", icon: Users },
{ path: "/comptabilite", labelKey: "nav.comptabilite", icon: Calculator },
{ path: "/fournisseurs", labelKey: "nav.fournisseurs", icon: Truck },
{ path: "/clients", labelKey: "nav.clients", icon: UserCheck },
{ path: "/ma-boutique", labelKey: "nav.boutique", icon: Store },
{ path: "/assistant-ia", labelKey: "nav.assistant", icon: Sparkles },
{ path: "/parametres", labelKey: "nav.parametres", icon: Settings },
];


export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2 }}
      className="fixed left-0 top-0 h-screen bg-card border-r border-border z-40 flex flex-col no-select">
      
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        {!collapsed &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2.5">
          <img
            src="https://media.base44.com/images/public/69ea01df3b955495df5e6ec6/b604aaadb_image.png"
            alt="Andale Poultry"
            className="w-9 h-9 object-contain rounded-md"
          />
          <span className="font-heading font-extrabold text-xl text-[hsl(var(--primary))] tracking-tight">Andale Poultry</span>
        </motion.div>
        }
        {collapsed &&
        <img
          src="https://media.base44.com/images/public/69ea01df3b955495df5e6ec6/b604aaadb_image.png"
          alt="Andale Poultry"
          className="w-9 h-9 object-contain mx-auto"
        />
        }
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_KEYS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              isActive ?
              "bg-primary text-primary-foreground shadow-sm" :
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`
              }>
              <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? "mx-auto" : ""}`} />
              {!collapsed &&
              <span className="font-medium text-sm">{t(item.labelKey)}</span>
              }
            </Link>);
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border space-y-1">
        {!collapsed && (
          <div className="flex gap-3 px-3 py-1 text-xs text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">{t("nav.about")}</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">{t("nav.contact")}</Link>
          </div>
        )}
        <button
          onClick={() => base44.auth.logout()}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200`}>
          <LogOut className={`w-5 h-5 flex-shrink-0 ${collapsed ? "mx-auto" : ""}`} />
          {!collapsed && <span className="font-medium text-sm">{t("nav.logout")}</span>}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full flex items-center justify-center">
          
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </motion.aside>);

}