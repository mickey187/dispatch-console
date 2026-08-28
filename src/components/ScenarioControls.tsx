"use client";

import { useMemo, useState } from "react";
import { injectScenario, runDrift, simulateDrift } from "@/lib/api";
import type { Snapshot } from "@/lib/types";

type ScenarioType = "delay" | "breakdown" | "failed_delivery";

export default function ScenarioControls({
  snapshot,
  onInjected,
}: {
  snapshot: Snapshot | null;
  onInjected: () => void;
}) {
  const stops = useMemo(
    () =>
      (snapshot?.stops ?? [])
        .filter((s) => s.driver_id && s.status !== "delivered" && s.status !== "failed")
        .sort((a, b) => (a.driver_id ?? 0) - (b.driver_id ?? 0) || (a.sequence_index ?? 0) - (b.sequence_index ?? 0)),
    [snapshot],
  );
  const driverName = useMemo(() => {
    const m = new Map<number, string>();
    snapshot?.drivers.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [snapshot]);

  const [stopId, setStopId] = useState<number | "">("");
  const [type, setType] = useState<ScenarioType>("delay");
  const [delay, setDelay] = useState(45);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [driftBusy, setDriftBusy] = useState(false);
  const [driftResult, setDriftResult] = useState<string | null>(null);

  const effectiveStop = stopId === "" ? stops[0]?.id : stopId;

  async function driftDemo() {
    setDriftBusy(true);
    setDriftResult(null);
    try {
      const sim = await simulateDrift();
      const run = await runDrift();
      setDriftResult(
        run.acted_on.length > 0
          ? `Agent noticed ${run.acted_on.join(", ")} drifting and acted — no driver reported it.`
          : sim.driver
            ? `Slowed ${sim.driver}; no breach yet.`
            : "No active driver to slow.",
      );
      onInjected();
    } catch (e) {
      setDriftResult(`Error: ${String(e)}`);
    } finally {
      setDriftBusy(false);
    }
  }

  async function submit() {
    if (!effectiveStop) return;
    setBusy(true);
    setResult(null);
    try {
      const r = (await injectScenario({
        type,
        stop_id: effectiveStop,
        delay_minutes: type === "delay" ? delay : undefined,
      })) as { chosen_action: string; escalated: boolean; decision_source: string };
      setResult(`Agent decided: ${r.chosen_action}${r.escalated ? " + escalated" : ""} (${r.decision_source})`);
      onInjected();
    } catch (e) {
      setResult(`Error: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">Inject scenario</h3>

      <label className="block text-xs text-slate-500">
        Target stop
        <select
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          value={stopId}
          onChange={(e) => setStopId(e.target.value ? Number(e.target.value) : "")}
        >
          {stops.map((s) => (
            <option key={s.id} value={s.id}>
              #{s.sequence_index} {s.customer} · {driverName.get(s.driver_id ?? -1) ?? "?"}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2">
        {(["delay", "breakdown", "failed_delivery"] as ScenarioType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium ${
              type === t ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t === "failed_delivery" ? "failed" : t}
          </button>
        ))}
      </div>

      {type === "delay" && (
        <label className="block text-xs text-slate-500">
          Delay minutes: <span className="font-semibold text-slate-700">{delay}</span>
          <input
            type="range"
            min={10}
            max={180}
            step={5}
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
      )}

      <button
        onClick={submit}
        disabled={busy || stops.length === 0}
        className="w-full rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {busy ? "Running cascade…" : "Inject & watch the agent respond"}
      </button>

      {result && <p className="text-xs text-slate-600">{result}</p>}

      <div className="border-t border-slate-100 pt-3">
        <h3 className="text-sm font-semibold text-slate-700">Proactive drift detection</h3>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Runs every 15 min in production. Simulate an unreported slowdown and let the agent notice on its own.
        </p>
        <button
          onClick={driftDemo}
          disabled={driftBusy}
          className="mt-2 w-full rounded-md bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {driftBusy ? "Checking…" : "Simulate drift & run detection"}
        </button>
        {driftResult && <p className="mt-1 text-xs text-slate-600">{driftResult}</p>}
      </div>
    </div>
  );
}
