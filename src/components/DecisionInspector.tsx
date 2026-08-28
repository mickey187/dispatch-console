"use client";

import type { DecisionPayload } from "@/lib/types";

function fmt(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
}

/** Slide-over that exposes the full reasoning behind one decision (spec §5: auditable, not a black box). */
export default function DecisionInspector({ decision, onClose }: { decision: DecisionPayload | null; onClose: () => void }) {
  if (!decision) return null;
  const d = decision;
  const inputs = d.inputs ?? {};
  const ev = inputs.event;
  const affected = inputs.affected ?? [];
  const candidates = inputs.candidate_drivers ?? [];

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-[520px] max-w-full overflow-y-auto bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Decision #{d.id}</h2>
            <p className="text-xs text-slate-500">
              {fmt(d.created_at)} · source: <span className="font-medium">{d.decision_source}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="rounded bg-slate-800 px-2 py-1 text-xs font-semibold uppercase text-white">{d.chosen_action}</span>
          {d.escalated && <span className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white">ESCALATED</span>}
        </div>

        {/* What happened */}
        <Section title="What happened">
          <p className="text-sm text-slate-700">
            {ev?.source} · {ev?.type}
            {ev?.delay_minutes ? ` · ${ev.delay_minutes} min` : ""}
            {ev?.customer_sentiment ? " · customer flagged upset" : ""}
          </p>
          {ev?.raw_text && <p className="mt-1 text-sm italic text-slate-500">“{ev.raw_text}”</p>}
        </Section>

        {/* What it weighed */}
        {affected.length > 0 && (
          <Section title="What the agent weighed">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="py-1">Customer</th>
                  <th>Tier</th>
                  <th>Resched.</th>
                  <th>New ETA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {affected.map((a) => (
                  <tr key={a.stop_id} className="border-t border-slate-100">
                    <td className="py-1 pr-2">
                      {a.customer}
                      {a.availability_note && <div className="text-[10px] text-slate-400">{a.availability_note}</div>}
                    </td>
                    <td>{a.tier}</td>
                    <td className="text-center">{a.reschedule_count}</td>
                    <td>{fmt(a.new_eta)}</td>
                    <td>
                      {a.breached ? (
                        <span className="font-semibold text-rose-600">breached</span>
                      ) : a.at_risk ? (
                        <span className="font-semibold text-amber-600">at-risk</span>
                      ) : (
                        <span className="text-slate-400">ok</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {candidates.length > 0 && (
          <Section title="Candidate drivers considered">
            <ul className="space-y-1 text-xs text-slate-600">
              {candidates.map((c) => (
                <li key={c.driver_id} className="flex justify-between">
                  <span>{c.name}</span>
                  <span className="text-slate-400">
                    reliability {c.reliability_score.toFixed(0)} · {c.current_stops} stops
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Reasoning */}
        <Section title="Reasoning">
          <p className="whitespace-pre-wrap text-sm text-slate-700">{d.reasoning}</p>
          {d.escalation_reason && (
            <p className="mt-2 rounded bg-rose-50 p-2 text-sm text-rose-700">{d.escalation_reason}</p>
          )}
        </Section>

        {/* Messages sent */}
        {d.messages_sent && d.messages_sent.length > 0 && (
          <Section title={`Messages sent (${d.messages_sent.length})`}>
            <ul className="space-y-2">
              {d.messages_sent.map((m, i) => (
                <li key={i} className="rounded-md border border-slate-200 p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{m.to ?? "customer"}</span>
                    {m.simulated && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">simulated</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-slate-600">{m.text}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </section>
  );
}
