# URLs de streaming en la app TV (webOS)

## Comportamiento actual

Los enlaces a Netflix, Disney+, HBO Max, etc. en el detalle de películas son **URLs web** (ej: `https://www.netflix.com/title/123456`). Al pulsar en ellos:

- **En navegador de escritorio/móvil**: se abre la web del proveedor en una nueva pestaña.
- **En webOS (TV)**: el navegador de la TV abre esa URL. Normalmente **no** abre la app nativa de Netflix/Disney+; se queda en el navegador.

---

## Cómo abrir la app oficial de streaming (Netflix, Disney+, etc.)

### Opción 1: API de webOS (solo en app empaquetada como IPK)

Si la app está instalada como **IPK** (hosted web app), el webview puede tener acceso a `webOS.service.request()`. Se puede intentar lanzar la app nativa así:

```javascript
// Ejemplo: abrir Netflix
if (typeof webOS !== 'undefined' && webOS.service) {
  webOS.service.request('luna://com.webos.applicationManager', {
    method: 'launch',
    parameters: { id: 'netflix' },
    onSuccess: function() { /* app abierta */ },
    onFailure: function(err) { /* fallback: abrir URL web */ window.open(url); }
  });
} else {
  window.open(url); // fallback: URL web
}
```

**IDs de apps en webOS:**
- Netflix: `netflix`
- Disney+: `com.disney.disneyplus-prod`
- HBO Max: varía por región (ej: `com.hbo.hbomax`)

**Limitación:** Netflix/Disney+ aceptan el `launch` pero **no documentan parámetros** para abrir un título concreto. El `launch` solo abre la app; no hay deep link público para "ir a esta película". Cada plataforma tendría que exponer sus propios parámetros.

### Opción 2: URLs web (actual)

Mantener las URLs web. En algunas TVs, al abrir una URL de Netflix/Disney+ el sistema puede ofrecer "Abrir en la app", pero depende del fabricante.

### Implementación actual

1. **Disney+**: abrir la URL directa al título en el navegador del sistema (`webOSDev.APP.BROWSER` con `target: url`). La app no documenta params para ir al título; el navegador carga la página del contenido.
2. **Netflix, HBO Max**: llamar `launch` con el ID de la app, pasando `params: {target, url}` por si aceptan la URL.
3. Si falla → intentar navegador del sistema con la URL.
4. Si webOSDev no existe o falla → navegar con `location.href`.

Para Netflix no hay documentación pública de deep links; Disney+ usa el navegador para ir directo al título.
