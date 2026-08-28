# Dispatcher Console (Next.js)

The autonomous dispatcher's console: live fleet map, exception feed, decision inspector, escalation queue, scenario controls, live-order panel, and driver scorecards.

## Setup

```bash
npm install
npm run dev -- --port 3000     # http://localhost:3000
```

Requires the API running at `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_URL` in `.env.local`).

## What's here

- **Live map** (Leaflet/OSM): driver markers move in real time, route polylines, stops colour-coded by risk (green / amber / red), depot.
- **Feed tab**: chronological exception feed; each event shows the agent's decision (action, reasoning, messages). **Scenario controls** inject delay / breakdown / failed-delivery and a **proactive-drift** demo. Click any item to open the **decision inspector** (what happened, what the agent weighed, candidate drivers, reasoning, exact messages sent).
- **Escalations tab**: situations the agent refused to resolve alone.
- **Orders tab**: submit a mid-shift order and watch it get slotted or rejected; order history.
- **Drivers tab**: reliability scorecards with trend; "End shift" recomputes scores.

Polls `/api/state` every 2s and `/api/drivers/scorecards` every 10s.

## Config

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```
