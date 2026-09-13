import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ConversationItem from "./ConversationItem";

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <Button onClick={onNew} className="w-full gap-2">
          <Plus className="w-4 h-4" /> Nouvelle conversation
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Aucune conversation. Commencez une nouvelle discussion !
          </p>
        ) : (
          conversations.map((c) => (
            <ConversationItem
              key={c.id}
              conversation={c}
              isActive={c.id === activeId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}