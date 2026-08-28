"use client";

import type { ReactNode } from "react";
import { captureProductEvent } from "@/lib/analytics";
import type { StreamingSource } from "@/types/streaming";

export function StreamingLink({
  source,
  className,
  children,
}: {
  source: Pick<StreamingSource, "providerName" | "type" | "url">;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={source.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() =>
        source.url &&
        captureProductEvent("streaming_link_clicked", {
          provider: source.providerName,
          offerType: source.type,
        })
      }
    >
      {children}
    </a>
  );
}
