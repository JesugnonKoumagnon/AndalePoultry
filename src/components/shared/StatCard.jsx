import React from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StatCard({ label, value, icon: Icon, trend, trendLabel, variant = "default" }) {
  const cardVariants = {
    default: "bg-card",
    primary: "bg-primary/5 border-primary/20",
    warning: "bg-secondary/10 border-secondary/30",
    danger: "bg-destructive/5 border-destructive/20",
  };

  const iconBg = {
    default: "bg-muted",
    primary: "bg-primary/10",
    warning: "bg-destructive/10",
    danger: "bg-destructive/10",
  };

  const iconColor = {
    default: "text-muted-foreground",
    primary: "text-primary",
    warning: "text-destructive",
    danger: "text-destructive",
  };

  const valueColor = {
    default: "",
    primary: "text-primary",
    warning: "text-destructive",
    danger: "text-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`p-5 ${cardVariants[variant]} transition-shadow hover:shadow-md`}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className={`text-2xl font-heading font-bold ${valueColor[variant]}`}>{value}</p>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {trendLabel && (
              <p className={`text-xs font-medium ${
                trend === "up" ? "text-primary" : trend === "down" ? "text-destructive" : "text-muted-foreground"
              }`}>
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendLabel}
              </p>
            )}
          </div>
          {Icon && (
            <div className={`p-2.5 rounded-xl ${iconBg[variant]}`}>
              <Icon className={`w-5 h-5 ${iconColor[variant]}`} />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}