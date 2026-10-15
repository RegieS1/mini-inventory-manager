-- Run this once on an existing StockFlow database.
-- A product with no stock history is deleted.
-- A product with history is marked inactive so the ledger stays intact.

create or replace function remove_product(p_product_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_count integer;
begin
  select id
  into v_id
  from products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found.';
  end if;

  select count(*)
  into v_count
  from stock_movements
  where product_id = p_product_id;

  if v_count > 0 then
    update products
    set is_active = false
    where id = p_product_id;

    return 'deactivated';
  end if;

  delete from products
  where id = p_product_id;

  return 'deleted';
end;
$$;

revoke all on function remove_product(uuid) from public;
grant execute on function remove_product(uuid) to anon, authenticated;
