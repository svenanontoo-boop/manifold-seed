import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Zap, GitMerge, AlertTriangle, Radio } from "lucide-react";
import ReactMarkdown from "react-markdown";

const COMPAT_COLORS = {
  COMPATIBLE: "border-emerald-500/40 bg-emerald-950/20",
  TENSIONED: "border-amber-500/40 bg-amber-950/20",
  INCOMPATIBLE: "border-red-500/40 bg-red-950/20",
};
const COMPAT_LABELS = {
  COMPATIBLE: { label: "compatible", color: "text-emerald-400" },
  TENSIONED: { label: "tensioned", color: "text-amber-400" },
  INCOMPATIBLE: { label: "incompatible", color: "text-red-400" },
};

function CollapseTypeBadge({ type, openFracture }) {
  if (openFracture) return (
    <span className="flex items-center gap-1 text-[10px] font-mono text-red-400">
      <AlertTriangle className="w-3 h-3" /> OPEN FRACTURE STATE
    </span>
  );
  const map = {
    MERGED_CELL: { icon: GitMerge, color: "text-emerald-400", label: "MERGED_CELL" },
    FRACTURED_CELL_SET: { icon: AlertTriangle, color: "text-amber-400", label: "FRACTURED_CELL_SET" },
    PERSISTENT_TENSION_GRAPH: { icon: Radio, color: "text-purple-400", label: "PERSISTENT_TENSION_GRAPH" },
  };
  const cfg = map[type] || map.FRACTURED_CELL_SET;
  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-mono ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const [expandedTools, setExpandedTools] = useState({});

  const toggleTool = (idx) => setExpandedTools(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[90%] ${isUser
        ? "bg-primary/15 border border-primary/30 rounded-2xl rounded-tr-sm px-4 py-3"
        : "space-y-2 w-full"
      }`}>
        {isUser ? (
          <p className="text-sm text-foreground">{message.content}</p>
        ) : (
          <>
            {message.tool_calls?.map((tc, idx) => {
              const dp = tc.display_projection;
              const isRunning = ["pending", "running", "in_progress"].includes(tc.status);
              const isFailed = ["failed", "error"].includes(tc.status);
              if (dp?.hide_details && dp?.details_redacted) {
                return (
                  <div key={idx} className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 px-1">
                    {isRunning && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    <span className={isFailed ? "text-destructive" : isRunning ? "text-primary" : "text-muted-foreground"}>
                      {isRunning ? dp.active_label : isFailed ? dp.error_label : dp.label}
                    </span>
                  </div>
                );
              }
              return (
                <div key={idx} className="text-[10px] font-mono">
                  <button
                    onClick={() => toggleTool(idx)}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {isRunning && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    <Zap className="w-3 h-3 text-primary/60" />
                    <span>{tc.name}</span>
                    <span className={`ml-1 ${isFailed ? "text-destructive" : isRunning ? "text-primary" : "text-muted-foreground/50"}`}>
                      [{tc.status}]
                    </span>
                  </button>
                  {expandedTools[idx] && tc.results && (
                    <div className="mt-1 ml-4 bg-secondary/30 rounded p-2 text-[10px] text-muted-foreground overflow-x-auto max-h-32">
                      <pre className="whitespace-pre-wrap break-words">
                        {(() => { try { return JSON.stringify(JSON.parse(tc.results), null, 2); } catch { return tc.results; } })()}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
            {message.content && (
              <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground/90 leading-relaxed">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatResonance({ onCellsCreated }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const conv = await base44.agents.createConversation({
        agent_name: "carl_manifold",
        metadata: { name: "Manifold Session", description: "CARL resonance field" }
      });
      setConversation(conv);
    };
    init();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setIsSending(false);
    });
    return () => unsub();
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || isSending || !conversation) return;
    const text = input.trim();
    setInput("");
    setIsSending(true);
    await base44.agents.addMessage(conversation, { role: "user", content: text });
  };

  const systemStateFromMessages = () => {
    const last = [...messages].reverse().find(m => m.role === "assistant" && m.content);
    if (!last) return null;
    const content = last.content || "";
    if (content.includes("FRACTURED") || content.includes("OPEN FRACTURE")) return { label: "FRACTURED", color: "text-red-400" };
    if (content.includes("RESONANT")) return { label: "RESONANT", color: "text-emerald-400" };
    if (content.includes("TENSE-STABLE")) return { label: "TENSE-STABLE", color: "text-amber-400" };
    if (content.includes("COLLAPSING")) return { label: "COLLAPSING", color: "text-red-500" };
    return { label: "ACTIVE", color: "text-primary" };
  };

  const sysState = systemStateFromMessages();

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            CARL Resonance Field
          </span>
        </div>
        {sysState && (
          <span className={`text-[10px] font-mono ${sysState.color}`}>{sysState.label}</span>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-4">
          {messages.length === 0 && !isSending && (
            <div className="text-center py-12 space-y-3">
              <p className="font-display text-base text-muted-foreground italic">
                "Meaning fractures between you and the system."
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/40">
                perturbation awaited
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {isSending && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-primary/60 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>agent executing fanout cycle...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="perturb the field..."
            className="bg-transparent border-border resize-none text-sm placeholder:text-muted-foreground/40 focus-visible:ring-primary/50 min-h-[40px] max-h-[120px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            size="icon"
            onClick={send}
            disabled={!input.trim() || isSending || !conversation}
            className="shrink-0 self-end"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[9px] font-mono text-muted-foreground/30 mt-1.5">
          chat mode · agent fanout · contradiction mandatory
        </p>
      </div>
    </div>
  );
}