-- 멍다이어리 Supabase 스키마
-- Supabase 대시보드 → SQL Editor → New query 에 전체를 붙여넣고 Run 하세요.
-- 여러 번 실행해도 안전하게 작성되어 있어요.

-- ---------- 테이블 ----------
create table if not exists public.pets (
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

create table if not exists public.vaccines (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pet_id     uuid not null references public.pets (id) on delete cascade,
  name       text not null,
  date       date not null,
  next_date  date,
  hospital   text,
  memo       text,
  created_at timestamptz not null default now()
);

create table if not exists public.weights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pet_id     uuid not null references public.pets (id) on delete cascade,
  date       date not null,
  kg         numeric(6, 2) not null check (kg > 0),
  memo       text,
  created_at timestamptz not null default now()
);

create table if not exists public.meds (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pet_id          uuid not null references public.pets (id) on delete cascade,
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

create index if not exists pets_user_idx     on public.pets (user_id);
create index if not exists vaccines_pet_idx  on public.vaccines (pet_id);
create index if not exists weights_pet_idx   on public.weights (pet_id);
create index if not exists meds_pet_idx      on public.meds (pet_id);

-- ---------- 권한 (Row Level Security) ----------
-- 로그인한 사람은 자기 기록만 읽고 쓸 수 있어요.
-- 웹에 공개되는 anon/publishable 키로는 남의 기록에 접근할 수 없어요.
alter table public.pets     enable row level security;
alter table public.vaccines enable row level security;
alter table public.weights  enable row level security;
alter table public.meds     enable row level security;

drop policy if exists "own pets" on public.pets;
create policy "own pets" on public.pets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "own vaccines" on public.vaccines;
create policy "own vaccines" on public.vaccines
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.pets p where p.id = pet_id and p.user_id = (select auth.uid()))
  );

drop policy if exists "own weights" on public.weights;
create policy "own weights" on public.weights
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.pets p where p.id = pet_id and p.user_id = (select auth.uid()))
  );

drop policy if exists "own meds" on public.meds;
create policy "own meds" on public.meds
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.pets p where p.id = pet_id and p.user_id = (select auth.uid()))
  );

grant select, insert, update, delete on public.pets, public.vaccines, public.weights, public.meds to authenticated;
