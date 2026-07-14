"use client";

import { getProviderMeta } from "@/lib/streaming/provider-meta";

type Props = {
  userProviderIds: string[];
  activeIds: string[];
  activeCount: number;
  totalCount: number;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
};

export function ProviderFilterBar({
  userProviderIds,
  activeIds,
  activeCount,
  totalCount,
  onToggle,
  onSelectAll,
}: Props) {
  if (userProviderIds.length === 0) return null;

  const activeSet = new Set(activeIds);
  const allSelected = activeCount === totalCount && totalCount > 0;

  return (
    <div className="mb-5 space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Plataformas
        </span>
        <span
          className="rounded-full border border-white/12 bg-white/8 px-2.5 py-0.5 text-xs font-semibold text-foreground/70"
          title={`${activeCount} de ${totalCount} plataformas activas`}
        >
          {activeCount}/{totalCount}
        </span>
        {!allSelected && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver todas
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {userProviderIds.map((id) => {
          const meta = getProviderMeta(id);
          if (!meta) return null;
          const selected = activeSet.has(id);
          const Icon = meta.icon;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              aria-pressed={selected}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-white/10 bg-white/4 text-muted-foreground hover:border-white/20 hover:text-foreground"
              }`}
            >
              <Icon
                className="size-3.5 shrink-0"
                style={{ color: selected ? meta.color : undefined }}
              />
              {meta.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
