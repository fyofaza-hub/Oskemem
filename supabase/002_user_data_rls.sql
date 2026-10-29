-- ============================================================
-- Oskemen Culture · Миграция 002
-- Google-профиль: email/полное имя/аватар + RLS на пользовательские данные.
-- ============================================================

-- Профиль обогащаем колонками для OAuth-данных
alter table public.profiles
  add column if not exists email text;
alter table public.profiles
  add column if not exists is_supabase_auth boolean not null default false;

-- Обновлённый триггер создания профиля (по шаблону ТЗ, с конвертом имени в username)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  attempt int := 0;
  final_username text;
begin
  base_username := coalesce(
    nullif(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9._-]', '', 'g'), ''),
    'user'
  );
  final_username := base_username;

  -- Подбираем свободный username (base, base2, base3…)
  loop
    attempt := attempt + 1;
    if not exists (select 1 from public.profiles where username = final_username) then
      exit;
    end if;
    final_username := base_username || (attempt + 1)::text;
    exit when attempt > 50;
  end loop;

  insert into public.profiles (
    id, email, name, username, avatar_url,
    is_supabase_auth, role
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    final_username,
    new.raw_user_meta_data->>'avatar_url',
    true,
    'user'
  )
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- RLS: избранное и сохранённое принадлежат пользователю
-- =============================================================
alter table public.favorites     enable row level security;
alter table public.saved_posts   enable row level security;
alter table public.saved_routes  enable row level security;
alter table public.saved_events  enable row level security;
alter table public.post_likes    enable row level security;

-- Шаблон политик: запись/чтение/удаление только своих строк
drop policy if exists "favorites_user_all" on public.favorites;
create policy "favorites_user_all" on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "saved_posts_user_all" on public.saved_posts;
create policy "saved_posts_user_all" on public.saved_posts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "saved_routes_user_all" on public.saved_routes;
create policy "saved_routes_user_all" on public.saved_routes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "saved_events_user_all" on public.saved_events;
create policy "saved_events_user_all" on public.saved_events for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "post_likes_user_all" on public.post_likes;
create policy "post_likes_user_all" on public.post_likes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
