-- Visstya AI — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor

create type user_role as enum ('user', 'admin');
create type media_type as enum ('image', 'video');
create type status_band as enum ('FALSE', 'AVERAGE', 'TRUSTABLE');
create type is_public as enum ('true', 'false');

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Storage: create a public bucket named "media" in the Storage UI,
-- or uncomment below if your project allows storage.buckets inserts:
-- insert into storage.buckets (id, name, public)
-- values ('media', 'media', true)
-- on conflict (id) do nothing;
