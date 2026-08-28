"use client";

import type { FeedItem } from "@/lib/types";

const ACTION_STYLE: Record<string, string> = {
  reassign: "bg-blue-100 text-blue-700",
  absorb: "bg-slate-200 text-slate-700",
  escalate: "bg-rose-100 text-rose-700",
  reject: "bg-rose-100 text-rose-700",
  reschedule: "bg-amber-100 text-amber-700",
  insert_order: "bg-emerald-100 text-emerald-700",
};

const SOURCE_STYLE: Record<string, string> = {
  telegram: "bg-sky-100 text-sky-700",
  scenario: "bg-amber-100 text-amber-700",
  drift: "bg-violet-100 text-violet-700",
  customer: "bg-emerald-100 text-emerald-700",
  system: "bg-slate-100 text-slate-600",
};

function time(iso?: string | null) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
}

export default function ExceptionFeed({
  events,
  selectedId,
  onSelect,
}: {
  events: FeedItem[];
  selectedId: number | null;
  onSelect: (item: FeedItem) => void;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
        No exceptions yet. Inject a scenario to see the agent respond.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((ev) => {
        const d = ev.decision;
        const active = d?.id === selectedId;
        return (
          <button
            key={`ev-${ev.id}`}
            onClick={() => onSelect(ev)}
            className={`block w-full rounded-lg border p-2.5 text-left shadow-sm transition ${
              active ? "border-slate-800 bg-white" : "border-slate-200 bg-white hover:border-slate-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${SOURCE_STYLE[ev.source ?? "system"] ?? "bg-slate-100"}`}>
                {ev.source}
              </span>
              <span className="text-[10px] text-slate-400">{time(ev.created_at)}</span>
            </div>

            <div className="mt-1 text-xs text-slate-600">
              <span className="font-medium">{ev.parsed_type}</span>
              {ev.delay_minutes ? ` · ${ev.delay_minutes}m` : ""}
              {ev.customer_sentiment ? " · customer upset" : ""}
            </div>
            {ev.raw_text && <p className="mt-0.5 line-clamp-2 text-[11px] italic text-slate-400">“{ev.raw_text}”</p>}

            {d && (
              <div className="mt-2 border-t border-slate-100 pt-2">
                <div className="flex items-center gap-1.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${ACTION_STYLE[d.chosen_action ?? ""] ?? "bg-slate-100"}`}>
                    {d.chosen_action}
                  </span>
                  {d.escalated && <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">ESCALATED</span>}
                  <span className="ml-auto text-[10px] text-slate-400">{d.decision_source}</span>
                </div>
                <p className="mt-1 line-clamp-3 text-[11px] text-slate-600">{d.reasoning}</p>
                {d.messages_sent && d.messages_sent.length > 0 && (
                  <p className="mt-1 text-[10px] text-slate-400">{d.messages_sent.length} customer message(s) sent</p>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
