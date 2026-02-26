/**
 * Shared HTML/CSS for TV standalone pages
 */
import { TV_APP_VERSION } from "./app-version";

export function tvNavHtml(
  base: string,
  active:
    | "inicio"
    | "buscar"
    | "listas"
    | "vertodo"
    | "config"
    | "none" = "none",
  firstFocusId?: "inicio" | "buscar" | "listas" | "vertodo",
) {
  const a = (
    href: string,
    label: string,
    icon: string,
    isActive: boolean,
    id?: string,
    autofocusAttr?: boolean,
  ) =>
    `<a href="${href}" tabindex="0" class="nav-link ${isActive ? "nav-active" : ""}" ${id ? `id="${id}"` : ""}${autofocusAttr ? " autofocus" : ""}>${icon} ${label}</a>`;
  const iconOnly = (href: string, icon: string, title: string) =>
    `<a href="${href}" tabindex="0" class="nav-link nav-icon" title="${title}">${icon}</a>`;

  return `
  <header class="tv-header">
    <h1 class="tv-logo"><span class="tv-logo-icon" aria-hidden="true">🎬</span> Watchily</h1>
    <nav class="tv-nav">
      ${a(`${base}/tv-standalone`, "Inicio", "⌂", active === "inicio", firstFocusId === "inicio" ? "firstFocus" : undefined)}
      ${a(`${base}/search-standalone`, "Buscar", "🔍", active === "buscar", firstFocusId === "buscar" ? "firstFocus" : undefined)}
      ${a(`${base}/lists-standalone`, "Listas", "📋", active === "listas", firstFocusId === "listas" ? "firstFocus" : undefined)}
      ${a(`${base}/lists-all-standalone`, "Ver todo", "📺", active === "vertodo", firstFocusId === "vertodo" ? "firstFocus" : undefined, firstFocusId === "vertodo")}
      ${iconOnly(`${base}/settings-standalone`, "⚙", "Configuración")}
      <form id="logoutForm" action="${base}/auth/signout" method="POST" style="display:inline">
        <input type="hidden" name="redirect" value="/tv-standalone" />
        <button type="button" id="logoutBtn" tabindex="0" class="nav-link" title="Cerrar sesión">Cerrar sesión</button>
        <span class="tv-version" aria-hidden="true">v${TV_APP_VERSION}</span>
      </form>
    </nav>
  </header>
  <div id="logoutModal" class="logout-modal" aria-hidden="true">
    <div class="logout-overlay">
      <p class="logout-msg">¿Cerrar sesión?</p>
      <div class="logout-btns">
        <button type="button" id="logoutCancel" tabindex="0">No</button>
        <button type="button" id="logoutConfirm" tabindex="0">Sí, cerrar</button>
      </div>
    </div>
  </div>`;
}

export const tvLogoutModalHtml = `
  <div id="logoutModal" class="logout-modal" aria-hidden="true">
    <div class="logout-overlay">
      <p class="logout-msg">¿Cerrar sesión?</p>
      <div class="logout-btns">
        <button type="button" id="logoutCancel" tabindex="0">No</button>
        <button type="button" id="logoutConfirm" tabindex="0">Sí, cerrar</button>
      </div>
    </div>
  </div>`;

/** Snippet JS: si el modal de logout está abierto, no ejecutar (evita que focusFirst/setTimeout roben foco) */
export const tvLogoutModalCheck =
  "var _lm=document.getElementById('logoutModal');if(_lm&&_lm.style.display==='flex')return;";
/** Variante para keydown: si modal abierto, preventDefault y return (evita robar foco al pulsar tecla) */
export const tvLogoutModalCheckKeydown =
  "var _lm=document.getElementById('logoutModal');if(_lm&&_lm.style.display==='flex'){e.preventDefault();return;}";

export const tvLogoutModalCss = `
.logout-modal{display:none;visibility:hidden;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;background:rgba(0,0,0,0.85)}
.logout-overlay{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(180deg,#0b1120 0%,#080c18 100%);border:1px solid rgba(255,255,255,0.2);border-radius:16px;padding:48px;min-width:400px}
.logout-msg{font-size:28px;margin-bottom:32px;color:#fff;text-align:center;width:100%}
.logout-btns{display:flex;gap:24px;justify-content:center}
.logout-btns button{padding:18px 36px;font-size:24px;font-weight:600;border-radius:12px;border:1px solid rgba(255,255,255,0.2);background:rgba(99,102,241,0.5);color:#fff;cursor:pointer}
.logout-btns button:focus{outline:3px solid #e5b00b;outline-offset:2px}
`;

