-- オアシス メニューサイト：Supabase スキーマ
-- Supabase ダッシュボード → SQL Editor に貼り付けて実行してください。
-- その後 seed.sql を実行すると Excel の初期データが入ります。

-- ───────── テーブル ─────────
create table if not exists public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  sort_order  integer not null default 0,
  category    text    not null default 'rice',      -- rice / ramen / udon / soba / other
  name        jsonb   not null default '{}'::jsonb, -- {"ja": "...", "en": "...", ...}
  description jsonb   not null default '{}'::jsonb,
  price       integer,
  image_url   text    not null default '',
  allergens   jsonb   not null default '{}'::jsonb, -- {"wheat": "contains", "shrimp": "may"}
  is_visible  boolean not null default true,
  is_sold_out boolean not null default false,
  updated_at  timestamptz not null default now()
);

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- 管理画面にログインできるメールアドレス（ここに登録した人だけが編集可能）
create table if not exists public.admins (
  email text primary key
);

-- ───────── 管理者判定 ─────────
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

-- ───────── RLS（誰でも閲覧可・管理者のみ編集可）─────────
alter table public.menu_items    enable row level security;
alter table public.site_settings enable row level security;
alter table public.admins        enable row level security;

drop policy if exists "menu read"    on public.menu_items;
drop policy if exists "menu write"   on public.menu_items;
drop policy if exists "settings read"  on public.site_settings;
drop policy if exists "settings write" on public.site_settings;
drop policy if exists "admins self"  on public.admins;

create policy "menu read"  on public.menu_items for select using (is_visible or public.is_admin());
create policy "menu write" on public.menu_items for all    using (public.is_admin()) with check (public.is_admin());
create policy "settings read"  on public.site_settings for select using (true);
create policy "settings write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "admins self" on public.admins for select using (public.is_admin());

-- ───────── 画像ストレージ ─────────
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

drop policy if exists "menu images read"   on storage.objects;
drop policy if exists "menu images write"  on storage.objects;
drop policy if exists "menu images update" on storage.objects;
drop policy if exists "menu images delete" on storage.objects;

create policy "menu images read"   on storage.objects for select using (bucket_id = 'menu-images');
create policy "menu images write"  on storage.objects for insert with check (bucket_id = 'menu-images' and public.is_admin());
create policy "menu images update" on storage.objects for update using (bucket_id = 'menu-images' and public.is_admin());
create policy "menu images delete" on storage.objects for delete using (bucket_id = 'menu-images' and public.is_admin());

-- ───────── 管理者の登録 ─────────
-- 管理サイトにはこのアドレス＋パスワードでログインする（内部用アドレスなのでメールは届かない）。
insert into public.admins (email) values ('admin@oasis-menu.example.com') on conflict do nothing;
