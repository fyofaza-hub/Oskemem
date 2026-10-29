/** Строгая проверка и очистка пользовательского ввода (клиентский слой). */

/**
 * Практичная email-валидация: local@domain.tld, TLD ≥ 2 символов.
 * BY-дизайн мягче RFC: не режем валидные_uidрицательные адреса (два дефиса,
 * поддомены, плюс-теги), но отсекаем пробелы и отсутствие точки в домене.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export const isValidEmail = (value: string): boolean => EMAIL_REGEX.test((value ?? "").trim());

/** Пароль: только латиница, цифры и стандартные символы, минимум 8. */
export const PASSWORD_REGEX = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/;

export const isValidPassword = (value: string): boolean =>
  value.length >= 8 && PASSWORD_REGEX.test(value);

/** Удаление HTML-тегов и управляющих символов. */
export const sanitizeText = (value: string): string =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();