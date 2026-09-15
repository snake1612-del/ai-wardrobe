create extension if not exists pg_trgm with schema extensions;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  parent_id uuid references public.categories(id) on delete restrict,
  label_ru text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  constraint categories_code_nonblank check (btrim(code) <> ''),
  constraint categories_label_nonblank check (btrim(label_ru) <> ''),
  constraint categories_sort_nonnegative check (sort_order >= 0),
  constraint categories_not_self_parent check (parent_id is null or parent_id <> id)
);

create table public.colors (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_ru text not null,
  hex_hint char(7),
  is_active boolean not null default true,
  constraint colors_code_nonblank check (btrim(code) <> ''),
  constraint colors_label_nonblank check (btrim(label_ru) <> ''),
  constraint colors_hex_shape check (hex_hint is null or hex_hint ~ '^#[0-9A-Fa-f]{6}$')
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_ru text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  constraint seasons_code_nonblank check (btrim(code) <> ''),
  constraint seasons_label_nonblank check (btrim(label_ru) <> ''),
  constraint seasons_sort_nonnegative check (sort_order >= 0)
);
