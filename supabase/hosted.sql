-- Run this once in the Supabase SQL editor on a shop that already has schema.sql.
-- Moves accounts and the shop logo into the database so the app can run on a host with no disk.

create table if not exists accounts (
  username text primary key,
  email text,
  password_hash text not null,
  active boolean not null default true,
  permissions jsonb not null,
  created_at timestamptz not null default now()
);

alter table inventory_settings add column if not exists logo_base64 text;
alter table inventory_settings add column if not exists logo_content_type text;
alter table inventory_settings add column if not exists logo_updated_at timestamptz;

alter table accounts enable row level security;

revoke all on accounts from public, anon, authenticated;
grant select, insert, update, delete on accounts to service_role;

notify pgrst, 'reload schema';
