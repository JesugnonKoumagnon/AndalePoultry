import React from "react";
import { Link } from "react-router-dom";
import { Bird, Wheat, Pill, Calculator } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const NAV_ITEMS = [
  { labelKey: "nav.bandes", icon: Bird, to: "/bandes", color: "bg-primary/10 text-primary" },
  { labelKey: "nav.provenderie", icon: Wheat, to: "/provenderie", color: "bg-secondary/20 text-secondary-foreground" },
  { labelKey: "nav.medicaments", icon: Pill, to: "/medicaments", color: "bg-blue-50 text-blue-600" },
  { labelKey: "nav.comptabilite", icon: Calculator, to: "/comptabilite", color: "bg-purple-50 text-purple-600" },
];

export default function QuickNav() {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {NAV_ITEMS.map(({ labelKey, icon: Icon, to, color }) => (
        <Link
          key={to}
          to={to}
          className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div className={`p-2 rounded-lg ${color} transition-transform group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-heading font-semibold text-sm">{t(labelKey)}</span>
        </Link>
      ))}
    </div>
  );
}