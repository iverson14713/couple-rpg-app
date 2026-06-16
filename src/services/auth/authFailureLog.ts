/**
 * Full diagnostic console output for auth failures (UI may still show short user messages).
 */
export function logAuthFailure(
  provider: 'google' | 'apple',
  step: string,
  error: unknown,
  extra?: Record<string, unknown>
): void {
  const err = error as Error & {
    code?: string;
    status?: number;
    error?: string;
    error_description?: string;
  };

  const payload: Record<string, unknown> = {
    provider,
    step,
    message: err?.message ?? String(error),
    code: err?.code ?? null,
    name: err?.name ?? null,
    status: err?.status ?? null,
    oauthError: err?.error ?? null,
    oauthErrorDescription: err?.error_description ?? null,
    stack: err?.stack ?? null,
    ...extra,
  };

  console.error('[LQ_AUTH] failure', payload);
}
