---
name: tv-remote-control-flow
description: Crea flujos de manipulación para el control remoto en apps TV (webOS). Usar al implementar o modificar páginas standalone para TV, navegación con flechas, foco inicial, teclas OK/Enter/Done, o cuando el usuario mencione control remoto, foco, navegación TV.
---

# Flujo de control remoto para app TV

Guía para implementar correctamente la manipulación del control remoto en páginas TV standalone (HTML estático para webOS/LG).

## Cuándo aplicar

- Crear o modificar páginas en `src/app/**/*-standalone/**/*.ts`
- Implementar navegación con flechas (ArrowUp/Down/Left/Right)
- Configurar foco inicial o orden de tabulación
- Manejar teclas OK, Enter, Done o activación de enlaces/botones

---

## 1. Estructura base del script

```js
(function(){
  var f = document.querySelectorAll('.tv-nav a, .tv-nav button, [selector-contenido]');
  function i(el){ for(var j=0;j<f.length;j++) if(f[j]===el) return j; return -1; }
  var navCount = 6;  // Inicio, Buscar, Listas, Ver todo, Config, Cerrar sesión

  function focusFirst(){ /* ver sección 2 */ }
  focusFirst();
  // Reintentos obligatorios
  [100,400,800,1500,3000].forEach(function(ms){ setTimeout(focusFirst,ms); });
  if(document.readyState!=='complete') window.addEventListener('load',focusFirst);

  document.addEventListener('keydown',function(e){
    // Activación (Enter/Space/Done)
    if(e.key==='Enter'||e.key===' '||e.keyCode===13||e.keyCode===28){
      var el=document.activeElement;
      if(el&&el.tagName==='A'&&el.href){ el.click(); e.preventDefault(); }
      return;
    }
    // Flechas
    var idx=i(document.activeElement);
    if(idx<0){ focusFirst(); e.preventDefault(); return; }
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    var next = /* lógica según tipo de página */;
    if(next>=0&&next<f.length) f[next].focus();
  },true);
})();
```

---

## 2. Foco inicial (OBLIGATORIO)

**webOS no da foco automáticamente.** Sin foco inicial la página no es usable con el mando.

### Reglas

- Usar **múltiples setTimeout** (100, 400, 800, 1500, 3000 ms mínimo)
- Añadir `window.addEventListener('load', ...)` si el script corre antes de `load`
- Fallback: si el elemento preferido no existe, enfocar el primero disponible

### Por tipo de página

| Tipo | Elemento de foco inicial |
|------|--------------------------|
| Con nav activo (ej. Ver todo) | Botón del menú correspondiente (`#firstFocus` vía `tvNavHtml`) |
| Con tiles | Primer tile |
| Con formulario | Input principal |
| Detalle título | Botón "Ver todo" del nav o primer enlace de contenido |

### Ejemplo con fallback

```js
function getFirstFocus(){
  var el = document.getElementById('firstFocus');
  if(el) return el;
  return document.querySelector('a[href*="lists-all-standalone"]') || f[0];
}
function focusFirst(){
  var btn = getFirstFocus();
  if(btn) btn.focus();
}
```

### Atributo autofocus

Para páginas de detalle, añadir `autofocus` al enlace de foco inicial en `tv-shared.ts` cuando `firstFocusId` coincida.

---

## 3. Navegación con flechas

### Nav (6 elementos)

- **ArrowDown desde nav** (idx 0–5): ir al **primer elemento de contenido** (no al siguiente del nav)
- **ArrowUp desde primera fila de contenido**: volver al último ítem del nav

### Patrón lineal

```js
if(e.key==='ArrowDown') next = idx < navCount ? navCount : idx + 1;
else if(e.key==='ArrowUp') next = idx > 0 ? idx - 1 : 0;
else if(e.key==='ArrowRight') next = idx + 1;
else if(e.key==='ArrowLeft') next = idx - 1;
```

### Patrón grid (tiles)

```js
var cols = 4;
if(e.key==='ArrowDown') next = idx < navCount ? navCount : idx + cols;
else if(e.key==='ArrowUp') next = idx >= navCount + filterCount ? idx - cols : (idx > navCount ? idx - 1 : navCount - 1);
else if(e.key==='ArrowRight') next = idx + 1;
else if(e.key==='ArrowLeft') next = idx - 1;
```

### Saltos custom (ej. Añadir a lista → primer source)

```js
var firstSource = null;
for(var s=navCount;s<f.length;s++)
  if(f[s].classList&&f[s].classList.contains('source-link')){ firstSource=f[s]; break; }
if(e.key==='ArrowDown'){
  if(idx<navCount) next=navCount;
  else if(idx===navCount) next=firstSource ? i(firstSource) : idx+1;
  else next=idx+1;
}
```

---

## 4. Teclas de activación

webOS puede no activar enlaces con Enter por defecto. Siempre añadir handler explícito.

### Keys a manejar

- `e.key==='Enter'` y `e.key===' '`
- `e.keyCode===13` (Enter) y `e.keyCode===28` (algunos mandos "Done")

### Enlaces normales

```js
if(el&&el.tagName==='A'&&el.href){ el.click(); e.preventDefault(); }
```

### Enlaces especiales (ej. streaming)

Para `.source-link` que abren apps nativas o URLs externas, llamar la función de apertura directamente en vez de depender de `click()`:

```js
var srcLink = el?.closest?.('.source-link');
if(srcLink){
  var url = srcLink.getAttribute('data-url')||srcLink.href;
  if(url&&url!=='#'){ openStreaming(url,appId); e.preventDefault(); return; }
}
```

---

## 5. Elementos focusables

- Todo enlace/botón: `tabindex="0"`
- Incluir en el selector: nav, inputs, botones, tiles, `.source-link`
- Usar `document.querySelectorAll('.tv-nav a, .tv-nav button, ...)` con todos los elementos interactivos

---

## 6. Checklist de implementación

- [ ] Foco inicial con múltiples setTimeout (≥5 reintentos)
- [ ] Fallback si el elemento preferido no existe
- [ ] Handler para Enter, Space y keyCode 13, 28
- [ ] ArrowDown desde nav va al primer contenido (no al siguiente nav)
- [ ] ArrowUp desde primera fila de contenido vuelve al nav
- [ ] Lógica de flechas coherente con el layout (lineal vs grid)
- [ ] Enlaces especiales (streaming) manejados explícitamente
- [ ] `e.preventDefault()` en keydown para evitar scroll o comportamiento por defecto

---

## Referencias

- **Detalle por tipo de página y keycodes**: [reference.md](reference.md)
- Reglas del proyecto: `.cursor/rules/tv-standalone.mdc`
- Ejemplos: `src/app/title-standalone/[id]/route.ts`, `src/app/lists-all-standalone/route.ts`
- Nav compartido: `src/lib/tv-shared.ts`
