import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, MoreVertical, Pencil, Trash2, Check, X } from "lucide-react";

const DEFAULT_TITLE = "Nouvelle conversation";

export default function ConversationItem({ conversation, isActive, onSelect, onRename, onDelete }) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(conversation.metadata?.name || DEFAULT_TITLE);

  useEffect(() => {
    setTitle(conversation.metadata?.name || DEFAULT_TITLE);
  }, [conversation.id, conversation.metadata?.name]);

  const submitRename = () => {
    const t = title.trim() || DEFAULT_TITLE;
    onRename(conversation, t);
    setRenaming(false);
  };

  if (renaming) {
    return (
      <div className="flex items-center gap-1 px-1 py-1">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitRename();
            if (e.key === "Escape") setRenaming(false);
          }}
          autoFocus
          className="h-7 text-sm"
        />
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={submitRename}>
          <Check className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setRenaming(false)}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-1 rounded-md px-2 py-1.5 ${
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
      }`}
    >
      <button
        onClick={() => onSelect(conversation)}
        className="flex-1 flex items-center gap-2 min-w-0 text-left"
      >
        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
        <span className="truncate text-sm">
          {conversation.metadata?.name || DEFAULT_TITLE}
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setRenaming(true)}>
            <Pencil className="w-3.5 h-3.5 mr-2" /> Renommer
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(conversation)}
            className="text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}