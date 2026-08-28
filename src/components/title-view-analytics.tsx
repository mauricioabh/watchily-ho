"use client";

import { useEffect } from "react";
import { captureProductEvent } from "@/lib/analytics";
import type { TitleType } from "@/types/streaming";

export function TitleViewAnalytics({ titleType }: { titleType: TitleType }) {
  useEffect(() => {
    captureProductEvent("title_viewed", { titleType });
  }, [titleType]);

  return null;
}
