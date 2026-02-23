"use client";

import Link from "next/link";
import { useState } from "react";

interface Props {
  id: string;
  name: string;
  isPublic: boolean;
  count: number;
  accent: {
    border: string;
    fill: string;
    fillHover: string;
    glow: string;
    badge: string;
  };
}

export function ListCard({ id, name, isPublic, count, accent }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/lists/${id}`}
      className="group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 hover:scale-[1.02]"
      style={{
        borderColor: hovered ? accent.border : `${accent.border.replace(/[\d.]+\)$/, "0.35)")}`,
        backgroundColor: hovered ? accent.fillHover : accent.fill,
        boxShadow: hovered ? `0 0 22px 3px ${accent.glow}` : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl transition-opacity duration-200"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent.border}, transparent)`,
          opacity: hovered ? 1 : 0.5,
        }}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-foreground/80 transition-colors group-hover:text-foreground">
            {name}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isPublic ? "Pública" : "Privada"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${accent.badge}`}>
          {count} {count === 1 ? "título" : "títulos"}
        </span>
      </div>
    </Link>
  );
}
