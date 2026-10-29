import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Необязательный Supabase-клиент.
 *
 * MVP работает локально и не вызывает этот модуль. Он подготовлен для
 * следующего этапа: реальной авторизации и синхронизации данных между
 * устройствами. Пока переменные не заданы, приложение использует
 * localStorage и демо-аккаунт.
 */
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Вернёт null, если Supabase не настроен — это штатный demo-режим. */
export function getSupabaseClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
