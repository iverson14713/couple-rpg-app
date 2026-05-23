/** Avoid double PKCE exchange (React StrictMode / duplicate effects). */
let lastExchangedCode: string | null = null;

export function markPkceCodeExchanged(code: string): void {
  lastExchangedCode = code;
}

export function wasPkceCodeExchanged(code: string): boolean {
  return lastExchangedCode === code;
}
