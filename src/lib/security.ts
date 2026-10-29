/**
 * Безопасность локального хранилища.
 * Пароли не хранятся в открытом виде: вместо пароля сохраняется
 * SHA-256(hash(salt + password)) со случайной солью аккаунта.
 * crypto.subtle требует secure context — localhost и продакшен-HTTPS подходят.
 */

export const randomSalt = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export const sha256Hex = async (input: string): Promise<string> => {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
};

/** Пароль, записанный в старом формате (до внедрения хэширования). */
export const isLegacyPassword = (stored?: string): boolean =>
  Boolean(stored) && !/^[0-9a-f]{64}$/i.test(stored ?? "") && stored !== "pending";
