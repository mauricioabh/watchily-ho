export async function requireSuccessfulResponse(
  response: Response,
  fallbackMessage: string,
): Promise<Response> {
  if (response.ok) return response;

  let message = fallbackMessage;
  try {
    const body = (await response.clone().json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) {
      message = body.error;
    }
  } catch {
    // Keep the action-specific fallback for empty or non-JSON errors.
  }

  throw new Error(message);
}

export function getMutationErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}
