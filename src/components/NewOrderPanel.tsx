"use client";

import { useCallback, useEffect, useState } from "react";
import { PORTAL_BASE, getOrders, submitOrder } from "@/lib/api";
import type { OrderRow } from "@/lib/types";

// Preset Chicago drop-off points (not in the seed) for one-click demoing.
const PRESETS: { label: string; lat: number; lng: number; address: string }[] = [
  { label: "River North", lat: 41.8925, lng: -87.634, address: "321 W Chicago Ave" },
  { label: "Pilsen", lat: 41.857, lng: -87.656, address: "1800 S Halsted St" },
  { label: "Bronzeville", lat: 41.813, lng: -87.621, address: "400 E 35th St" },
  { label: "Andersonville", lat: 41.977, lng: -87.669, address: "5200 N Clark St" },
  { label: "West Town", lat: 41.896, lng: -87.672, address: "1900 W Chicago Ave" },
];

export default function NewOrderPanel({ onSubmitted }: { onSubmitted: () => void }) {
  const [name, setName] = useState("Acme Restaurant");
  const [preset, setPreset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ status: string; text: string; token: string | null } | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  const loadOrders = useCallback(async () => {
    try {
      setOrders((await getOrders()).orders);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function submit() {
    setBusy(true);
    setResult(null);
    const p = PRESETS[preset];
    try {
      const r = await submitOrder({ customer_name: name, lat: p.lat, lng: p.lng, address: p.address });
      setResult({
        status: r.status,
        text:
          r.status === "assigned"
            ? `Slotted into ${r.assigned_driver}'s route. ${r.reasoning}`
            : `Queued/rejected. ${r.reasoning}`,
        token: r.tracking_token,
      });
      onSubmitted();
      loadOrders();
    } catch (e) {
      setResult({ status: "error", text: String(e), token: null });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700">New mid-shift order</h3>

        <label className="block text-xs text-slate-500">
          Customer
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block text-xs text-slate-500">
          Drop-off
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            value={preset}
            onChange={(e) => setPreset(Number(e.target.value))}
          >
            {PRESETS.map((p, i) => (
              <option key={p.label} value={i}>
                {p.label} — {p.address}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={submit}
          disabled={busy || !name.trim()}
          className="w-full rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "Evaluating fleet…" : "Submit order — watch the agent slot it in"}
        </button>

        {result && (
          <div
            className={`rounded-md p-2 text-xs ${
              result.status === "assigned"
                ? "bg-emerald-50 text-emerald-800"
                : result.status === "error"
                  ? "bg-rose-50 text-rose-700"
                  : "bg-amber-50 text-amber-800"
            }`}
          >
            <p>{result.text}</p>
            {result.token && (
              <a
                className="mt-1 inline-block font-medium text-blue-600 hover:underline"
                href={`${PORTAL_BASE}/track/${result.token}`}
                target="_blank"
                rel="noreferrer"
              >
                open customer tracking ↗
              </a>
            )}
          </div>
        )}
      </div>

      {orders.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Order history</h4>
          <ul className="space-y-1 text-xs">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between">
                <span className="truncate">{o.customer ?? o.address}</span>
                <span
                  className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    o.status === "assigned"
                      ? "bg-emerald-100 text-emerald-700"
                      : o.status === "rejected"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {o.status}
                  {o.assigned_driver ? ` · ${o.assigned_driver}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