export function tvLogoutScript(): string {
  return `
(function(){
  var modal=document.getElementById('logoutModal');
  var btn=document.getElementById('logoutBtn');
  var form=document.getElementById('logoutForm');
  var cancel=document.getElementById('logoutCancel');
  var confirm=document.getElementById('logoutConfirm');
  if(!btn||!modal)return;
  function showModal(){
    modal.style.display='flex';
    modal.style.visibility='visible';
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    setTimeout(function(){if(cancel)cancel.focus();},50);
  }
  function hideModal(){
    modal.style.display='none';
    modal.style.visibility='';
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    if(btn)btn.focus();
  }
  function onLogoutActivate(e){e.preventDefault();showModal();}
  btn.addEventListener('click',onLogoutActivate);
  btn.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){onLogoutActivate(e);}});
  if(cancel){cancel.addEventListener('click',hideModal);cancel.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){hideModal();e.preventDefault();}});}
  if(confirm){confirm.addEventListener('click',function(){if(form)form.submit();});confirm.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){if(form)form.submit();e.preventDefault();}});}
  document.addEventListener('keydown',function(e){
    if(modal.style.display!=='flex')return;
    var kc=e.keyCode;
    if(e.key==='Escape'||kc===461||kc===8){hideModal();e.preventDefault();return;}
    if(e.key==='ArrowUp'||e.key==='ArrowDown'||kc===38||kc===40){hideModal();e.preventDefault();return;}
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'||kc===37||kc===39){var f=document.activeElement;if(f===cancel&&confirm)confirm.focus();else if(f===confirm&&cancel)cancel.focus();e.preventDefault();}
  });
})();
`;
}

export const tvNavCss = `
.tv-header{position:sticky;top:0;z-index:100;background:linear-gradient(180deg,rgba(11,17,32,0.98) 0%,rgba(8,12,24,0.95) 100%);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.08);padding:28px 48px;display:flex;align-items:center;flex-wrap:wrap}
.tv-logo{font-size:36px;font-weight:700;color:#e5b00b;margin:0;display:flex;align-items:center;gap:12px;margin-right:80px}
.tv-logo-icon{font-size:40px;line-height:1}
.tv-nav{display:flex;align-items:center;flex-wrap:wrap}
.tv-nav>*{margin-right:56px}
.tv-nav>*:last-child{margin-right:0}
.nav-link{display:inline-flex;align-items:center;gap:8px;padding:14px 20px;border-radius:10px;font-size:20px;cursor:pointer;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);color:#fff;text-decoration:none;transition:all 0.2s}
.nav-link:hover,.nav-link:focus{background:rgba(99,102,241,0.35);border-color:#6366f1;outline:3px solid #e5b00b;outline-offset:2px}
.nav-active{background:rgba(99,102,241,0.5);border-color:#6366f1}
.nav-icon{padding:14px 18px;font-size:24px}
.tv-version{margin-left:12px;font-size:16px;color:rgba(255,255,255,0.45);font-weight:400;vertical-align:middle}
.logout-modal{display:none;visibility:hidden;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;background:rgba(0,0,0,0.85)}
.logout-overlay{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(180deg,#0b1120 0%,#080c18 100%);border:1px solid rgba(255,255,255,0.2);border-radius:16px;padding:48px;min-width:400px}
.logout-msg{font-size:28px;margin-bottom:32px;color:#fff;text-align:center;width:100%}
.logout-btns{display:flex;gap:24px;justify-content:center}
.logout-btns button{padding:18px 36px;font-size:24px;font-weight:600;border-radius:12px;border:1px solid rgba(255,255,255,0.2);background:rgba(99,102,241,0.5);color:#fff;cursor:pointer}
.logout-btns button:focus{outline:3px solid #e5b00b;outline-offset:2px}
`;

export const tvTileCss = `
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,320px));gap:32px}
.tile-link{outline:none;text-decoration:none;color:inherit}
.tile-link:focus{outline:none}
.tile-link:focus .tile{transform:scale(1.03);border-color:#e5b00b;box-shadow:0 0 0 3px #e5b00b}
.tile{background:rgba(26,26,30,0.95);border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.12);transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s}
.tile-poster{height:300px;background:#1f1f23;position:relative;overflow:hidden}
.tile-poster img{width:100%;height:100%;object-fit:cover}
.tile-placeholder{display:flex;align-items:center;justify-content:center;height:100%;font-size:36px;font-weight:700;color:#555}
.tile-badge{position:absolute;left:8px;top:8px;background:rgba(0,0,0,0.8);padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600}
.tile-platform{position:absolute;right:8px;bottom:8px;background:rgba(0,0,0,0.8);padding:4px 8px;border-radius:4px;font-size:11px;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tile-info{padding:16px}
.tile-title{font-size:26px;font-weight:600;margin:0 0 6px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tile-year{font-size:20px;color:#888}
`;
