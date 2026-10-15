-- Run this once on the existing Kugi database.
-- The public anon key must not read or change shop data.
-- The Next.js server uses the service role key after the account permission check.

revoke all on products from anon, authenticated;
revoke all on stock_movements from anon, authenticated;
revoke all on inventory_settings from anon, authenticated;

do $$
begin
  if to_regclass('public.accounts') is not null then
    revoke all on accounts from public, anon, authenticated;
    grant select, insert, update, delete on accounts to service_role;
  end if;
end $$;

revoke all on function record_stock_movement(uuid, text, integer, text, text, text, text) from public, anon, authenticated;
revoke all on function remove_product(uuid) from public, anon, authenticated;

drop policy if exists demo_read_products on products;
drop policy if exists demo_insert_products on products;
drop policy if exists demo_update_products on products;
drop policy if exists demo_read_movements on stock_movements;
drop policy if exists demo_read_settings on inventory_settings;
drop policy if exists demo_update_settings on inventory_settings;

grant select, insert, update, delete on products to service_role;
grant select, insert, update, delete on stock_movements to service_role;
grant select, update on inventory_settings to service_role;
grant execute on function record_stock_movement(uuid, text, integer, text, text, text, text) to service_role;
grant execute on function remove_product(uuid) to service_role;

notify pgrst, 'reload schema';
