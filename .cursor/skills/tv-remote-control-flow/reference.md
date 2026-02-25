# Referencia detallada - Flujo control remoto TV

## Patrones por tipo de página

### Página con tiles (Ver todo, Inicio, Buscar)

```js
var f = document.querySelectorAll('.tv-nav a, .tv-nav button, .filter-wrap input, .filter-wrap button, .tile-link');
var navCount = 6, filterCount = 2, firstTileIdx = navCount + filterCount, cols = 4;

// ArrowDown: nav -> filter -> grid; dentro del grid: +cols
// ArrowUp: grid -> filter -> nav; dentro del grid: -cols
if(e.key==='ArrowDown'){
  if(idx < navCount) next = navCount;
  else if(idx < firstTileIdx) next = firstTileIdx;
  else next = idx + cols;
} else if(e.key==='ArrowUp'){
  if(idx >= firstTileIdx) next = idx >= firstTileIdx + cols ? idx - cols : firstTileIdx - 1;
  else if(idx >= navCount) next = idx - 1;
  else next = Math.max(0, idx - cols);
}
```

### Página de detalle (título)

- Foco inicial: Ver todo (nav) con `firstFocusId="vertodo"` en `tvNavHtml`
- ArrowDown: Ver todo → Añadir a lista → primer source-link (saltar Ver tráiler) → resto
- Enlaces `.source-link`: handler explícito para abrir streaming (no depender de click)

### Página con formulario (Buscar, Crear lista)

- Foco inicial: input principal
- ArrowDown desde nav: ir al input
- Enter en input: submit del form (comportamiento por defecto)

---

## webOS keycodes útiles

| Tecla | key | keyCode |
|-------|-----|---------|
| OK/Enter | Enter | 13 |
| Done (algunos mandos) | - | 28 |
| Space |   | 32 |
| ArrowUp | ArrowUp | 38 |
| ArrowDown | ArrowDown | 40 |
| ArrowLeft | ArrowLeft | 37 |
| ArrowRight | ArrowRight | 39 |
| Back | - | 461 |

**Importante**: webOS puede no enviar `e.key`; usar fallback por `keyCode`:
```js
var k=e.key||(e.keyCode===40?'ArrowDown':e.keyCode===38?'ArrowUp':e.keyCode===37?'ArrowLeft':e.keyCode===39?'ArrowRight':'');
```

---

## tvNavHtml y firstFocusId

Para que un botón del nav reciba foco inicial, pasar `firstFocusId`:

```ts
tvNavHtml(BASE, "vertodo", "vertodo")  // active="vertodo", firstFocusId="vertodo"
```

El enlace "Ver todo" obtendrá `id="firstFocus"` y opcionalmente `autofocus`.
