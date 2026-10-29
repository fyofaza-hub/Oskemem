-- Oskemen Culture · Локации сообщества в таблице public.places.
--
-- Места, добавленные участниками через приложение, дублируются в базу,
-- чтобы карта не «исчезала» при первом запуске на другом устройстве
-- (например, на Vercel, где localStorage пуст).
--
-- Как применить: Supabase Dashboard → SQL Editor → вставить этот файл.
-- Требует выполненной схемы supabase/schema.sql.

-- Автор добавленного места (для Google-сессий).
alter table public.places
  add column if not exists created_by uuid references public.profiles (id) on delete set null;

-- Чтение уже открыто всем (places_select_all). Добавляем запись:
-- аутентифицированные пользователи могут добавлять локации.
drop policy if exists "places_insert_authenticated" on public.places;
create policy "places_insert_authenticated" on public.places
  for insert to authenticated
  with check (true);

-- Изменять и удалять можно только своё место (или сервисная роль).
drop policy if exists "places_update_own" on public.places;
create policy "places_update_own" on public.places
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "places_delete_own" on public.places;
create policy "places_delete_own" on public.places
  for delete to authenticated
  using (created_by = auth.uid());
