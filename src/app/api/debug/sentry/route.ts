import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { env } from "@/env";

/** Dev-only probe — throws a test error visible in Sentry when SENTRY_DSN is set. */
export async function GET() {
  if (env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  Sentry.setTag("platform", "web");
  Sentry.captureException(new Error("Watchily Sentry test error"));
  return NextResponse.json({ ok: true, message: "Test error sent to Sentry" });
}
