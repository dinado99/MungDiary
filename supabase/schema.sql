-- 멍다이어리 Supabase 스키마
-- Supabase 대시보드 → SQL Editor → New query 에 전체를 붙여넣고 Run 하세요.
-- 여러 번 실행해도 안전하게 작성되어 있어요.
-- 표 이름은 모두 mungdiary_ 로 시작해서, 같은 프로젝트에 다른 앱 표를 만들어도 안 겹쳐요.
-- 예전 이름(pets 등)으로 이미 만들었다면 rename-to-mungdiary.sql 을 한 번 실행하세요.

-- ---------- 테이블 ----------
create table if not exists public.mungdiary_pets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  breed      text,
  birthday   date,
  sex        text,
  fur        text,
  reg_no     text,
  note       text,
  created_at timestamptz not null default now()
);

create table if not exists public.mungdiary_vaccines (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pet_id     uuid not null references public.mungdiary_pets (id) on delete cascade,
  name       text not null,
  date       date not null,
  next_date  date,
  hospital   text,
  memo       text,
  created_at timestamptz not null default now()
);

create table if not exists public.mungdiary_weights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pet_id     uuid not null references public.mungdiary_pets (id) on delete cascade,
  date       date not null,
  kg         numeric(6, 2) not null check (kg > 0),
  memo       text,
  created_at timestamptz not null default now()
);

create table if not exists public.mungdiary_meds (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pet_id          uuid not null references public.mungdiary_pets (id) on delete cascade,
  name            text not null,
  kind            text,
  purpose         text,
  dosage          text,
  prescribed_date date,
  hospital        text,
  expiry_date     date,
  storage         text,
  opened_date     date,
  open_days       integer check (open_days >= 0),
  status          text,
  caution         text,
  memo            text,
  created_at      timestamptz not null default now()
);

-- v2: 강아지 생김새, 약 사진
alter table public.mungdiary_pets add column if not exists look jsonb;
alter table public.mungdiary_meds add column if not exists photo_path text;

create index if not exists mungdiary_pets_user_idx     on public.mungdiary_pets (user_id);
create index if not exists mungdiary_vaccines_pet_idx  on public.mungdiary_vaccines (pet_id);
create index if not exists mungdiary_weights_pet_idx   on public.mungdiary_weights (pet_id);
create index if not exists mungdiary_meds_pet_idx      on public.mungdiary_meds (pet_id);

-- ---------- 권한 (Row Level Security) ----------
-- 로그인한 사람은 자기 기록만 읽고 쓸 수 있어요.
-- 웹에 공개되는 anon/publishable 키로는 남의 기록에 접근할 수 없어요.
alter table public.mungdiary_pets     enable row level security;
alter table public.mungdiary_vaccines enable row level security;
alter table public.mungdiary_weights  enable row level security;
alter table public.mungdiary_meds     enable row level security;

drop policy if exists "own pets" on public.mungdiary_pets;
create policy "own pets" on public.mungdiary_pets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "own vaccines" on public.mungdiary_vaccines;
create policy "own vaccines" on public.mungdiary_vaccines
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.mungdiary_pets p where p.id = pet_id and p.user_id = (select auth.uid()))
  );

drop policy if exists "own weights" on public.mungdiary_weights;
create policy "own weights" on public.mungdiary_weights
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.mungdiary_pets p where p.id = pet_id and p.user_id = (select auth.uid()))
  );

drop policy if exists "own meds" on public.mungdiary_meds;
create policy "own meds" on public.mungdiary_meds
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.mungdiary_pets p where p.id = pet_id and p.user_id = (select auth.uid()))
  );

grant select, insert, update, delete on public.mungdiary_pets, public.mungdiary_vaccines, public.mungdiary_weights, public.mungdiary_meds to authenticated;

-- ---------- 약 사진 보관함 (Storage) ----------
-- 비공개 버킷. 파일 경로가 "<내 user id>/..." 인 것만 올리고 보고 지울 수 있어요.
insert into storage.buckets (id, name, public)
values ('med-photos', 'med-photos', false)
on conflict (id) do nothing;

drop policy if exists "own med photos read" on storage.objects;
create policy "own med photos read" on storage.objects
  for select to authenticated
  using (bucket_id = 'med-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "own med photos insert" on storage.objects;
create policy "own med photos insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'med-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "own med photos delete" on storage.objects;
create policy "own med photos delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'med-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
