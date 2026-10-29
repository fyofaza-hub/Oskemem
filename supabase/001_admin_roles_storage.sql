-- ============================================================
-- Oskemen Culture · Миграция 001
-- Неудаляемый аккаунт администратора + RLS + Storage под фото мест
-- Запускать целиком в SQL Editor Supabase (ONE-TIME).
-- ============================================================

-- =============================================================
-- 1 · Администратор (auth.users + публичный профиль)
-- =============================================================
do $$
declare
  admin_uid uuid;
begin
  -- Создаём пользователя Supabase Auth (или переиспользуем существующего)
  select id into admin_uid
  from auth.users
  where email = 'admin@oskemen.culture'
  limit 1;

  if admin_uid is null then
    insert into auth.users (
      instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000',
      'admin@oskemen.culture',
      crypt('SuperAdmin2026Password!', gen_salt('bf', 12)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"is_admin_account":true}'::jsonb,
      now(), now(), '', '', '', ''
    ) returning id into admin_uid;
  end if;

  -- Профиль с ролью admin: неудаляемый, неотзываемый
  insert into public.profiles (id, username, full_name, role, is_fixed)
  values (admin_uid, 'admin', 'Главный администратор', 'admin', true)
  on conflict (id) do update
    set role = 'admin',
        is_fixed = true,
        updated_at = now();
end $$;

-- =============================================================
-- 2 · RLS: роль admin — единственная, кто правит модерируемым контентом
-- Таблицы: places / events / routes / posts(+comments) / profiles
--   Требуется колонка role в public.profiles (см. schema.sql).
-- =============================================================

-- Включаем RLS, если ещё не включён
alter table public.places  enable row level security;
alter table public.events  enable row level security;
alter table public.routes  enable row level security;
alter table public.posts   enable row level security;
alter table public.profiles enable row level security;

-- Вспомогательная функция: текущий пользователь — админ?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_fixed is not false
  );
$$;

-- Чтение: всем (каталог публичный), запись/удаление: только admin
drop policy if exists "places_read" on public.places;
create policy "places_read" on public.places for select using (true);
drop policy if exists "places_write_admin" on public.places;
create policy "places_write_admin" on public.places for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "events_read" on public.events;
create policy "events_read" on public.events for select using (true);
drop policy if exists "events_write_admin" on public.events;
create policy "events_write_admin" on public.events for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "routes_read" on public.routes;
create policy "routes_read" on public.routes for select using (true);
drop policy if exists "routes_write_admin" on public.routes;
create policy "routes_write_admin" on public.routes for all
  using (public.is_admin()) with check (public.is_admin());

-- Посты: владелец видит свои, публичные — все; модерация только у admin
drop policy if exists "posts_read" on public.posts;
create policy "posts_read" on public.posts for select
  using (approved or author_id = auth.uid() or public.is_admin());
drop policy if exists "posts_write_owner" on public.posts;
create policy "posts_write_owner" on public.posts for insert with check (author_id = auth.uid());
drop policy if exists "posts_moderate_admin" on public.posts;
create policy "posts_moderate_admin" on public.posts for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "posts_delete_admin" on public.posts;
create policy "posts_delete_admin" on public.posts for delete
  using (public.is_admin() or author_id = auth.uid());

-- Профили: свой профиль редактирую я; чужие — только чтение; роль меняет admin
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select using (true);
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Запрет самоповышения роли обычными пользователями
create or replace function public.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    new.role = old.role;
  end if;
  if old.is_fixed is true and new.is_fixed is not true then
    new.is_fixed = true;
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_role_change();
drop policy if exists "profiles_moderate_admin" on public.profiles;
create policy "profiles_moderate_admin" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- =============================================================
-- 3 · Storage: бакет guide-images (публичное чтение, запись — admin)
-- =============================================================
insert into storage.buckets (id, name, public)
values ('guide-images', 'guide-images', true)
on conflict (id) do nothing;

drop policy if exists "guide_images_read" on storage.objects;
create policy "guide_images_read" on storage.objects for select
  using (bucket_id = 'guide-images');

drop policy if exists "guide_images_write_admin" on storage.objects;
create policy "guide_images_write_admin" on storage.objects for insert
  with check (bucket_id = 'guide-images' and public.is_admin());

drop policy if exists "guide_images_update_admin" on storage.objects;
create policy "guide_images_update_admin" on storage.objects for update
  using (bucket_id = 'guide-images' and public.is_admin());

drop policy if exists "guide_images_delete_admin" on storage.objects;
create policy "guide_images_delete_admin" on storage.objects for delete
  using (bucket_id = 'guide-images' and public.is_admin());

-- =============================================================
-- 4 · Google OAuth (Шаг 4): провайдер включается через панель
-- Authentication → Providers → Google (Client ID/Secret от Google Cloud Console).
-- Триггер создания профиля для новых OAuth-пользователей:
-- =============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
