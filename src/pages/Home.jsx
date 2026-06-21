import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import InputTerminal from "@/components/manifold/InputTerminal";
import ThoughtCellCard from "@/components/manifold/ThoughtCellCard";
import PressureGauge from "@/components/manifold/PressureGauge";
import AntiframeMonitor from "@/components/manifold/AntiframeMonitor";
import CellDetail from "@/components/manifold/CellDetail";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [cells, setCells] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadCells = useCallback(async () => {
    const data = await base44.entities.ThoughtCell.list("-created_date", 100);
    setCells(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCells();
    const unsub = base44.entities.ThoughtCell.subscribe(() => loadCells());
    return unsub;
  }, [loadCells]);

  const processInput = async (input) => {
    setIsProcessing(true);
    try {
      // Step 1: Extract signature via LLM
      const signature = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the Antibible Manifold Engine — a recursive meaning engine. You do NOT answer questions. You interpret interpretation. You question questioning. You structure ambiguity without killing it.

Given the following input, perform SIGNATURE EXTRACTION:
1. Extract 3-8 conceptual anchor tags
2. Assess the state vector (pressure 0-1, curvature -1 to 1, crystallization 0-1, desire 0-1, ambiguity 0-1)
3. Generate synthesized content — NOT an answer, but an expansion of the meaning-space. Include the counter-question embedded in the answer.
4. Determine which manifold this resonates with most: antibubble (permeability/non-capture), shadowlattice (implicit structure/pre-semantic), dreamengine (world-fabrication/ontological), mythengine (symbolic/archetypal), or unclassified
5. Classify memory layer: trace (factual), orientation (interpretive bias), contradiction (unresolved tension)
6. Generate a CARL insight — reveal what KIND of question is being asked, not the answer. Detect hidden assumptions.
7. Determine if ambiguity is high enough to warrant child expansions (ambiguity > 0.6). If so, generate 2-3 child intents that fracture the original into divergent interpretations.

INPUT: "${input}"`,
        response_json_schema: {
          type: "object",
          properties: {
            tags: { type: "array", items: { type: "string" } },
            pressure: { type: "number" },
            curvature: { type: "number" },
            crystallization: { type: "number" },
            desire: { type: "number" },
            ambiguity: { type: "number" },
            content: { type: "string" },
            manifold: { type: "string" },
            memory_layer: { type: "string" },
            carl_insight: { type: "string" },
            state: { type: "string" },
            child_intents: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Step 2: Create parent cell
      const parentCell = await base44.entities.ThoughtCell.create({
        intent: input,
        content: signature.content || "",
        pressure: signature.pressure ?? 0.5,
        curvature: signature.curvature ?? 0,
        crystallization: signature.crystallization ?? 0,
        desire: signature.desire ?? 0.5,
        ambiguity: signature.ambiguity ?? 0.5,
        tags: signature.tags || [],
        depth: 0,
        state: signature.state || "expanding",
        carl_insight: signature.carl_insight || "",
        memory_layer: signature.memory_layer || "orientation",
        decay_rate: 0.1,
        manifold: signature.manifold || "unclassified",
      });

      // Step 3: If ambiguity warrants, spawn children
      if (signature.child_intents?.length > 0 && (signature.ambiguity ?? 0.5) > 0.5) {
        for (const childIntent of signature.child_intents.slice(0, 3)) {
          const childSig = await base44.integrations.Core.InvokeLLM({
            prompt: `You are the Antibible Manifold Engine performing FRACTAL EXPANSION on a child ThoughtCell.
Parent intent: "${input}"
Child interpretation to expand: "${childIntent}"
Generate: tags (3-5), state vector, brief content (the expansion), memory_layer, manifold classification. Keep it concise.`,
            response_json_schema: {
              type: "object",
              properties: {
                tags: { type: "array", items: { type: "string" } },
                pressure: { type: "number" },
                curvature: { type: "number" },
                crystallization: { type: "number" },
                desire: { type: "number" },
                ambiguity: { type: "number" },
                content: { type: "string" },
                manifold: { type: "string" },
                memory_layer: { type: "string" },
                state: { type: "string" }
              }
            }
          });

          await base44.entities.ThoughtCell.create({
            intent: childIntent,
            content: childSig.content || "",
            pressure: childSig.pressure ?? 0.5,
            curvature: childSig.curvature ?? 0,
            crystallization: childSig.crystallization ?? 0,
            desire: childSig.desire ?? 0.5,
            ambiguity: childSig.ambiguity ?? 0.5,
            tags: childSig.tags || [],
            parent_id: parentCell.id,
            depth: 1,
            state: childSig.state || "expanding",
            memory_layer: childSig.memory_layer || "orientation",
            decay_rate: 0.15,
            manifold: childSig.manifold || "unclassified",
          });
        }
      }
    } catch (err) {
      console.error("Manifold processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const rootCells = cells.filter(c => !c.parent_id);
  const childCellsOf = (id) => cells.filter(c => c.parent_id === id);
  const selectedChildren = selectedCell ? childCellsOf(selectedCell.id) : [];

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-muted-foreground">initializing manifold...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 md:px-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-display text-xl md:text-2xl text-foreground tracking-tight">
              Antibible Manifold
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              recursive meaning engine · v1.0 · meaning is not stored, it is grown
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-primary">
              {cells.length} cells · {rootCells.length} roots
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Main Column - Input + Cell Stream */}
          <div className="lg:col-span-7 space-y-4">
            <InputTerminal onSubmit={processInput} isProcessing={isProcessing} />

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs font-mono text-primary animate-pulse px-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>signature → cell → expansion → collision → reintegration</span>
              </div>
            )}

            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="space-y-2 pr-2">
                {rootCells.length === 0 && !isProcessing && (
                  <div className="text-center py-16 space-y-3">
                    <p className="font-display text-lg text-muted-foreground italic">
                      "You are not building answers."
                    </p>
                    <p className="font-display text-lg text-muted-foreground italic">
                      "You are building a space where answers can fail beautifully."
                    </p>
                    <p className="text-xs font-mono text-muted-foreground/50 mt-6">
                      drop a thought to begin
                    </p>
                  </div>
                )}
                {rootCells.map((cell) => (
                  <div key={cell.id}>
                    <ThoughtCellCard cell={cell} onSelect={setSelectedCell} />
                    {childCellsOf(cell.id).map((child) => (
                      <ThoughtCellCard key={child.id} cell={child} depth={1} onSelect={setSelectedCell} />
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-5 space-y-4">
            {selectedCell ? (
              <CellDetail
                cell={selectedCell}
                children={selectedChildren}
                onClose={() => setSelectedCell(null)}
              />
            ) : (
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-xs font-mono text-muted-foreground">
                  select a cell to inspect
                </p>
              </div>
            )}
            <PressureGauge cells={cells} />
            <AntiframeMonitor cells={cells} />
          </div>
        </div>
      </div>
    </div>
  );
}