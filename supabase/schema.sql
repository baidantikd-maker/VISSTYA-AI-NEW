-- Visstya AI — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor

do $$ begin
  create type user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type media_type as enum ('image', 'video');
exception when duplicate_object then null; end $$;
do $$ begin
  create type status_band as enum ('FALSE', 'AVERAGE', 'TRUSTABLE');
exception when duplicate_object then null; end $$;
do $$ begin
  create type is_public as enum ('true', 'false');
exception when duplicate_object then null; end $$;

create table if not exists users (
  id serial primary key,
  "openId" varchar(64) not null unique,
  name text,
  email varchar(320),
  "loginMethod" varchar(64),
  role user_role not null default 'user',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "lastSignedIn" timestamptz not null default now()
);

create table if not exists verification_reports (
  id serial primary key,
  "userId" integer not null references users(id) on delete cascade,
  "mediaUrl" text not null,
  "mediaType" media_type not null,
  "claimEvent" text,
  "claimLocation" text,
  "claimDate" timestamptz,
  "metadataScore" numeric(5, 2) default 0,
  "visionScore" numeric(5, 2) default 0,
  "weatherScore" numeric(5, 2) default 0,
  "evidenceScore" numeric(5, 2) default 0,
  "totalScore" numeric(5, 2) default 0,
  "statusBand" status_band not null,
  "metadataFindings" jsonb,
  "visionFindings" jsonb,
  "weatherFindings" jsonb,
  "evidenceFindings" jsonb,
  summary text,
  "shareToken" varchar(64) unique,
  "isPublic" is_public not null default 'false',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists verification_reports_user_id_idx
  on verification_reports ("userId");

create index if not exists verification_reports_created_at_idx
  on verification_reports ("createdAt" desc);

-- The app uses the server-side database connection, never the Data API.
-- Keep exposed public tables private from anon/authenticated API roles.
alter table public.users enable row level security;
alter table public.verification_reports enable row level security;

-- Optional: auto-create a public users profile when someone signs up via Auth
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users ("openId", email, name, "loginMethod", "lastSignedIn")
  values (
    new.id::text,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_app_meta_data->>'provider', 'supabase'),
    now()
  )
  on conflict ("openId") do update
    set email = excluded.email,
        name = excluded.name,
        "loginMethod" = excluded."loginMethod",
        "lastSignedIn" = now(),
        "updatedAt" = now();
  return new;
end;
$$;

-- Trigger functions run with elevated privileges. They are not an RPC API.
revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Media is deliberately public because the verification workers and shared
-- reports need a stable URL. Uploads are issued only by the backend using the
-- service-role client and are namespaced by user ID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
