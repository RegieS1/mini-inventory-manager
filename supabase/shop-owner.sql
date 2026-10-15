-- Run this once in the Supabase SQL editor on a shop that already has schema.sql.
-- Adds supplier, stock-out reason, and replaces record_stock_movement.

alter table products add column if not exists supplier text;

alter table stock_movements add column if not exists reason text;

alter table stock_movements drop constraint if exists stock_movements_reason;
alter table stock_movements add constraint stock_movements_reason check (
  reason is null or reason in ('sold', 'damaged', 'shop', 'correction')
);

drop function if exists record_stock_movement(uuid, text, integer, text, text, text);

create or replace function record_stock_movement(
  p_product_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_note text default null,
  p_created_by text default null,
  p_adjustment_direction text default null,
  p_reason text default null
)
returns stock_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_before integer;
  v_after integer;
  v_movement stock_movements;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if p_movement_type not in ('IN', 'OUT', 'ADJUSTMENT') then
    raise exception 'Movement type must be IN, OUT, or ADJUSTMENT.';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be a positive whole number.';
  end if;

  if p_movement_type = 'ADJUSTMENT' then
    if p_adjustment_direction not in ('increase', 'decrease') then
      raise exception 'Adjustments require a direction of increase or decrease, and a note.';
    end if;
    if v_note is null then
      raise exception 'Adjustments require a note.';
    end if;
  elsif p_adjustment_direction is not null then
    raise exception 'Direction is only used for adjustments.';
  end if;

  if p_movement_type = 'OUT' then
    if p_reason is null or p_reason not in ('sold', 'damaged', 'shop', 'correction') then
      raise exception 'Stock out requires a reason: sold, damaged, shop, or correction.';
    end if;
  elsif p_reason is not null then
    raise exception 'Reason is only used for stock out.';
  end if;

  select *
  into v_product
  from products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found.';
  end if;

  if not v_product.is_active then
    raise exception 'Inactive products cannot receive stock movements.';
  end if;

  v_before := v_product.quantity_on_hand;

  if p_movement_type = 'IN' or p_adjustment_direction = 'increase' then
    v_after := v_before + p_quantity;
  else
    v_after := v_before - p_quantity;
  end if;

  if v_after < 0 then
    raise exception 'Stock cannot become negative. Available quantity is %.', v_before;
  end if;

  perform set_config('stockflow.allow_quantity_update', 'on', true);

  update products
  set quantity_on_hand = v_after
  where id = p_product_id;

  insert into stock_movements (
    product_id,
    movement_type,
    quantity,
    quantity_before,
    quantity_after,
    note,
    reason,
    created_by
  )
  values (
    p_product_id,
    p_movement_type,
    p_quantity,
    v_before,
    v_after,
    v_note,
    case when p_movement_type = 'OUT' then p_reason else null end,
    p_created_by
  )
  returning * into v_movement;

  return v_movement;
end;
$$;

revoke all on function record_stock_movement(uuid, text, integer, text, text, text, text) from public, anon, authenticated;
grant execute on function record_stock_movement(uuid, text, integer, text, text, text, text) to service_role;
