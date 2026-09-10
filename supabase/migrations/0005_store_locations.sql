-- Sedes de la tienda y enrutamiento de pedidos por WhatsApp.

create table if not exists public.store_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text,
  department text,
  whatsapp_number text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_store_locations_active_order
  on public.store_locations(active, sort_order);

alter table public.store_locations enable row level security;

drop policy if exists "public read active store locations" on public.store_locations;
create policy "public read active store locations"
  on public.store_locations for select
  using (active = true);

drop policy if exists "admin all store locations" on public.store_locations;
create policy "admin all store locations"
  on public.store_locations for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

alter table public.orders
  add column if not exists location_id uuid references public.store_locations(id) on delete set null,
  add column if not exists location_name_snapshot text,
  add column if not exists location_address_snapshot text,
  add column if not exists location_whatsapp_snapshot text;

create index if not exists idx_orders_location on public.orders(location_id);

drop function if exists public.create_order_with_items(
  text, text, text, text, text, text, text, text, text, numeric, numeric, jsonb
);

create or replace function public.create_order_with_items(
  p_customer_name text,
  p_customer_cedula text,
  p_customer_phone text,
  p_delivery_method text,
  p_address text,
  p_address_details text,
  p_city text,
  p_department text,
  p_notes text,
  p_subtotal numeric,
  p_total numeric,
  p_location_id uuid,
  p_items jsonb
) returns table(
  id uuid,
  order_number integer,
  location_name text,
  location_address text,
  whatsapp_number text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number integer;
  v_location public.store_locations%rowtype;
  v_fallback_whatsapp text;
  item jsonb;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos.';
  end if;

  if p_location_id is not null then
    select * into v_location
    from public.store_locations
    where store_locations.id = p_location_id and store_locations.active = true;

    if not found then
      raise exception 'La sede seleccionada no está disponible.';
    end if;
  elsif exists (select 1 from public.store_locations where active = true) then
    raise exception 'Selecciona una sede para continuar.';
  end if;

  select store_settings.whatsapp_number into v_fallback_whatsapp
  from public.store_settings
  where store_settings.id = true;

  insert into public.orders (
    customer_name, customer_cedula, customer_phone, delivery_method,
    address, address_details, city, department, notes, subtotal, total,
    location_id, location_name_snapshot, location_address_snapshot,
    location_whatsapp_snapshot
  )
  values (
    p_customer_name, p_customer_cedula, p_customer_phone, p_delivery_method,
    p_address, p_address_details, p_city, p_department, p_notes, p_subtotal, p_total,
    v_location.id, v_location.name, v_location.address, v_location.whatsapp_number
  )
  returning orders.id, orders.order_number into v_order_id, v_order_number;

  for item in select * from jsonb_array_elements(p_items) loop
    insert into public.order_items (
      order_id, product_id, variant_id, product_name_snapshot,
      variant_label_snapshot, quantity, unit_price, subtotal
    )
    values (
      v_order_id,
      nullif(item->>'product_id', '')::uuid,
      nullif(item->>'variant_id', '')::uuid,
      item->>'product_name_snapshot',
      item->>'variant_label_snapshot',
      (item->>'quantity')::integer,
      (item->>'unit_price')::numeric,
      (item->>'subtotal')::numeric
    );
  end loop;

  return query select
    v_order_id,
    v_order_number,
    v_location.name,
    v_location.address,
    coalesce(v_location.whatsapp_number, v_fallback_whatsapp);
end;
$$;

grant execute on function public.create_order_with_items(
  text, text, text, text, text, text, text, text, text, numeric, numeric, uuid, jsonb
) to anon, authenticated;
