import type { ZodType } from "zod";

export function parseJsonBody<T>(
  schema: ZodType<T>,
  body: unknown,
): { data: T } | { error: string } {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .join("; ");
    return { error: message };
  }
  return { data: result.data };
}

export function parseSearchParams<T>(
  schema: ZodType<T>,
  searchParams: URLSearchParams,
): { data: T } | { error: string } {
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  const result = schema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .join("; ");
    return { error: message };
  }
  return { data: result.data };
}
