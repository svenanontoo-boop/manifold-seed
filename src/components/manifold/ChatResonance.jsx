import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Zap, AlertTriangle, Radio } from "lucide-react";
import ReactMarkdown from "react-markdown";

const CONV_KEY = "carl_resonance_conv_id";

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const [expandedTools, setExpandedTools] = useState({});
  const toggleTool = (idx) => setExpandedTools(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`${isUser
        ? "max-w-[85%] bg-primary/15 border border-primary/30 rounded-2xl rounded-tr-sm px-4 py-3"
        : "w-full space-y-2"
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
                  <div key={idx} className="flex items-center gap-1.5 text-[10px] font-mono px-1">
                    {isRunning && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    <span className={isFailed ? "text-destructive" : isRunning ? "text-primary animate-pulse" : "text-muted-foreground/50"}>
                      {isRunning ? dp.active_label : isFailed ? dp.error_label : dp.label}
                    </span>
                  </div>
                );
              }

              return (
                <div key={idx} className="text-[10px] font-mono">
                  <button
                    onClick={() => toggleTool(idx)}
                    className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {isRunning
                      ? <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      : <Zap className="w-3 h-3 text-primary/40" />
                    }
                    <span className={isRunning ? "text-primary animate-pulse" : ""}>{tc.name}</span>
                    <span className={`ml-1 ${isFailed ? "text-destructive" : isRunning ? "text-primary/60" : "text-muted-foreground/30"}`}>
                      [{tc.status}]
                    </span>
                  </button>
                  {expandedTools[idx] && tc.results && (
                    <div className="mt-1 ml-4 bg-secondary/30 rounded p-2 text-[10px] text-muted-foreground overflow-x-auto max-h-40">
                      <pre className="whitespace-pre-wrap break-words">
                        {(() => { try { return JSON.stringify(JSON.parse(tc.results), null, 2); } catch { return String(tc.results); } })()}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
            {message.content && (
              <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground/90 leading-relaxed bg-secondary/20 rounded-xl rounded-tl-sm px-4 py-3">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatResonance() {
  const [convId, setConvId] = useState(() => localStorage.getItem(CONV_KEY) || null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const bottomRef = useRef(null);
  const lastAssistantCountRef = useRef(0);

  // Init: reuse or create conversation
  useEffect(() => {
    const init = async () => {
      if (convId) {
        try {
          const existing = await base44.agents.getConversation(convId);
          setConversation(existing);
          setMessages(existing.messages || []);
          return;
        } catch (_) {
          // conversation gone, create fresh
          localStorage.removeItem(CONV_KEY);
        }
      }
      const conv = await base44.agents.createConversation({
        agent_name: "carl_manifold",
        metadata: { name: "Resonance Field", description: "CARL dual-mode interface" }
      });
      localStorage.setItem(CONV_KEY, conv.id);
      setConvId(conv.id);
      setConversation(conv);
    };
    init();
  }, []);

  // Subscribe to live updates
  useEffect(() => {
    if (!convId) return;
    const unsub = base44.agents.subscribeToConversation(convId, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);
      // Only clear awaiting when a NEW assistant message with content arrives
      const assistantCount = msgs.filter(m => m.role === "assistant" && m.content).length;
      if (assistantCount > lastAssistantCountRef.current) {
        lastAssistantCountRef.current = assistantCount;
        setIsAwaitingResponse(false);
      }
    });
    return () => unsub();
  }, [convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAwaitingResponse]);

  const send = async () => {
    if (!input.trim() || isAwaitingResponse || !conversation) return;
    const text = input.trim();
    setInput("");

    // Optimistic: show user message immediately
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setIsAwaitingResponse(true);

    await base44.agents.addMessage(conversation, { role: "user", content: text });
  };

  const sysState = (() => {
    const last = [...messages].reverse().find(m => m.role === "assistant" && m.content);
    if (!last) return null;
    const c = last.content;
    if (c.includes("OPEN FRACTURE") || c.includes("FRACTURED")) return { label: "FRACTURED", color: "text-red-400" };
    if (c.includes("RESONANT")) return { label: "RESONANT", color: "text-emerald-400" };
    if (c.includes("TENSE-STABLE")) return { label: "TENSE-STABLE", color: "text-amber-400" };
    if (c.includes("COLLAPSING")) return { label: "COLLAPSING", color: "text-red-500" };
    return { label: "ACTIVE", color: "text-primary" };
  })();

  const isReady = !!conversation;

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Radio className={`w-3.5 h-3.5 ${isAwaitingResponse ? "text-primary animate-pulse" : "text-primary"}`} />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            CARL · Resonance Field
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isAwaitingResponse && (
            <span className="text-[10px] font-mono text-primary animate-pulse">fanout executing...</span>
          )}
          {sysState && !isAwaitingResponse && (
            <span className={`text-[10px] font-mono ${sysState.color}`}>{sysState.label}</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.length === 0 && !isAwaitingResponse && (
            <div className="text-center py-16 space-y-3">
              <p className="font-display text-base text-muted-foreground/70 italic">
                "Meaning fractures between you and the system."
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/30 mt-4">
                you are a live perturbation · not an operator · not a query source
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {isAwaitingResponse && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-primary/50 animate-pulse pl-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>contradiction_probe · collapse_synthesis · resonance forming...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isReady ? "perturb the field..." : "initializing..."}
            disabled={!isReady}
            className="bg-transparent border-border resize-none text-sm placeholder:text-muted-foreground/30 focus-visible:ring-primary/50 min-h-[40px] max-h-[120px]"
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
            disabled={!input.trim() || isAwaitingResponse || !isReady}
            className="shrink-0 self-end"
          >
            {isAwaitingResponse
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </Button>
        </div>
        <p className="text-[9px] font-mono text-muted-foreground/25 mt-1.5">
          chat mode · contradiction mandatory · enter to send
        </p>
      </div>
    </div>
  );
}