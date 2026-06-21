import React, { useState } from "react";
import StateVector from "./StateVector";
import { ChevronDown, ChevronUp, Sparkles, Zap, Brain, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATE_ICONS = {
  expanding: Sparkles,
  colliding: Zap,
  synthesizing: Brain,
  stable: Eye,
  dormant: Eye,
};

const MANIFOLD_COLORS = {
  antibubble: "border-l-blue-400",
  shadowlattice: "border-l-purple-500",
  dreamengine: "border-l-amber-400",
  mythengine: "border-l-pink-500",
  unclassified: "border-l-muted-foreground",
};

const MEMORY_LABELS = {
  trace: { label: "Trace", color: "bg-blue-900/50 text-blue-300" },
  orientation: { label: "Orient.", color: "bg-emerald-900/50 text-emerald-300" },
  contradiction: { label: "Contra.", color: "bg-red-900/50 text-red-300" },
};

export default function ThoughtCellCard({ cell, depth = 0, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = STATE_ICONS[cell.state] || Eye;
  const borderClass = MANIFOLD_COLORS[cell.manifold] || MANIFOLD_COLORS.unclassified;
  const mem = MEMORY_LABELS[cell.memory_layer] || MEMORY_LABELS.orientation;

  return (
    <div
      className={`border-l-2 ${borderClass} bg-card rounded-lg p-3 cursor-pointer hover:bg-secondary/50 transition-all duration-300`}
      style={{ marginLeft: depth * 16 }}
      onClick={() => onSelect?.(cell)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-mono text-muted-foreground capitalize">{cell.state}</span>
            <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${mem.color}`}>
              {mem.label}
            </Badge>
            {cell.manifold && cell.manifold !== "unclassified" && (
              <span className="text-[9px] font-mono text-muted-foreground capitalize">{cell.manifold}</span>
            )}
          </div>
          <p className="text-sm text-foreground leading-snug line-clamp-2">{cell.intent}</p>
          {cell.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {cell.tags.slice(0, 6).map((t, i) => (
                <span key={i} className="text-[10px] font-mono text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="text-muted-foreground hover:text-foreground p-1"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <StateVector cell={cell} />
          {cell.content && (
            <div className="text-xs text-muted-foreground leading-relaxed bg-secondary/30 rounded p-2">
              {cell.content}
            </div>
          )}
          {cell.carl_insight && (
            <div className="text-xs leading-relaxed bg-primary/5 border border-primary/20 rounded p-2">
              <span className="text-primary font-mono text-[10px]">CARL:</span>{" "}
              <span className="text-foreground/80">{cell.carl_insight}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}