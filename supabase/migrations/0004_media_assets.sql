-- Registro de archivos subidos a Cloudflare R2 (productos, categorías, logo/banner).
-- El archivo en sí vive en R2; esta tabla es el índice/auditoría dentro de Supabase.

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  r2_key text not null unique,
  url text not null,
  filename text,
  content_type text,
  size_bytes integer,
  entity_type text not null check (entity_type in ('product', 'category', 'store_logo', 'store_banner')),
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_media_assets_entity on media_assets(entity_type, entity_id);

alter table media_assets enable row level security;

create policy "admin all media_assets" on media_assets for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
