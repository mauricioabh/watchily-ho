"use client";

import { type IconType } from "react-icons";
import { TbBrandDisney, TbBrandHbo, TbBrandNetflix } from "react-icons/tb";
import {
  SiAppletv,
  SiCrunchyroll,
  SiPrimevideo,
} from "react-icons/si";

const PLATFORMS: { name: string; Icon: IconType; color: string }[] = [
  { name: "Netflix", Icon: TbBrandNetflix, color: "#E50914" },
  { name: "Disney+", Icon: TbBrandDisney, color: "#113CCF" },
  { name: "Prime Video", Icon: SiPrimevideo, color: "#00A8E1" },
  { name: "HBO Max", Icon: TbBrandHbo, color: "#B535F6" },
  { name: "Crunchyroll", Icon: SiCrunchyroll, color: "#F47521" },
  { name: "Apple TV", Icon: SiAppletv, color: "#FFFFFF" },
];

export function PlatformStrip() {
  return (
    <section className="container mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="mb-5 text-center text-sm font-medium text-muted-foreground">
        En las plataformas que usas
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-10">
        {PLATFORMS.map((p) => (
          <div
            key={p.name}
            className="flex flex-col items-center gap-2 transition-opacity hover:opacity-90"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 p-2 sm:h-12 sm:w-12">
              <p.Icon className="h-7 w-7" style={{ color: p.color }} />
            </div>
            <span className="text-xs text-muted-foreground sm:text-sm">{p.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
