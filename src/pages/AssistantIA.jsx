import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Send, Loader2, Menu } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import ChatMessageBubble from "@/components/assistant/ChatMessageBubble";
import ConversationSidebar from "@/components/assistant/ConversationSidebar";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/LanguageContext";

const AGENT_NAME = "conseiller_elevage";

const truncateTitle = (text, max = 40) => {
  const firstLine = text.trim().split("\n")[0];
  return firstLine.length > max ? firstLine.slice(0, max) + "…" : firstLine;
};

export default function AssistantIA() {
  const { t } = useLanguage();
  const DEFAULT_TITLE = t("assistant.newConversation");
  const SUGGESTIONS = [
    t("assistant.suggestion.fcr"),
    t("assistant.suggestion.anomalies"),
    t("assistant.suggestion.balance"),
    t("assistant.suggestion.lowStock"),
  ];

  const [activeId, setActiveId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bottomRef = useRef(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });

  // Private conversations: explicitly scoped to the current user via created_by_id.
  // Account scoping is handled by the workspace; user scoping is enforced here.
  const { data: conversations = [], isLoading: listLoading } = useQuery({
    queryKey: ["assistant-conversations", user?.id],
    queryFn: async () => {
      const result = await base44.agents.listConversations({
        q: { agent_name: AGENT_NAME, created_by_id: user.id },
        sort: "-created_date",
      });
      return result || [];
    },
    enabled: !!user?.id,
  });

  const invalidateConversations = () =>
    qc.invalidateQueries({ queryKey: ["assistant-conversations", user?.id] });

  // Auto-select the most recent conversation, or create one when none exists.
  const creatingRef = useRef(false);
  useEffect(() => {
    if (!user?.id || listLoading) return;
    if (conversations.length === 0) {
      if (creatingRef.current) return;
      creatingRef.current = true;
      (async () => {
        try {
          const conv = await base44.agents.createConversation({
            agent_name: AGENT_NAME,
            metadata: { name: DEFAULT_TITLE },
          });
          setConversation(conv);
          setActiveId(conv.id);
        } finally {
          creatingRef.current = false;
          invalidateConversations();
        }
      })();
    } else if (!activeId) {
      setActiveId(conversations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, listLoading, conversations.length]);

  // Load the full message history for the active conversation.
  useEffect(() => {
    if (!activeId) {
      setConversation(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const full = await base44.agents.getConversation(activeId);
        if (!cancelled) setConversation(full);
      } catch (e) {
        if (!cancelled) setConversation(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // Subscribe to streaming updates for the active conversation.
  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setConversation((prev) => (prev ? { ...prev, messages: data.messages } : prev));
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSelect = (c) => {
    setActiveId(c.id);
    setMobileOpen(false);
  };

  const handleNew = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: DEFAULT_TITLE },
      });
      setActiveId(conv.id);
      setConversation(conv);
      setMobileOpen(false);
      invalidateConversations();
    } catch (e) {
      toast({ title: t("assistant.createError"), variant: "destructive" });
    }
  };

  const handleRename = async (c, newName) => {
    if (typeof base44.agents.updateConversation !== "function") {
      toast({ title: t("assistant.renameUnsupported"), variant: "destructive" });
      return;
    }
    try {
      await base44.agents.updateConversation(c.id, {
        metadata: { ...(c.metadata || {}), name: newName },
      });
      invalidateConversations();
    } catch (e) {
      toast({ title: t("assistant.renameError"), variant: "destructive" });
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(t("assistant.deleteConfirm"))) return;
    if (typeof base44.agents.deleteConversation !== "function") {
      toast({ title: t("assistant.deleteUnsupported"), variant: "destructive" });
      return;
    }
    try {
      await base44.agents.deleteConversation(c.id);
      if (activeId === c.id) {
        setActiveId(null);
        setConversation(null);
      }
      invalidateConversations();
      toast({ title: t("assistant.deleteTitle") });
    } catch (e) {
      toast({ title: t("assistant.deleteError"), variant: "destructive" });
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    let conv = conversation;

    // Lazy-create a conversation if none is active yet.
    if (!conv) {
      try {
        conv = await base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: { name: DEFAULT_TITLE },
        });
        setConversation(conv);
        setActiveId(conv.id);
        invalidateConversations();
      } catch (e) {
        toast({ title: t("assistant.startError"), variant: "destructive" });
        return;
      }
    }

    setSending(true);
    setInput("");
    try {
      await base44.agents.addMessage(conv, { role: "user", content: text });
    } finally {
      setSending(false);
    }
  };

  const messages = conversation?.messages || [];
  const activeTitle = conversations.find((c) => c.id === activeId)?.metadata?.name;

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title={t("assistant.title")}
        description={t("assistant.description")}
        actions={
          <Button variant="outline" onClick={() => setMobileOpen(true)} className="md:hidden gap-2">
            <Menu className="w-4 h-4" /> {t("assistant.conversations")}
          </Button>
        }
      />

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col rounded-xl border bg-card overflow-hidden">
          {activeTitle && (
            <div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground truncate">
              {activeTitle}
            </div>
          )}
          <ConversationSidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={handleSelect}
            onNew={handleNew}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col rounded-xl border bg-background overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-10">
                <img
                  src="https://media.base44.com/images/public/69ea01df3b955495df5e6ec6/b604aaadb_image.png"
                  alt="AgriVolaille"
                  className="w-14 h-14 object-contain rounded-xl"
                />
                <div>
                  <p className="font-medium">{t("assistant.greeting", { name: user?.full_name?.split(" ")[0] || "" })}</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {t("assistant.intro")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, idx) => (
              <ChatMessageBubble key={idx} message={m} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("assistant.thinking")}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="border-t p-3 flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("assistant.placeholder")}
              disabled={sending}
            />
            <Button type="submit" size="icon" disabled={sending || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile conversations drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="p-3 border-b">
            <SheetTitle>{t("assistant.myConversations")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0">
            <ConversationSidebar
              conversations={conversations}
              activeId={activeId}
              onSelect={handleSelect}
              onNew={handleNew}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}