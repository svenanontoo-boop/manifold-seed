import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

export default function InputTerminal({ onSubmit, isProcessing }) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim() || isProcessing) return;
    onSubmit(input.trim());
    setInput("");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Drop a thought into the manifold..."
        className="bg-transparent border-none resize-none text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 min-h-[60px]"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="flex justify-between items-center mt-2">
        <p className="text-[10px] font-mono text-muted-foreground">
          {isProcessing ? "manifold processing..." : "shift+enter for newline"}
        </p>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          className="gap-1.5"
        >
          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {isProcessing ? "Processing" : "Seed"}
        </Button>
      </div>
    </div>
  );
}