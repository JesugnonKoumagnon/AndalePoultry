import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const MOTIF_COLORS = {
  vaccination: "bg-primary text-primary-foreground",
  traitement_maladie: "bg-destructive text-destructive-foreground",
  prevention: "bg-secondary text-secondary-foreground",
  deworming: "bg-chart-3 text-white",
  autre: "bg-muted text-muted-foreground",
};

const MOTIF_DOT = {
  vaccination: "bg-primary",
  traitement_maladie: "bg-destructive",
  prevention: "bg-secondary",
  deworming: "bg-blue-500",
  autre: "bg-muted-foreground",
};

export default function CalendrierVaccins({ traitements, bandes, medicaments }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  // Leading blank cells (Mon=0 ... Sun=6)
  const firstDayOfWeek = (getDay(start) + 6) % 7; // make Monday=0
  const blanks = Array(firstDayOfWeek).fill(null);

  // Map rappels to their date
  const rappelsByDate = useMemo(() => {
    const map = {};
    traitements.forEach((t) => {
      if (!t.prochain_rappel) return;
      const key = t.prochain_rappel;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [traitements]);

  // Map traitements to their treatment date
  const traitsByDate = useMemo(() => {
    const map = {};
    traitements.forEach((t) => {
      if (!t.date) return;
      const key = t.date;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [traitements]);

  const getEventsForDate = (day) => {
    const key = format(day, "yyyy-MM-dd");
    const rappels = (rappelsByDate[key] || []).map((t) => ({ ...t, _type: "rappel" }));
    const traits = (traitsByDate[key] || []).map((t) => ({ ...t, _type: "traitement" }));
    return [...traits, ...rappels];
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-heading">
              Calendrier sanitaire — {format(currentMonth, "MMMM yyyy", { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())} className="text-xs px-2">
                Aujourd'hui
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Legend */}
          <div className="flex gap-3 flex-wrap text-xs mt-1">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-muted-foreground">Vaccination</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive" /><span className="text-muted-foreground">Traitement maladie</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-secondary" /><span className="text-muted-foreground">Prévention</span></div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Header row */}
          <div className="grid grid-cols-7 mb-1">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {blanks.map((_, i) => <div key={`blank-${i}`} />)}
            {days.map((day) => {
              const events = getEventsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(isSameDay(day, selectedDate) ? null : day)}
                  className={`relative rounded-lg p-1 min-h-[52px] flex flex-col items-center transition-colors hover:bg-muted/60
                    ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}
                    ${today ? "bg-accent" : ""}`}
                >
                  <span className={`text-xs font-semibold ${today ? "text-primary" : ""}`}>
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                    {events.slice(0, 3).map((e, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${MOTIF_DOT[e.motif] || "bg-muted-foreground"} ${e._type === "rappel" ? "ring-1 ring-offset-1 ring-secondary" : ""}`}
                      />
                    ))}
                    {events.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{events.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-heading">
                    {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun événement ce jour</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEvents.map((e, i) => {
                      const med = medicaments.find((m) => m.id === e.medicament_id);
                      const bande = bandes.find((b) => b.id === e.bande_id);
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                          <div className={`mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${MOTIF_COLORS[e.motif] || "bg-muted text-muted-foreground"}`}>
                            {e._type === "rappel" ? "🔔 Rappel" : "✅ Traitement"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{med?.nom || "—"}</p>
                            <p className="text-xs text-muted-foreground">{e.motif?.replace("_", " ")}</p>
                            {bande && (
                              <p className="text-xs text-primary font-medium mt-0.5">🐔 {bande.nom}</p>
                            )}
                            {e.quantite_utilisee && (
                              <p className="text-xs text-muted-foreground">{e.quantite_utilisee} {med?.unite || "unités"}</p>
                            )}
                            {e.notes && <p className="text-xs italic text-muted-foreground mt-1">"{e.notes}"</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}