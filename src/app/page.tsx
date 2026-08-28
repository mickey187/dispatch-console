"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { endShift, getScorecards, getState, postPlan } from "@/lib/api";
import type { FeedItem, Scorecard, Snapshot } from "@/lib/types";
import ScorecardPanel from "@/components/ScorecardPanel";
import ScenarioControls from "@/components/ScenarioControls";
import ExceptionFeed from "@/components/ExceptionFeed";
import EscalationQueue from "@/components/EscalationQueue";
import DecisionInspector from "@/components/DecisionInspector";
import NewOrderPanel from "@/components/NewOrderPanel";

type Tab = "exceptions" | "escalations" | "orders" | "drivers";
const TAB_LABEL: Record<Tab, string> = {
  exceptions: "Feed",
  escalations: "Escalations",
  orders: "Orders",
  drivers: "Drivers",
};

const FleetMap = dynamic(() => import("@/components/FleetMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-slate-400">Loading map…</div>,
});

export default function Console() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [cards, setCards] = useState<Scorecard[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("exceptions");
  const [online, setOnline] = useState(false);
  const [planning, setPlanning] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await getState());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const s = await getState();
        if (alive) {
          setSnapshot(s);
          setOnline(true);
        }
      } catch {
        if (alive) setOnline(false);
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const s = await getScorecards();
        if (alive) setCards(s.drivers);
      } catch {
        /* ignore */
      }
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const replan = useCallback(async () => {
    setPlanning(true);
    try {
      await postPlan();
      setSnapshot(await getState());
    } finally {
      setPlanning(false);
    }
  }, []);

  const counts = useMemo(() => {
    const stops = snapshot?.stops ?? [];
    return {
      total: stops.length,
      breached: stops.filter((s) => s.risk === "breached").length,
      atRisk: stops.filter((s) => s.risk === "at_risk").length,
      done: stops.filter((s) => s.risk === "done").length,
    };
  }, [snapshot]);

  const selectedStop = snapshot?.stops.find((s) => s.id === selectedStopId) ?? null;
  const escalations = snapshot?.escalations ?? [];
  const selectedDecision =
    selectedDecisionId == null
      ? null
      : snapshot?.events?.find((e) => e.decision?.id === selectedDecisionId)?.decision ??
        escalations.find((e) => e.id === selectedDecisionId) ??
        null;

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">Autonomous Dispatch</h1>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              online ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-rose-500"}`} />
            {online ? "live" : "offline"}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>{counts.total} stops</span>
          <span className="text-amber-600">{counts.atRisk} at-risk</span>
          <span className="text-rose-600">{counts.breached} breached</span>
          <button
            onClick={replan}
            disabled={planning}
            className="rounded-md bg-slate-800 px-3 py-1 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {planning ? "Planning…" : "Re-plan shift"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          <FleetMap snapshot={snapshot} selectedStopId={selectedStopId} onSelectStop={setSelectedStopId} />
        </main>

        <aside className="w-[380px] shrink-0 overflow-y-auto border-l border-slate-200 bg-slate-50 p-3">
          {selectedStop && (
            <div className="mb-3 rounded-lg border border-slate-300 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  #{selectedStop.sequence_index ?? "—"} {selectedStop.customer}
                </h2>
                <button className="text-xs text-slate-400 hover:text-slate-600" onClick={() => setSelectedStopId(null)}>
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-500">{selectedStop.address}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                <dt className="text-slate-400">Tier</dt>
                <dd>{selectedStop.priority_tier}</dd>
                <dt className="text-slate-400">Status</dt>
                <dd>
                  {selectedStop.status} · <span className="font-medium">{selectedStop.risk}</span>
                </dd>
                <dt className="text-slate-400">ETA</dt>
                <dd>
                  {selectedStop.projected_arrival
                    ? new Date(selectedStop.projected_arrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </dd>
                <dt className="text-slate-400">Track</dt>
                <dd className="truncate">
                  {selectedStop.tracking_token ? (
                    <a
                      className="text-blue-600 hover:underline"
                      href={`http://localhost:3001/track/${selectedStop.tracking_token}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      open portal ↗
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </dl>
            </div>
          )}

          <div className="mb-3 flex gap-1 rounded-lg bg-slate-200 p-1">
            {(["exceptions", "escalations", "orders", "drivers"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-1.5 py-1 text-xs font-semibold ${
                  tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
                }`}
              >
                {TAB_LABEL[t]}
                {t === "escalations" && escalations.length > 0 && (
                  <span className="ml-1 rounded-full bg-rose-600 px-1.5 text-[10px] text-white">{escalations.length}</span>
                )}
              </button>
            ))}
          </div>

          {tab === "exceptions" && (
            <div className="space-y-3">
              <ScenarioControls snapshot={snapshot} onInjected={refresh} />
              <ExceptionFeed
                events={(snapshot?.events ?? []) as FeedItem[]}
                selectedId={selectedDecisionId}
                onSelect={(item) => {
                  setSelectedDecisionId(item.decision?.id ?? null);
                  if (item.stop_id) setSelectedStopId(item.stop_id);
                }}
              />
            </div>
          )}

          {tab === "escalations" && (
            <EscalationQueue escalations={escalations} onSelect={(id) => setSelectedDecisionId(id)} />
          )}

          {tab === "orders" && <NewOrderPanel onSubmitted={refresh} />}

          {tab === "drivers" && (
            <div className="space-y-3">
              <button
                onClick={async () => {
                  await endShift();
                  setCards((await getScorecards()).drivers);
                }}
                className="w-full rounded-md bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                End shift &amp; recompute scores
              </button>
              <ScorecardPanel cards={cards} />
            </div>
          )}
        </aside>
      </div>

      <DecisionInspector decision={selectedDecision} onClose={() => setSelectedDecisionId(null)} />
    </div>
  );
}
