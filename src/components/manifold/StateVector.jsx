import React from "react";

const BAR_COLORS = {
  pressure: "bg-red-500",
  curvature: "bg-blue-400",
  crystallization: "bg-amber-500",
  desire: "bg-pink-500",
  ambiguity: "bg-emerald-400",
};

const BAR_LABELS = {
  pressure: "Pressure",
  curvature: "Curvature",
  crystallization: "Crystal.",
  desire: "Desire",
  ambiguity: "Ambiguity",
};

export default function StateVector({ cell }) {
  const fields = ["pressure", "curvature", "crystallization", "desire", "ambiguity"];

  return (
    <div className="space-y-1.5">
      {fields.map((f) => {
        const raw = cell[f] ?? 0.5;
        const val = f === "curvature" ? (raw + 1) / 2 : raw;
        const pct = Math.round(val * 100);
        return (
          <div key={f} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground w-14 text-right shrink-0">
              {BAR_LABELS[f]}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full ${BAR_COLORS[f]} transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground w-8">
              {f === "curvature" ? raw.toFixed(2) : pct + "%"}
            </span>
          </div>
        );
      })}
    </div>
  );
}