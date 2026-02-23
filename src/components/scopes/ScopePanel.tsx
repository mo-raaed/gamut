import { HistogramScope } from "./HistogramScope";
import { ParadeScope } from "./ParadeScope";
import { WaveformScope } from "./WaveformScope";
import { NoiseScope } from "./NoiseScope";
import type { ScopeData } from "@/types";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import { BarChart3, Activity, Radio, Zap } from "lucide-react";

interface ScopePanelProps {
  scopeData: ScopeData | null;
}

const SCOPE_TABS = [
  { id: "all" as const, label: "All", icon: null },
  { id: "histogram" as const, label: "Histogram", icon: BarChart3 },
  { id: "parade" as const, label: "Parade", icon: Activity },
  { id: "waveform" as const, label: "Waveform", icon: Radio },
  { id: "noise" as const, label: "Noise", icon: Zap },
];

export function ScopePanel({ scopeData }: ScopePanelProps) {
  const { activeScope, setActiveScope } = useUIStore();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scope tab bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-card/50">
        {SCOPE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveScope(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors",
              activeScope === tab.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab.icon && <tab.icon className="w-3 h-3" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scope canvases */}
      <div className="flex-1 min-h-0 p-2 pb-4">
        {activeScope === "all" ? (
          <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
            <HistogramScope
              data={scopeData?.histogram ?? null}
              className="h-full"
            />
            <ParadeScope
              data={scopeData?.parade ?? null}
              className="h-full"
            />
            <WaveformScope
              data={scopeData?.waveform ?? null}
              className="h-full"
            />
            <NoiseScope
              data={scopeData?.noise ?? null}
              className="h-full"
            />
          </div>
        ) : activeScope === "histogram" ? (
          <HistogramScope
            data={scopeData?.histogram ?? null}
            className="h-full"
          />
        ) : activeScope === "parade" ? (
          <ParadeScope
            data={scopeData?.parade ?? null}
            className="h-full"
          />
        ) : activeScope === "noise" ? (
          <NoiseScope
            data={scopeData?.noise ?? null}
            className="h-full"
          />
        ) : (
          <WaveformScope
            data={scopeData?.waveform ?? null}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}
