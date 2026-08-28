import type { OrderRow, Scorecard, Snapshot } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// Public base URL of the customer portal (for "open portal" tracking links).
export const PORTAL_BASE =
  process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const getState = () => getJson<Snapshot>("/state");
export const getScorecards = () => getJson<{ drivers: Scorecard[] }>("/drivers/scorecards");
export const postPlan = () => postJson("/plan");
export const endShift = () => postJson<{ ok: boolean; updated: unknown[] }>("/shift/end");

// ── Scenario controls & order intake (wired in later tasks) ──
export const injectScenario = (payload: {
  type: "delay" | "breakdown" | "failed_delivery";
  stop_id: number;
  delay_minutes?: number;
  note?: string;
}) => postJson("/scenario", payload);

export const submitOrder = (payload: {
  customer_name: string;
  address?: string;
  lat?: number;
  lng?: number;
  window_start?: string;
  window_end?: string;
}) =>
  postJson<{
    status: string;
    order_id: number;
    reasoning: string;
    source: string;
    assigned_driver: string | null;
    tracking_token: string | null;
  }>("/orders", payload);

export const getOrders = () => getJson<{ orders: OrderRow[] }>("/orders");

// Proactive drift detection (spec §8) — runs every 15 min in production.
export const simulateDrift = () => postJson<{ ok: boolean; driver: string | null }>("/drift/simulate");
export const runDrift = () => postJson<{ refreshed: boolean; acted_on: string[] }>("/drift/run");

// Driver colour palette keyed by driver id (stable across polls).
const PALETTE = ["#2563eb", "#16a34a", "#db2777", "#d97706", "#7c3aed", "#0891b2"];
export const driverColor = (id: number) => PALETTE[(id - 1) % PALETTE.length];
