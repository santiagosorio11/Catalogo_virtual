-- Catálogo Virtual — esquema inicial
-- Aplica esto una sola vez en tu proyecto Supabase (SQL Editor, o vía scripts/apply-migration.mjs)

create extension if not exists "pgcrypto";

-- ============ CATEGORÍAS ============
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories(id) on delete set null,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============ PRODUCTOS ============
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text,
  description text,
  price numeric(12,2) not null default 0,
  compare_at_price numeric(12,2),
  active boolean not null default true,
  stock_quantity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_categories (
  product_id uuid not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_name text not null,
  option_value text not null,
  price_override numeric(12,2),
  stock_quantity integer not null default 0,
  sku text,
  sort_order integer not null default 0
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

create index if not exists idx_product_categories_product on product_categories(product_id);
create index if not exists idx_product_categories_category on product_categories(category_id);
create index if not exists idx_product_variants_product on product_variants(product_id);
create index if not exists idx_product_images_product on product_images(product_id);
create index if not exists idx_categories_parent on categories(parent_id);

-- ============ CONFIGURACIÓN DE TIENDA (fila única) ============
create table if not exists store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'Mi Tienda',
  logo_url text,
  banner_url text,
  description text,
  whatsapp_number text,
  currency text not null default 'COP',
  updated_at timestamptz not null default now()
);
insert into store_settings (id) values (true) on conflict (id) do nothing;

-- ============ PEDIDOS ============
create sequence if not exists order_number_seq start 1;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer not null default nextval('order_number_seq') unique,
  customer_name text not null,
  customer_phone text not null,
  customer_cedula text not null,
  delivery_method text not null check (delivery_method in ('domicilio','recoger')),
  address text,
  address_details text,
  city text,
  department text,
  notes text,
  status text not null default 'pendiente'
    check (status in ('pendiente','confirmado','preparando','enviado','entregado','cancelado')),
  payment_status text not null default 'pendiente' check (payment_status in ('pendiente','pagado')),
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_label_snapshot text,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null,
  subtotal numeric(12,2) not null
);

create index if not exists idx_orders_status on orders(status);
create index if not exists idx_order_items_order on order_items(order_id);

-- ============ ROW LEVEL SECURITY ============
alter table categories enable row level security;
alter table products enable row level security;
alter table product_categories enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table store_settings enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Lectura pública (catálogo) --
create policy "public read categories" on categories for select using (true);
create policy "public read products active" on products for select using (active = true);
create policy "public read product_categories" on product_categories for select using (true);
create policy "public read product_variants" on product_variants for select using (true);
create policy "public read product_images" on product_images for select using (true);
create policy "public read store_settings" on store_settings for select using (true);

-- Escritura y lectura completa: solo admin autenticado --
create policy "admin all categories" on categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all products" on products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all product_categories" on product_categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all product_variants" on product_variants for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all product_images" on product_images for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all store_settings" on store_settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Pedidos: cualquiera puede crear (checkout sin cuenta), solo admin lee/actualiza --
create policy "public insert orders" on orders for insert with check (true);
create policy "admin select orders" on orders for select using (auth.role() = 'authenticated');
create policy "admin update orders" on orders for update using (auth.role() = 'authenticated');

create policy "public insert order_items" on order_items for insert with check (true);
create policy "admin select order_items" on order_items for select using (auth.role() = 'authenticated');
