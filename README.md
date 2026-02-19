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

3. Configura en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase)
   - `WATCHMODE_API_KEY` (https://api.watchmode.com/requestApiKey)
   - Opcional: `STREAMING_AVAILABILITY_API_KEY` o `RAPIDAPI_KEY` para fallback

4. Crea un proyecto en Supabase y aplica las migraciones:

```bash
# En Supabase Dashboard: SQL Editor, o con Supabase CLI:
supabase db push
# O ejecuta manualmente los archivos en supabase/migrations/
```

5. En Supabase Dashboard > Authentication > Providers: activa Google y Email. Añade la URL de redirección (ej. `http://localhost:3000/auth/callback`).

6. Arranca el servidor:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Deploy en Vercel

- Conecta el repo a Vercel y configura las mismas variables de entorno.
- Añade en Supabase Auth > URL Configuration la URL de producción (ej. `https://tu-app.vercel.app/auth/callback`).

## Estructura

- `src/app` – Rutas y páginas (App Router)
- `src/components` – Componentes reutilizables
- `src/lib` – Supabase, streaming API unificada
- `src/types` – Tipos TypeScript
- `supabase/migrations` – SQL para profiles, lists, likes, user_providers

## LG TV

- **Hosted Web App**: Carpeta `lg-tv-hosted` con `appinfo.json` e `index.html` que redirige a `https://TU_APP.vercel.app/tv`.
- **Modo TV** (`/tv`): Layout con safe areas (márgenes 5% y `env(safe-area-inset-*)`). Para navegación con mando a distancia se puede integrar `@noriginmedia/norigin-spatial-navigation` en un cliente que envuelva el contenido de `/tv`.
