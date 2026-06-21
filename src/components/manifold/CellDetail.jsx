import React from "react";
import StateVector from "./StateVector";
import { X, GitBranch, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CellDetail({ cell, children: childCells, onClose }) {
  if (!cell) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-heading font-semibold text-foreground">Cell Detail</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase">Intent</span>
        <p className="text-sm text-foreground mt-1">{cell.intent}</p>
      </div>

      {cell.content && (
        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Synthesized Content</span>
          <p className="text-xs text-foreground/80 mt-1 leading-relaxed">{cell.content}</p>
        </div>
      )}

      <div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase mb-2 block">State Vector</span>
        <StateVector cell={cell} />
      </div>

      {cell.tags?.length > 0 && (
        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Tags</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {cell.tags.map((t, i) => (
              <Badge key={i} variant="outline" className="text-[10px] font-mono">{t}</Badge>
            ))}
          </div>
        </div>
      )}

      {cell.carl_insight && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono text-primary uppercase">CARL Insight</span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{cell.carl_insight}</p>
        </div>
      )}

      {childCells?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <GitBranch className="w-3 h-3 text-accent" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              Child Expansions ({childCells.length})
            </span>
          </div>
          <ScrollArea className="max-h-40">
            <div className="space-y-1.5">
              {childCells.map((c) => (
                <div key={c.id} className="text-xs text-foreground/70 bg-secondary/30 rounded p-2">
                  {c.intent}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex gap-4 text-[10px] font-mono text-muted-foreground pt-2 border-t border-border">
        <span>Depth: {cell.depth || 0}</span>
        <span>Memory: {cell.memory_layer}</span>
        <span>Manifold: {cell.manifold}</span>
        <span>Decay: {cell.decay_rate}</span>
      </div>
    </div>
  );
}