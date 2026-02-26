/**
 * TV app version - single source of truth from appinfo.json.
 * Used in nav (next to Cerrar sesión) and for display.
 */
import appinfo from "../../lg-tv-hosted/appinfo.json";

export const TV_APP_VERSION = (appinfo as { version: string }).version;
