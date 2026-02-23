/**
 * Shared theme with web (Watchily dark: blue primary + amber accent).
 * Use these constants across all Expo screens for a consistent look.
 */
export const theme = {
  colors: {
    background: "#05070d",
    foreground: "#fafafa",
    card: "rgba(255,255,255,0.06)",
    cardForeground: "#fafafa",
    primary: "#3b82f6",
    primaryForeground: "#fafafa",
    secondary: "rgba(255,255,255,0.1)",
    secondaryForeground: "#fafafa",
    muted: "rgba(255,255,255,0.07)",
    mutedForeground: "#8a9ab5",
    border: "rgba(255,255,255,0.1)",
    input: "rgba(255,255,255,0.08)",
    destructive: "#ef4444",
    accent: "#e5b00b",
    accentForeground: "#0f0f0f",
  },
  /** Gradient colors matching the web background (top → bottom) */
  gradient: {
    colors: ["#0b1120", "#090e1c", "#070a14", "#05070d"] as const,
    /** Overlay glow color for the top radial effect */
    glowBlue: "rgba(56,120,255,0.28)",
    glowPurple: "rgba(130,60,220,0.15)",
  },
  radii: {
    sm: 6,
    md: 8,
    lg: 12,
  },
} as const;

export type Theme = typeof theme;
