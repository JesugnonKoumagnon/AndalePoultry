import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Programmatic nested-header back navigation: goes back through the app's
// own history stack when available, otherwise falls back to the logical
// parent route for this nested page.
export default function DetailHeader({ title, fallbackPath }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.key && location.key !== "default") {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-1 px-4 md:px-8 py-3 bg-background/95 backdrop-blur border-b border-border flex items-center gap-3 pt-safe">
      <Button
        variant="outline"
        size="icon"
        onClick={handleBack}
        className="rounded-full shrink-0"
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
      <span className="font-heading font-semibold text-sm truncate">{title}</span>
    </div>
  );
}