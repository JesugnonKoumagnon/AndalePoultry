import React, { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLanguage } from "@/lib/LanguageContext";

/**
 * Period filter: single month mode or custom range (from ... to ...)
 */
export default function PeriodFilter({ mode, onModeChange, filterMonth, onFilterMonth, dateFrom, dateTo, onDateFrom, onDateTo }) {
  const { t, lang } = useLanguage();
  const dateLocale = lang === "en" ? enUS : fr;

  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = subMonths(now, i);
      const value = format(d, "yyyy-MM");
      const label = format(d, "MMMM yyyy", { locale: dateLocale });
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  }, [dateLocale]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Mode selector */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">{t("periodFilter.mode")}</label>
        <Select value={mode} onValueChange={onModeChange}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="single">{t("periodFilter.singleMonth")}</SelectItem>
            <SelectItem value="all">{t("common.allMonths")}</SelectItem>
            <SelectItem value="range">{t("periodFilter.range")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === "single" && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("periodFilter.month")}</label>
          <Select value={filterMonth} onValueChange={onFilterMonth}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {mode === "range" && (
        <>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">{t("periodFilter.from")}</label>
            <Select value={dateFrom} onValueChange={onDateFrom}>
              <SelectTrigger className="w-44"><SelectValue placeholder={t("periodFilter.startMonthPlaceholder")} /></SelectTrigger>
              <SelectContent>
                {monthOptions.slice().reverse().map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">{t("periodFilter.to")}</label>
            <Select value={dateTo} onValueChange={onDateTo}>
              <SelectTrigger className="w-44"><SelectValue placeholder={t("periodFilter.endMonthPlaceholder")} /></SelectTrigger>
              <SelectContent>
                {monthOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}