# URLs de streaming en la app TV (webOS)

## Comportamiento actual

Los enlaces a Netflix, Disney+, HBO Max, etc. en el detalle de películas son **URLs web** (ej: `https://www.netflix.com/title/123456`). Al pulsar en ellos:

- **En navegador de escritorio/móvil**: se abre la web del proveedor en una nueva pestaña.
- **En webOS (TV)**: el navegador de la TV abre esa URL. Normalmente **no** abre la app nativa de Netflix/Disney+; se queda en el navegador.

## ¿Se puede abrir la app nativa?

Sí, pero requiere APIs específicas de webOS que **no están disponibles** desde una web normal cargada por URL. Solo funcionan en:

1. **Apps web empaquetadas como IPK** (instaladas en la TV) que declaran permisos y usan `webOS.service.request()`.
2. **Apps nativas** que llaman a `luna://com.webos.applicationManager/launch` con el ID de la app (ej: `netflix`, `com.disney.disneyplus-prod`).

### IDs de apps en webOS

- Netflix: `netflix`
- Disney+: `com.disney.disneyplus-prod`
- HBO Max: varía por región

### Limitación

Nuestra app TV se sirve desde Vercel y se carga en el navegador webOS. En ese contexto **no tenemos acceso** a `webOS.service.request()` ni al Application Manager. Para usar deep linking a apps nativas habría que:

1. Empaquetar la app como IPK webOS con los permisos adecuados.
2. O usar una app nativa como intermediaria.

## Recomendación

Mantener las URLs web actuales. En muchas TVs, al abrir una URL de Netflix/Disney+ el sistema puede ofrecer "Abrir en la app" si está instalada, pero depende del fabricante y la versión. No es algo que podamos controlar desde la web.
