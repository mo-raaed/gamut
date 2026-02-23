import { useCallback, useEffect, useRef, useState } from "react";
import type { ScopeData, ScopeWorkerResult } from "@/types";

export function useScopeWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [scopeData, setScopeData] = useState<ScopeData | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/scopeWorker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e: MessageEvent<ScopeWorkerResult>) => {
      if (e.data.type === "result") {
        setScopeData({
          histogram: e.data.histogram,
          parade: e.data.parade,
          waveform: e.data.waveform,
          noise: e.data.noise,
        });
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  const compute = useCallback((pixels: Uint8Array, width: number, height: number) => {
    const worker = workerRef.current;
    if (!worker) return;

    // Copy buffer so we can transfer it
    const buffer = pixels.buffer.slice(0);
    worker.postMessage(
      { type: "compute", imageData: buffer, width, height },
      { transfer: [buffer] } as unknown as WindowPostMessageOptions
    );
  }, []);

  return { scopeData, compute };
}
