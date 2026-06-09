# AirPak Express — Admin Portal

Admin and operations portal for AirPak Express (a global shipping/logistics platform).

## Stack

- **Build:** Vite 6
- **UI:** React 18 + TypeScript + Tailwind CSS v3
- **Routing:** React Router 6
- **State:** Zustand, TanStack Query
- **Auth & DB:** Supabase (`@supabase/supabase-js`)
- **Charts:** Recharts
- **Maps:** MapLibre GL
- **PDF / Barcode / QR:** jsPDF, jsbarcode, qrcode
- **AI features:** Monaco editor, Framer Motion

## Local development

```bash
npm install
npm run dev          # Vite dev server
npm run build        # production build to ./dist
npm run preview      # serve the built bundle locally
```

## Environment variables

Create a `.env` file in the project root with the following:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

Both are required for auth and data calls. Without them the app boots but Supabase-backed screens will fail.

## Project layout

```
src/
  components/      shared UI + layout
  contexts/        AuthContext, ThemeContext
  features/        domain features (shipments, customers, etc.)
  lib/             supabase client, API helpers, utilities
  pages/           top-level pages (lazy-loaded)
  services/        service layer
  types/           shared types
  hooks/           custom React hooks
supabase/          Supabase SQL schema + edge functions
public/            static assets
```

## Deployment

Built as a static SPA in `dist/`. For SPAs with client-side routing, host it behind a service that rewrites all paths to `/index.html` (Vercel and Netlify do this automatically; on other hosts, configure a catch-all rewrite).

## License

Proprietary — internal AirPak Express tool.
