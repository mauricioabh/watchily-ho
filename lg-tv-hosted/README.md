# Watchily - LG webOS TV (Hosted Web App)

1. Sustituye `YOUR_APP.vercel.app` en `index.html` por la URL real de tu despliegue en Vercel.
2. Añade iconos `icon.png` (80x80) y `largeIcon.png` (130x130) en esta carpeta.
3. Con el CLI de webOS TV (o ares-generate):
   - Para generar desde plantilla: `ares-generate -t hosted_webapp ./lg-tv-hosted` y luego reemplaza appinfo.json e index.html con los de este proyecto.
   - Para empaquetar: usa las herramientas del SDK webOS TV para crear el .ipk e instalarlo en la TV.

Documentación: https://webostv.developer.lge.com/develop/getting-started/web-app-types
