import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { tr } from "@/i18n/runtime";
import type { User as AppUser } from "@/types";

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

/* ============================================================
   Медиа: бакет guide-images.
   Политика записи — только admin (001_admin_roles_storage.sql).
   ============================================================ */
export const PLACE_IMAGES_BUCKET = "guide-images";

/** Уникальный путь файла: places/<placeId>/<Date.now()>-<rand>.<ext>. */
export const buildImageObjectName = (placeId: string, fileName: string): string => {
  const ext = (fileName.split(".").pop() ?? "webp").toLowerCase().slice(0, 6);
  return `places/${placeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
};

/**
 * Загружает изображение места в Storage и возвращает публичный URL
 * с cache-buster (?v=), чтобы после замены картинка обновлялась мгновенно.
 */
export async function uploadPlaceImage(placeId: string, file: File): Promise<string> {
  const client = getSupabaseClient();
  if (!client) throw new Error(tr("Supabase не настроен"));
  const objectName = buildImageObjectName(placeId, file.name);
  const { error } = await client.storage
    .from(PLACE_IMAGES_BUCKET)
    .upload(objectName, file, { cacheControl: "no-cache", upsert: false });
  if (error) throw error;
  const { data } = client.storage.from(PLACE_IMAGES_BUCKET).getPublicUrl(objectName);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/* ============================================================
   Google OAuth (Шаг 4).
   Включается: Authentication → Providers → Google (Client ID/Secret —
   из Google Cloud Console), redirect URI
   https://<PROJECT_REF>.supabase.co/auth/v1/callback
   ============================================================ */
export async function signInWithGoogle(redirectTo?: string): Promise<{ error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { error: tr("Сначала настройте Supabase (VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY).") };
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectTo ?? window.location.origin + "/" },
  });
  if (error) return { error: error.message };
  return {};
}

/* ============================================================
   Шаг 1: закрепление сессии.
   getSessionUser() — при загрузке приложения; onSupabaseAuthChange —
   подписка на события (Google-редирект, refresh, выход).
   ============================================================ */
export interface SupabaseAuthUser {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export async function getSessionUser(): Promise<SupabaseAuthUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return mapSupabaseUser(data.session?.user ?? null);
}

export interface AuthSubscription {
  unsubscribe: () => void;
}

export function onSupabaseAuthChange(
  callback: (user: SupabaseAuthUser | null) => void,
): AuthSubscription | null {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(mapSupabaseUser(session?.user ?? null));
  });
  return { unsubscribe: () => data.subscription.unsubscribe() };
}

/** Supabase-пользователь → профиль приложения. */
export function mapSupabaseUser(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
} | null): SupabaseAuthUser | null {
  if (!authUser) return null;
  const meta = authUser.user_metadata ?? {};
  return {
    id: authUser.id,
    email: authUser.email,
    name: ((meta.name as string) ?? (meta.full_name as string)) || undefined,
    avatarUrl: ((meta.picture as string) ?? (meta.avatar_url as string)) || undefined,
  };
}

/** Зеркало профиля приложения для Google-пользователя. */
export const buildAppUserFromAuthUser = (authUser: SupabaseAuthUser): AppUser => {
  const base = (authUser.email ?? authUser.id).split("@")[0];
  return {
    id: authUser.id,
    name: authUser.name ?? base,
    username: base.replace(/[^a-z0-9._-]/gi, "").slice(0, 24) || authUser.id.slice(0, 8),
    email: authUser.email,
    bio: tr("Участник Oskemen Culture через Google."),
    city: tr("Өскемен"),
    joinedAt: new Date().toISOString(),
    avatarColor: "linear-gradient(135deg, #38BDF8 0%, #2563EB 100%)",
    avatar: authUser.avatarUrl,
    interests: ["culture", "food", "nature"],
    isSupabase: true,
    isOnboarded: false,
  };
};

/* Шаг 2: надёжная привязка данных к пользователю (userId по RLS миграции 002). */
export type UserDataKind = "favorites" | "saved_posts" | "saved_routes" | "saved_events";

/** Пишет изменение в Supabase (best-effort: ошибка не рушит UX). */
export async function pushUserDataChange(
  kind: UserDataKind,
  userId: string,
  rowId: string,
  op: "add" | "remove",
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const column = kind === "favorites" ? "place_id" : kind === "saved_posts" ? "post_id" : kind === "saved_routes" ? "route_id" : "event_id";
    if (op === "add") {
      await client.from(kind).upsert({ user_id: userId, [column]: rowId });
    } else {
      await client.from(kind).delete().eq("user_id", userId).eq(column, rowId);
    }
  } catch {
    // Сеть/RLS: не мешает UX — данные остаются локально
  }
}
