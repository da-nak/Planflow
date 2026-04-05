"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, X, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Partner {
  id: string;
  name: string | null;
  email: string | null;
}

interface ChatProps {
  partner: Partner;
  onClose: () => void;
}

export function Chat({ partner, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [partner.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const response = await fetch(`/api/chat?partnerId=${partner.id}`);
    if (response.ok) {
      const data = await response.json();
      setMessages(data.messages || []);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: partner.id,
        content: newMessage.trim(),
      }),
    });

    if (response.ok) {
      setNewMessage("");
      fetchMessages();
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-background-secondary border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background-tertiary">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {partner.name?.[0]?.toUpperCase() || partner.email?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">{partner.name || "Partner"}</p>
            <p className="text-xs text-foreground-muted">Accountability Partner</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-background-secondary transition-colors"
        >
          <X className="w-4 h-4 text-foreground-muted" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-foreground-muted text-sm">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-10 h-10 text-foreground-muted mb-2" />
            <p className="text-foreground-muted text-sm">No messages yet</p>
            <p className="text-foreground-muted text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === message.receiverId ? false : message.senderId !== partner.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    isOwn
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-background-tertiary text-foreground rounded-bl-none"
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-foreground-muted"}`}>
                    {format(new Date(message.createdAt), "h:mm a")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg bg-background-tertiary border border-border text-foreground text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-2 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
