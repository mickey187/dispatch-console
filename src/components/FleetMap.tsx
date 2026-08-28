"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import { driverColor } from "@/lib/api";
import { decodePolyline } from "@/lib/polyline";
import type { Risk, Snapshot, StopState } from "@/lib/types";

const CHICAGO: [number, number] = [41.86, -87.63];

const RISK_FILL: Record<Risk, string> = {
  ok: "#10b981",
  at_risk: "#f59e0b",
  breached: "#dc2626",
  done: "#6b7280",
};

function tierRing(tier: string | null): { color: string; weight: number; radius: number } {
  if (tier === "vip") return { color: "#7c3aed", weight: 3, radius: 9 };
  if (tier === "high") return { color: "#2563eb", weight: 2, radius: 8 };
  return { color: "#334155", weight: 1, radius: 6 };
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function driverIcon(color: string, label: string, moving: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:${color};color:#fff;border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;
      font:700 12px system-ui;${moving ? "" : "opacity:.55;"}">${label}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

const depotIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;background:#111827;border:2px solid #fff;
    box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(45deg);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function FleetMap({
  snapshot,
  selectedStopId,
  onSelectStop,
}: {
  snapshot: Snapshot | null;
  selectedStopId: number | null;
  onSelectStop: (id: number) => void;
}) {
  return (
    <MapContainer center={CHICAGO} zoom={11} className="h-full w-full" preferCanvas>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {snapshot?.depot && (
        <Marker position={[snapshot.depot.lat, snapshot.depot.lng]} icon={depotIcon}>
          <Tooltip>{snapshot.depot.name} (depot)</Tooltip>
        </Marker>
      )}

      {snapshot?.routes.map((r) => {
        if (!r.polyline) return null;
        const coords = decodePolyline(r.polyline);
        return (
          <Polyline
            key={`route-${r.id}`}
            positions={coords}
            pathOptions={{ color: driverColor(r.driver_id), weight: 3, opacity: 0.6 }}
          />
        );
      })}

      {snapshot?.stops.map((s: StopState) => {
        const ring = tierRing(s.priority_tier);
        const selected = s.id === selectedStopId;
        return (
          <CircleMarker
            key={`stop-${s.id}`}
            center={[s.lat, s.lng]}
            radius={selected ? ring.radius + 3 : ring.radius}
            pathOptions={{
              color: selected ? "#111827" : ring.color,
              weight: selected ? 3 : ring.weight,
              fillColor: RISK_FILL[s.risk],
              fillOpacity: 0.9,
            }}
            eventHandlers={{ click: () => onSelectStop(s.id) }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong>
                  #{s.sequence_index ?? "—"} {s.customer}
                </strong>
                <div style={{ fontSize: 12, color: "#475569" }}>{s.address}</div>
                <hr style={{ margin: "6px 0" }} />
                <div>Tier: {s.priority_tier}</div>
                <div>Status: {s.status} · risk: {s.risk}</div>
                <div>
                  Window: {fmtTime(s.promised_window_start)}–{fmtTime(s.promised_window_end)}
                </div>
                <div>ETA: {fmtTime(s.projected_arrival)}</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {snapshot?.drivers.map((d) => {
        if (d.position.lat == null || d.position.lng == null) return null;
        return (
          <Marker
            key={`driver-${d.id}`}
            position={[d.position.lat, d.position.lng]}
            icon={driverIcon(driverColor(d.id), d.name.charAt(0), d.position.moving)}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              {d.name} · {d.position.moving ? "en route" : "idle"}
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
