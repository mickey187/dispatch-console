export type Risk = "ok" | "at_risk" | "breached" | "done";

export interface Position {
  lat: number | null;
  lng: number | null;
  moving: boolean;
  departed: boolean;
  traveled_km: number;
  total_km: number;
}

export interface DriverState {
  id: number;
  name: string;
  status: string;
  vehicle_type: string;
  reliability_score: number;
  on_time_rate: number;
  avg_delay_minutes: number;
  exception_count: number;
  route_id: number | null;
  position: Position;
  next_stop_id: number | null;
  stop_count: number;
}

export interface RouteState {
  id: number;
  driver_id: number;
  polyline: string | null;
  departed_at: string | null;
}

export interface StopState {
  id: number;
  customer: string | null;
  priority_tier: string | null;
  address: string;
  lat: number;
  lng: number;
  status: string;
  risk: Risk;
  driver_id: number | null;
  sequence_index: number | null;
  promised_window_start: string | null;
  promised_window_end: string | null;
  projected_arrival: string | null;
  tracking_token: string | null;
}

export interface Snapshot {
  server_time: string;
  depot: { id: number; name: string; lat: number; lng: number } | null;
  drivers: DriverState[];
  routes: RouteState[];
  stops: StopState[];
  events?: FeedItem[];
  escalations?: Escalation[];
}

export interface TrendPoint {
  shift_date: string;
  on_time_count: number;
  late_count: number;
  exception_count: number;
  avg_delay_minutes: number;
  total_stops: number;
  on_time_rate: number;
}

export interface Scorecard {
  id: number;
  name: string;
  vehicle_type: string;
  status: string;
  reliability_score: number;
  on_time_rate: number;
  avg_delay_minutes: number;
  exception_count: number;
  total_deliveries: number;
  trend: TrendPoint[];
}

// Exception feed / decision inspector.
export interface DecisionMessage {
  stop_id: number;
  to: string | null;
  chat_id: string | null;
  text: string;
  simulated: boolean;
}

export interface AffectedRow {
  stop_id: number;
  sequence_index: number | null;
  customer: string | null;
  tier: string | null;
  reschedule_count: number;
  availability_note: string | null;
  window_end: string | null;
  new_eta: string | null;
  breached: boolean;
  at_risk: boolean;
  slack_minutes: number | null;
}

export interface CandidateDriver {
  driver_id: number;
  name: string;
  reliability_score: number;
  current_stops: number;
}

export interface DecisionInputs {
  event?: { type: string; delay_minutes: number; raw_text: string | null; source: string; customer_sentiment?: boolean };
  affected?: AffectedRow[];
  candidate_drivers?: CandidateDriver[];
  decision_source?: string;
}

export interface DecisionPayload {
  id: number;
  type: "decision";
  event_id: number | null;
  chosen_action: string;
  reasoning: string;
  affected_stop_ids: number[] | null;
  messages_sent: DecisionMessage[] | null;
  escalated: boolean;
  escalation_reason: string | null;
  decision_source: string;
  inputs: DecisionInputs | null;
  created_at: string | null;
}

export interface FeedItem {
  id: number;
  type: "event";
  source: string;
  raw_text: string | null;
  parsed_type: string | null;
  delay_minutes: number | null;
  stop_id: number | null;
  customer_sentiment: boolean;
  created_at: string | null;
  decision: DecisionPayload | null;
}

export interface Escalation extends DecisionPayload {
  stops: { id: number; customer: string | null; tier: string | null }[];
}

export interface OrderRow {
  id: number;
  customer: string | null;
  address: string;
  status: string;
  assigned_driver: string | null;
  rejection_reason: string | null;
  reasoning: string | null;
  created_at: string | null;
}
