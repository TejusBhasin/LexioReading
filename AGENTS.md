# Agent notes

- Frontend-only Vite + React app backed by the hosted Base44 BaaS. `base44/` holds entity/function definitions deployed via the Base44 CLI; it is not a local server and the dev server refuses to serve it.
- Run: `docker compose -f docker-compose.base44.yml up -d` (port 3000 → Vite 5173). `node_modules` lives in a named volume; `npm ci` runs on container start.
- `@base44/vite-plugin` proxies `/api` to `VITE_BASE44_APP_BASE_URL` and the SDK reads `VITE_BASE44_APP_ID`. Both come from `/run/base44/app.env`. Without them the UI renders but all data/auth calls fail (log line: "No Base44 backend configured").
- Vite env vars are read at dev-server start: restart `web` after changing them.
- Verify: `curl localhost:3000` returns HTML with `/@vite/client`; `npm run lint` inside the container for lint.
