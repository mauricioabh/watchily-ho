# Migraciones Supabase - Guía

## Origen de las desincronizaciones

Las diferencias entre historial local y remoto suelen deberse a:

1. **Ejecutar SQL en el Dashboard** en lugar de usar migraciones locales.
2. **Migraciones creadas con otra herramienta** o en otro entorno.
3. **Proyecto no enlazado** o enlazado a otro proyecto.

Por eso: **siempre usar migraciones locales + `supabase db push`**.

## Flujo normal

1. Crear archivo en `supabase/migrations/`:
   ```
   YYYYMMDDHHMMSS_descripcion.sql
   ```

2. Escribir el SQL (CREATE, ALTER, etc.).

3. Aplicar:
   ```bash
   supabase db push
   ```

4. Actualizar `docs/schema.md` y, si aplica, `src/types/database.ts`.

## Proyecto enlazado

```bash
supabase link --project-ref jehowbdfqhteznmbyecu
```

## Historial desincronizado

Si `supabase migration list` muestra versiones solo en Local o solo en Remote:

1. **Remote tiene versiones que no existen localmente** (creadas en Dashboard u otro flujo):
   ```bash
   supabase migration repair --status reverted <version1> <version2>
   ```

2. **Registrar migraciones locales como ya aplicadas** (esquema ya existe):
   ```bash
   supabase migration repair --status applied <version1> <version2>
   ```
   Usar solo el número: `20250219000001`, no `20250219000001_profiles_and_providers`.

3. **Aplicar pendientes**:
   ```bash
   supabase db push
   ```

## Fallo de autenticación en `db push`

- `supabase login` para refrescar credenciales.
- O ejecutar el SQL manualmente en: https://supabase.com/dashboard/project/jehowbdfqhteznmbyecu/sql/new
