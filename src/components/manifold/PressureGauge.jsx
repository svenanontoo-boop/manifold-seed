import React from "react";

export default function PressureGauge({ cells }) {
  if (!cells?.length) return null;

  const avgPressure = cells.reduce((s, c) => s + (c.pressure || 0.5), 0) / cells.length;
  const avgCrystal = cells.reduce((s, c) => s + (c.crystallization || 0), 0) / cells.length;
  const avgAmbiguity = cells.reduce((s, c) => s + (c.ambiguity || 0.5), 0) / cells.length;
  const contradictions = cells.filter(c => c.memory_layer === "contradiction").length;

  const systemState = avgCrystal > 0.7 ? "CRYSTALLIZING" :
    avgPressure > 0.7 ? "HIGH PRESSURE" :
    avgAmbiguity > 0.7 ? "EXPANDING" :
    contradictions > 3 ? "COLLIDING" :
    "STABLE";

  const stateColor = {
    CRYSTALLIZING: "text-amber-400",
    "HIGH PRESSURE": "text-red-400",
    EXPANDING: "text-emerald-400",
    COLLIDING: "text-purple-400",
    STABLE: "text-blue-400",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-xs font-mono text-muted-foreground mb-3 uppercase tracking-wider">System State</h3>
      <div className={`text-lg font-mono font-bold ${stateColor[systemState]} mb-3`}>
        {systemState}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-[10px] font-mono text-muted-foreground block">Avg Pressure</span>
          <span className="text-sm font-mono text-foreground">{(avgPressure * 100).toFixed(0)}%</span>
        </div>
        <div>
          <span className="text-[10px] font-mono text-muted-foreground block">Crystallization</span>
          <span className="text-sm font-mono text-foreground">{(avgCrystal * 100).toFixed(0)}%</span>
        </div>
        <div>
          <span className="text-[10px] font-mono text-muted-foreground block">Ambiguity</span>
          <span className="text-sm font-mono text-foreground">{(avgAmbiguity * 100).toFixed(0)}%</span>
        </div>
        <div>
          <span className="text-[10px] font-mono text-muted-foreground block">Contradictions</span>
          <span className="text-sm font-mono text-foreground">{contradictions}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <span className="text-[10px] font-mono text-muted-foreground block mb-1">Cells</span>
        <span className="text-sm font-mono text-foreground">{cells.length}</span>
      </div>
    </div>
  );
}