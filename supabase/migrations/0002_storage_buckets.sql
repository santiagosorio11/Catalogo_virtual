insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

create policy "public read product-images" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "admin write product-images" on storage.objects for all
  using (bucket_id = 'product-images' and auth.role() = 'authenticated')
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "public read store-assets" on storage.objects for select
  using (bucket_id = 'store-assets');
create policy "admin write store-assets" on storage.objects for all
  using (bucket_id = 'store-assets' and auth.role() = 'authenticated')
  with check (bucket_id = 'store-assets' and auth.role() = 'authenticated');
