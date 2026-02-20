# Schema de base de datos (Supabase / Postgres)

Proyecto: **Watchily** — Project ID `jehowbdfqhteznmbyecu`.

Las definiciones SQL viven en `supabase/migrations/`. Este documento describe tablas, relaciones y RLS.

---

## Tablas

### `public.profiles`

Perfil extendido del usuario (vinculado a `auth.users`).

| Columna       | Tipo      | Nullable | Default | Descripción          |
|---------------|-----------|----------|---------|----------------------|
| id            | uuid      | NO       | —       | PK, FK → auth.users  |
| email         | text      | YES      | —       |                      |
| display_name  | text      | YES      | —       |                      |
| avatar_url    | text      | YES      | —       |                      |
| country_code  | text      | YES      | 'US'    |                      |
| created_at    | timestamptz | YES    | now()   |                      |
| updated_at    | timestamptz | YES    | now()   |                      |

- **RLS:** activado.
- **Políticas:** usuarios pueden SELECT/UPDATE/INSERT solo su propio perfil (`auth.uid() = id`).
- **Trigger:** al insertar en `auth.users`, `handle_new_user()` crea la fila en `profiles`.

---

### `public.user_providers`

Plataformas de streaming a las que el usuario está suscrito.

| Columna     | Tipo      | Nullable | Default        | Descripción   |
|-------------|-----------|----------|----------------|---------------|
| id          | uuid      | NO       | gen_random_uuid() | PK        |
| user_id     | uuid      | NO       | —              | FK → profiles |
| provider_id | text      | NO       | —              |               |
| created_at  | timestamptz | YES    | now()          |               |

- **Único:** `(user_id, provider_id)`.
- **RLS:** activado. Usuarios solo gestionan sus propios registros (`auth.uid() = user_id`).

---

### `public.lists`

Listas creadas por el usuario (ej. “Favoritas”, “Por ver”).

| Columna    | Tipo      | Nullable | Default        | Descripción   |
|------------|-----------|----------|----------------|---------------|
| id         | uuid      | NO       | gen_random_uuid() | PK        |
| user_id    | uuid      | NO       | —              | FK → profiles |
| name       | text      | NO       | —              |               |
| is_public  | boolean   | YES      | false          |               |
| created_at | timestamptz | YES    | now()          |               |
| updated_at | timestamptz | YES    | now()          |               |

- **RLS:** activado.
- **Políticas:** CRUD propio por usuario; listas con `is_public = true` son legibles por todos.

---

### `public.list_items`

Títulos dentro de una lista (`title_id` viene de Watchmode/Streaming Availability).

| Columna    | Tipo      | Nullable | Default        | Descripción   |
|------------|-----------|----------|----------------|---------------|
| id         | uuid      | NO       | gen_random_uuid() | PK        |
| list_id    | uuid      | NO       | —              | FK → lists    |
| title_id   | text      | NO       | —              |               |
| title_type | text      | NO       | —              | 'movie' \| 'series' |
| added_at   | timestamptz | YES    | now()          |               |

- **Único:** `(list_id, title_id)`.
- **RLS:** activado. Solo el dueño de la lista gestiona items; items de listas públicas son solo lectura para el resto.

---

### `public.likes`

Likes de usuario por título.

| Columna    | Tipo      | Nullable | Default | Descripción   |
|------------|-----------|----------|---------|---------------|
| user_id    | uuid      | NO       | —       | FK → profiles, PK (compuesta) |
| title_id   | text      | NO       | —       | PK (compuesta) |
| title_type | text      | NO       | —       | 'movie' \| 'series' |
| created_at | timestamptz | YES    | now()   |               |

- **PK:** `(user_id, title_id)`.
- **RLS:** activado. Usuarios solo gestionan sus propios likes (`auth.uid() = user_id`).

---

## Migraciones

- `20250219000001_profiles_and_providers.sql` — profiles, user_providers, trigger `handle_new_user`.
- `20250219000002_lists_and_likes.sql` — lists, list_items, likes.

---

## Tipos TypeScript

Generados a partir del proyecto Supabase y guardados en `src/types/database.ts`. Regenerar con:

```bash
npx supabase gen types typescript --project-id jehowbdfqhteznmbyecu > src/types/database.ts
```

O desde el Supabase MCP: `generate_typescript_types(project_id)`.
