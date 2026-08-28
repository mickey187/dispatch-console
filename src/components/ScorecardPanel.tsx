"use client";

import { driverColor } from "@/lib/api";
import type { Scorecard } from "@/lib/types";

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const max = 100;
  return (
    <div className="flex h-8 items-end gap-0.5">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-2 rounded-sm bg-slate-300"
          style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
          title={`${v}%`}
        />
      ))}
    </div>
  );
}

export default function ScorecardPanel({ cards }: { cards: Scorecard[] }) {
  return (
    <div className="space-y-3">
      {cards.map((c) => (
        <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ background: driverColor(c.id) }}
              />
              <span className="font-semibold text-slate-800">{c.name}</span>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {c.vehicle_type}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-slate-800">{c.reliability_score.toFixed(0)}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">reliability</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">{c.on_time_rate.toFixed(0)}%</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">on-time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">{c.avg_delay_minutes.toFixed(1)}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">avg delay</div>
            </div>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">on-time trend</div>
              <Sparkline values={c.trend.map((t) => t.on_time_rate)} />
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{c.exception_count} exceptions</div>
              <div>{c.total_deliveries} delivered</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
