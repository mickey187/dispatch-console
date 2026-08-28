"use client";

import type { Escalation } from "@/lib/types";

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
}

export default function EscalationQueue({
  escalations,
  onSelect,
}: {
  escalations: Escalation[];
  onSelect: (decisionId: number) => void;
}) {
  if (escalations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
        Nothing escalated. The agent is handling everything autonomously.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {escalations.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelect(e.id)}
          className="block w-full rounded-lg border border-rose-200 bg-rose-50 p-3 text-left shadow-sm hover:border-rose-400"
        >
          <div className="flex items-center justify-between">
            <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
              needs human
            </span>
            <span className="text-[10px] text-rose-400">{fmt(e.created_at)}</span>
          </div>
          <p className="mt-1 text-sm text-rose-800">{e.escalation_reason}</p>
          {e.stops.length > 0 && (
            <p className="mt-1 text-[11px] text-rose-500">
              {e.stops.map((s) => `${s.customer} (${s.tier})`).join(", ")}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
