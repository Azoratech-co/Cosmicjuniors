"use client";
import { useEffect, useState } from "react";
import { getRouteSnapshot, type JourneyData } from "@/lib/mars-journeys";

// Only immutable, dated source data is cached. Viewer/camera state stays local.
const cache = new Map<string, Promise<JourneyData>>();
export function useMarsJourney(roverId: string) {
  const [result, setResult] = useState<{ id: string; data?: JourneyData; failed?: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const file = getRouteSnapshot(roverId)?.file;
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let request = cache.get(file);
    if (!request) {
      request = fetch(file).then(async (response) => {
        if (!response.ok) throw new Error("Route snapshot unavailable");
        const data = await response.json() as JourneyData;
        if (data.schemaVersion !== 1 || data.roverId !== roverId || !data.stops?.length || !data.segments?.length) throw new Error("Invalid route snapshot");
        return data;
      }).catch((error) => { cache.delete(file); throw error; });
      cache.set(file, request);
    }
    request.then((data) => { if (!cancelled) setResult({ id: roverId, data }); })
      .catch(() => { if (!cancelled) setResult({ id: roverId, failed: true }); });
    return () => { cancelled = true; };
  }, [file, roverId, attempt]);
  const current = result?.id === roverId ? result : null;
  return { data: file ? current?.data : undefined, loading: !!file && !current, failed: !!file && !!current?.failed,
    retry: () => { setResult(null); setAttempt((value) => value + 1); } };
}
