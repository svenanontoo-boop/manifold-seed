import React from "react";
import { AlertTriangle, Shield, Eye } from "lucide-react";

const ANTI_PATTERNS = [
  { key: "dogmatic_closure", label: "Dogmatic Closure" },
  { key: "narrative_convergence", label: "Narrative Convergence" },
  { key: "semantic_locking", label: "Semantic Locking" },
  { key: "identity_crystallization", label: "Identity Crystallization" },
  { key: "over_determinism", label: "Over-Determinism" },
];

export default function AntiframeMonitor({ cells }) {
  if (!cells?.length) return null;

  const avgCrystal = cells.reduce((s, c) => s + (c.crystallization || 0), 0) / cells.length;
  const avgAmbiguity = cells.reduce((s, c) => s + (c.ambiguity || 0.5), 0) / cells.length;
  const uniqueTags = new Set(cells.flatMap(c => c.tags || [])).size;
  const stableCount = cells.filter(c => c.state === "stable").length;
  const totalCells = cells.length;

  const risks = [];
  if (avgCrystal > 0.6) risks.push("dogmatic_closure");
  if (uniqueTags < totalCells * 0.5 && totalCells > 3) risks.push("narrative_convergence");
  if (stableCount > totalCells * 0.8 && totalCells > 3) risks.push("semantic_locking");
  if (avgAmbiguity < 0.2) risks.push("over_determinism");

  const isClean = risks.length === 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {isClean ? (
          <Shield className="w-4 h-4 text-emerald-400" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        )}
        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Antiframe Monitor
        </h3>
      </div>

      {isClean ? (
        <p className="text-xs text-emerald-400 font-mono">Permeability intact. No drift detected.</p>
      ) : (
        <div className="space-y-2">
          {ANTI_PATTERNS.map((ap) => {
            const active = risks.includes(ap.key);
            return (
              <div key={ap.key} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-amber-400" : "bg-emerald-400/30"}`} />
                <span className={`text-[11px] font-mono ${active ? "text-amber-400" : "text-muted-foreground/50"}`}>
                  {ap.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
          <Eye className="w-3 h-3" />
          <span>Antibible axioms: {isClean ? "all clear" : `${risks.length} drift${risks.length > 1 ? "s" : ""}`}</span>
        </div>
      </div>
    </div>
  );
}