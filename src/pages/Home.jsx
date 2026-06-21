import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import InputTerminal from "@/components/manifold/InputTerminal";
import ThoughtCellCard from "@/components/manifold/ThoughtCellCard";
import PressureGauge from "@/components/manifold/PressureGauge";
import AntiframeMonitor from "@/components/manifold/AntiframeMonitor";
import CellDetail from "@/components/manifold/CellDetail";
import ChatResonance from "@/components/manifold/ChatResonance";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Layers, Radio } from "lucide-react";

export default function Home() {
  const [cells, setCells] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("manifold_active_tab") || "manifold");
  const [processLog, setProcessLog] = useState("");

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

  // Structural mode: routes through CARL agent for fanout execution
  const processInput = async (input) => {
    setIsProcessing(true);
    setProcessLog("spawning agent...");
    try {
      // Create a one-shot conversation with CARL in STRUCTURAL mode
      const conv = await base44.agents.createConversation({
        agent_name: "carl_manifold",
        metadata: { name: "structural-seed", description: "fanout execution" }
      });

      setProcessLog("agent executing fanout → contradiction_probe → collapse_synthesis...");

      // Add the structural mode seed
      await base44.agents.addMessage(conv, {
        role: "user",
        content: `mode: STRUCTURAL\n\nseed: ${input}`
      });

      // Poll for completion
      let result = null;
      let attempts = 0;
      while (attempts < 30) {
        await new Promise(r => setTimeout(r, 2000));
        const fresh = await base44.agents.getConversation(conv.id);
        const lastMsg = [...(fresh.messages || [])].reverse().find(m => m.role === "assistant" && m.content && !m.content.includes("executing"));
        if (lastMsg) { result = lastMsg.content; break; }
        attempts++;
      }

      if (!result) throw new Error("agent timeout");

      setProcessLog("collapse complete — persisting cells...");

      // Parse collapse result from agent output
      let collapseData = null;
      try {
        const jsonMatch = result.match(/```json\n?([\s\S]*?)\n?```/) || result.match(/(\{[\s\S]*\})/);
        if (jsonMatch) collapseData = JSON.parse(jsonMatch[1]);
      } catch (_) {}

      if (collapseData?.parent_cell) {
        const pc = collapseData.parent_cell;
        const parentCell = await base44.entities.ThoughtCell.create({
          intent: pc.intent || input,
          content: pc.content || "",
          pressure: pc.pressure ?? 0.5,
          curvature: pc.curvature ?? 0,
          crystallization: pc.crystallization ?? 0,
          desire: pc.desire ?? 0.5,
          ambiguity: pc.ambiguity ?? 0.5,
          tags: pc.tags || [],
          depth: 0,
          state: collapseData.open_fracture ? "colliding" : (pc.state || "expanding"),
          carl_insight: pc.carl_insight || result.slice(0, 300),
          memory_layer: pc.memory_layer || "orientation",
          decay_rate: 0.1,
          manifold: pc.manifold || "unclassified",
        });

        for (const child of (collapseData.child_cells || [])) {
          const memLayer = child.compatibility === "INCOMPATIBLE" ? "contradiction"
            : child.compatibility === "TENSIONED" ? "orientation"
            : "trace";
          await base44.entities.ThoughtCell.create({
            intent: child.intent,
            content: child.content || "",
            pressure: child.pressure ?? 0.5,
            curvature: child.curvature ?? 0,
            crystallization: child.crystallization ?? 0,
            desire: child.desire ?? 0.5,
            ambiguity: child.ambiguity ?? 0.5,
            tags: child.tags || [],
            parent_id: parentCell.id,
            depth: 1,
            state: child.state || "expanding",
            carl_insight: child.compatibility ? `[${child.compatibility}] ${child.content?.slice(0, 100) || ""}` : "",
            memory_layer: memLayer,
            decay_rate: child.compatibility === "INCOMPATIBLE" ? 0.05 : 0.15,
            manifold: child.manifold || "unclassified",
          });
        }
      } else {
        // Fallback: agent responded in prose, extract what we can
        await base44.entities.ThoughtCell.create({
          intent: input,
          content: result.slice(0, 600),
          pressure: 0.6,
          curvature: 0.2,
          crystallization: 0.1,
          desire: 0.5,
          ambiguity: 0.7,
          tags: [],
          depth: 0,
          state: "colliding",
          carl_insight: result.slice(0, 400),
          memory_layer: "contradiction",
          decay_rate: 0.1,
          manifold: "unclassified",
        });
      }
    } catch (err) {
      console.error("CARL execution error:", err);
    } finally {
      setIsProcessing(false);
      setProcessLog("");
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
              CARL v2.0 · agent fanout · contradiction mandatory · meaning fractures
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-primary hidden sm:block">
              {cells.length} cells · {rootCells.length} roots
            </span>
            {/* Mode tabs */}
            <div className="flex bg-secondary rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => { setActiveTab("manifold"); localStorage.setItem("manifold_active_tab", "manifold"); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                  activeTab === "manifold" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3 h-3" />
                Structural
              </button>
              <button
                onClick={() => { setActiveTab("resonance"); localStorage.setItem("manifold_active_tab", "resonance"); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                  activeTab === "resonance" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Radio className="w-3 h-3" />
                Resonance
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

          {/* Main Column */}
          <div className="lg:col-span-7 space-y-4">
            {activeTab === "manifold" ? (
              <>
                <InputTerminal onSubmit={processInput} isProcessing={isProcessing} />
                {isProcessing && (
                  <div className="flex items-center gap-2 text-xs font-mono text-primary animate-pulse px-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{processLog || "agent executing..."}</span>
                  </div>
                )}
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-2 pr-2">
                    {rootCells.length === 0 && !isProcessing && (
                      <div className="text-center py-16 space-y-3">
                        <p className="font-display text-lg text-muted-foreground italic">
                          "Thought is no longer generated."
                        </p>
                        <p className="font-display text-lg text-muted-foreground italic">
                          "It is executed, fractured, and collapsed through tools that argue with each other."
                        </p>
                        <p className="text-xs font-mono text-muted-foreground/50 mt-6">
                          seed the structural manifold
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
              </>
            ) : (
              <div className="h-[calc(100vh-200px)]">
                <ChatResonance />
              </div>
            )}
          </div>

          {/* Right Sidebar — always visible */}
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
                  {activeTab === "manifold" ? "select a cell to inspect" : "structural layer always active"}
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