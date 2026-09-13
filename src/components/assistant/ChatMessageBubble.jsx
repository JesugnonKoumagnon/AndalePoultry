import React from "react";
import ReactMarkdown from "react-markdown";
import { User } from "lucide-react";

export default function ChatMessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src="https://media.base44.com/images/public/69ea01df3b955495df5e6ec6/b604aaadb_image.png"
            alt="Andale Poultry"
            className="w-full h-full object-contain"
          />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border rounded-bl-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:my-2">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}