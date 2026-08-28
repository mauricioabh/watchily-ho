import { env, isConfiguredPair } from "@/env";

export function isInngestEnabled(): boolean {
  return isConfiguredPair(env.INNGEST_EVENT_KEY, env.INNGEST_SIGNING_KEY);
}
