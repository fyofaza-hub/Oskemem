-- Oskemen Culture — схема необязательного Supabase-бэкенда.
--
-- Это НЕ автоматическая миграция текущего MVP: приложение пока работает
-- на localStorage. Схема показывает, как подключить реальные аккаунты,
-- публикации, маршруты и сохранения на следующем этапе.
--
-- Как применить: Supabase Dashboard → SQL Editor → вставить этот файл.
-- Перед production-запуском пересмотрите RLS-политики под свою модель доступа.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Профили
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  name text not null,
  bio text not null default '',
  city text not null default 'Өскемен',
  avatar_url text,
  avatar_color text,
  interests text[] not null default '{}',
  role text not null default 'user' check (role in ('user','admin')),
  banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-zA-Z0-9._-]{3,32}$')
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
begin
  base_username := coalesce(
    nullif(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9._-]', '', 'g'), ''),
    'user'
  );
  insert into public.profiles (id, name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    left(base_username, 27) || '-' || left(new.id::text, 4)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Контент города
-- ---------------------------------------------------------------------------

create table if not exists public.places (
  id text primary key,
  name text not null,
  category text not null check (category in ('food', 'nature', 'entertainment', 'culture', 'sport', 'landmark', 'leisure')),
  district text not null,
  address text not null,
  description text not null,
  short_description text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  image_url text not null,
  tags text[] not null default '{}',
  price_level smallint not null default 0 check (price_level between 0 and 3),
  companions text[] not null default '{}',
  source text not null default 'OpenStreetMap',
  photo_credit text,
  illustrative_photo boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id text primary key,
  title text not null,
  description text not null,
  image_url text not null,
  category text not null check (category in ('food', 'nature', 'entertainment', 'culture', 'sport', 'landmark', 'leisure')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  place_id text references public.places (id) on delete set null,
  price_label text not null default 'уточняется',
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Социальная лента
-- ---------------------------------------------------------------------------

create table if not exists public.posts (
  id text primary key default gen_random_uuid()::text,
  author_id uuid not null references public.profiles (id) on delete cascade,
  place_id text references public.places (id) on delete set null,
  title text not null,
  body text not null,
  image_url text,
  category text not null check (category in ('food', 'nature', 'entertainment', 'culture', 'sport', 'landmark', 'leisure')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id text not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id text primary key default gen_random_uuid()::text,
  post_id text not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Маршруты
-- ---------------------------------------------------------------------------

create table if not exists public.routes (
  id text primary key default gen_random_uuid()::text,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  cover_url text,
  categories text[] not null default '{}',
  duration_min integer not null default 0 check (duration_min >= 0),
  distance_km numeric(6, 2) not null default 0 check (distance_km >= 0),
  is_public boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.route_stops (
  route_id text not null references public.routes (id) on delete cascade,
  position integer not null check (position >= 0),
  place_id text not null references public.places (id) on delete cascade,
  time_label text not null default '12:00',
  note text not null default '',
  primary key (route_id, position),
  unique (route_id, place_id)
);

-- ---------------------------------------------------------------------------
-- Сохранения пользователя
-- ---------------------------------------------------------------------------

create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id text not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table if not exists public.saved_posts (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id text not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.saved_routes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  route_id text not null references public.routes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, route_id)
);

create table if not exists public.saved_events (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id text not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- ---------------------------------------------------------------------------
-- Индексы
-- ---------------------------------------------------------------------------

create index if not exists posts_author_id_idx on public.posts (author_id, created_at desc);
create index if not exists posts_place_id_idx on public.posts (place_id);
create index if not exists comments_post_id_idx on public.comments (post_id, created_at);
create index if not exists routes_author_id_idx on public.routes (author_id, created_at desc);
create index if not exists route_stops_route_id_idx on public.route_stops (route_id, position);
create index if not exists events_starts_at_idx on public.events (starts_at);

-- ---------------------------------------------------------------------------
-- Параметры сайта
-- ---------------------------------------------------------------------------

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value)
values ('main', '{"siteTitle":"Oskemen Culture","maintenanceMode":false,"postingEnabled":true}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.events enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.routes enable row level security;
alter table public.route_stops enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_posts enable row level security;
alter table public.saved_routes enable row level security;
alter table public.saved_events enable row level security;

-- Профили: читаются всеми, меняет только владелец.
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Справочники читаются всеми. Запись — только через service_role/админку.
drop policy if exists "places_select_all" on public.places;
create policy "places_select_all" on public.places for select using (true);

drop policy if exists "events_select_all" on public.events;
create policy "events_select_all" on public.events for select using (true);

-- Публикации.
drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts for select using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = author_id);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete using (auth.uid() = author_id);

-- Лайки: видны всем, ставит и снимает только сам пользователь.
drop policy if exists "post_likes_select_all" on public.post_likes;
create policy "post_likes_select_all" on public.post_likes for select using (true);

drop policy if exists "post_likes_insert_own" on public.post_likes;
create policy "post_likes_insert_own" on public.post_likes for insert with check (auth.uid() = user_id);

drop policy if exists "post_likes_delete_own" on public.post_likes;
create policy "post_likes_delete_own" on public.post_likes for delete using (auth.uid() = user_id);

-- Комментарии.
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments for select using (true);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = author_id);

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = author_id);

-- Маршруты: публичные видны всем, приватные — только автору.
drop policy if exists "routes_select_public_or_own" on public.routes;
create policy "routes_select_public_or_own" on public.routes for select using (is_public or auth.uid() = author_id);

drop policy if exists "routes_insert_own" on public.routes;
create policy "routes_insert_own" on public.routes for insert with check (auth.uid() = author_id);

drop policy if exists "routes_update_own" on public.routes;
create policy "routes_update_own" on public.routes for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "routes_delete_own" on public.routes;
create policy "routes_delete_own" on public.routes for delete using (auth.uid() = author_id);

-- Точки маршрута наследуют доступ к маршруту.
drop policy if exists "route_stops_select_visible_route" on public.route_stops;
create policy "route_stops_select_visible_route" on public.route_stops for select using (
  exists (
    select 1 from public.routes r
    where r.id = route_id and (r.is_public or r.author_id = auth.uid())
  )
);

drop policy if exists "route_stops_insert_own_route" on public.route_stops;
create policy "route_stops_insert_own_route" on public.route_stops for insert with check (
  exists (select 1 from public.routes r where r.id = route_id and r.author_id = auth.uid())
);

drop policy if exists "route_stops_update_own_route" on public.route_stops;
create policy "route_stops_update_own_route" on public.route_stops for update using (
  exists (select 1 from public.routes r where r.id = route_id and r.author_id = auth.uid())
) with check (
  exists (select 1 from public.routes r where r.id = route_id and r.author_id = auth.uid())
);

drop policy if exists "route_stops_delete_own_route" on public.route_stops;
create policy "route_stops_delete_own_route" on public.route_stops for delete using (
  exists (select 1 from public.routes r where r.id = route_id and r.author_id = auth.uid())
);

-- Личные сохранения видны и меняются только владельцем.
drop policy if exists "favorites_own" on public.favorites;
create policy "favorites_own" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_posts_own" on public.saved_posts;
create policy "saved_posts_own" on public.saved_posts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_routes_own" on public.saved_routes;
create policy "saved_routes_own" on public.saved_routes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_events_own" on public.saved_events;
create policy "saved_events_own" on public.saved_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

drop trigger if exists routes_touch_updated_at on public.routes;
create trigger routes_touch_updated_at
  before update on public.routes
  for each row execute function public.touch_updated_at();
