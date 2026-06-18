# Watchily

App tipo JustWatch: descubre dónde ver películas y series en streaming.

- **Web**: Next.js 14+ (App Router), TypeScript, Tailwind, Shadcn UI
- **Backend**: Supabase (Auth + Postgres)
- **APIs**: Watchmode (primaria) + Streaming Availability (fallback)

## Setup

1. Clona y instala dependencias:

```bash
npm install
```

2. Copia las variables de entorno:

```bash
cp .env.local.example .env.local
```

3. Configura en `.env.local` (claves actuales de Supabase: Publishable + Secret, no legacy):
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Dashboard → API Keys → publishable)
   - `SUPABASE_SECRET_KEY` (opcional; solo si usas `createAdminClient()` en servidor; crear en API Keys → Create new → Secret)
   - `WATCHMODE_API_KEY` (https://api.watchmode.com/requestApiKey)
   - Opcional: `STREAMING_AVAILABILITY_API_KEY` para fallback

4. Crea un proyecto en Supabase y aplica las migraciones:

```bash
# En Supabase Dashboard: SQL Editor, o con Supabase CLI:
supabase db push
# O ejecuta manualmente los archivos en supabase/migrations/
```

5. En Supabase Dashboard > Authentication > Providers: activa Google y Email. En **URL Configuration** > Redirect URLs añade:
   - Web: `http://localhost:3000/auth/callback` y `https://tu-app.vercel.app/auth/callback`
   - Mobile (proxy): `https://tu-app.vercel.app/auth/mobile-callback` o `https://tu-app.vercel.app/auth/mobile-callback*`

6. Arranca el servidor:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Las rutas API usan la sesión del usuario (cookies) con la clave Publishable; la clave Secret solo se usa en servidor con `createAdminClient()` cuando hace falta bypass RLS (p. ej. jobs internos). No exponer la Secret key al cliente.

## Deploy en Vercel

1. En [Vercel](https://vercel.com/new) importa el repo `mauricioabh/watchily-ho`. Configura las mismas variables que en `.env.local` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY si aplica, y opcionalmente las API keys de streaming).
2. Añade en **Supabase** > Authentication > URL Configuration la URL de producción (ej. `https://tu-app.vercel.app/auth/callback`).
3. Tras el primer deploy, reemplaza en `lg-tv-hosted/index.html` la URL `YOUR_APP.vercel.app` por tu URL de Vercel, y en `apps/mobile/.env` define `EXPO_PUBLIC_API_URL` con esa misma URL.

## Estructura

- `src/app` – Rutas y páginas (App Router)
- `src/components` – Componentes reutilizables
- `src/lib` – Supabase, streaming API unificada
- `src/types` – Tipos TypeScript
- `supabase/migrations` – SQL (profiles, user_providers, lists, list_items, likes, RLS)
- `docs/schema.md` – Documentación del schema de la base de datos

## LG TV

- **Hosted Web App**: Carpeta `lg-tv-hosted` con `appinfo.json` e `index.html` que redirige a `https://TU_APP.vercel.app/tv`.
- **Modo TV** (`/tv`): Layout con safe areas (márgenes 5% y `env(safe-area-inset-*)`). Para navegación con mando a distancia se puede integrar `@noriginmedia/norigin-spatial-navigation` en un cliente que envuelva el contenido de `/tv`.

## Production practices

- **Pre-commit:** Husky runs lint-staged (`eslint --fix`, `prettier --write`) on staged `*.ts` / `*.tsx`.
- **API contracts:** Zod schemas for priority `/api/*` routes → OpenAPI via `@asteasolutions/zod-to-openapi` → Scalar UI at `/api-docs` (spec JSON at `/api/openapi`).
- **Observability:** `@sentry/nextjs` on web/TV (`platform=web|webos` tags); `@sentry/react-native` on Expo (`platform=mobile`). Set `SENTRY_DSN` in `.env.local` and `EXPO_PUBLIC_SENTRY_DSN` in `apps/mobile/.env`. Auth tokens and emails are scrubbed from breadcrumbs. Dev probe: `GET /api/debug/sentry`; verify with `npm run test:observability`.
- **Async jobs:** Inngest refreshes watchlist title availability into `title_availability_cache` on add-to-list and daily cron. Supabase Queues alternative: [`docs/supabase-queues-alternative.md`](docs/supabase-queues-alternative.md). Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`.
- **Rate limiting:** Upstash sliding window (20 req/min/user) on `GET /api/titles/search`. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Verify with `npm run test:rate-limit`.
- **CI:** Supabase RLS isolation tests (`.github/workflows/rls.yml`); CodeQL; Playwright landing smoke on PRs (`npm run test:e2e`, workflow `e2e.yml`).
- **RLS tests:** Row-level security policies in `supabase/migrations/` are verified with Vitest against local Supabase (`supabase start` then `npm run test:rls`). Covers profiles, lists, likes, and `pairing_codes` isolation. CI runs `.github/workflows/rls.yml` on PRs.
- **Security scanning:** CodeQL (`.github/workflows/codeql.yml`); Dependabot for npm and GitHub Actions.
