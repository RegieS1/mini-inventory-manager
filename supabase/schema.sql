-- Kugi schema.
-- The public anon key cannot read or change shop data.
-- The Next.js server uses the service role key after the account permission check.

create extension if not exists pgcrypto;

create table inventory_settings (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null,
  default_low_stock_threshold integer not null default 5 check (default_low_stock_threshold >= 0),
  currency_code text not null default 'PHP',
  updated_at timestamptz not null default now(),
  -- One settings row for the single shop in version 1.
  singleton boolean not null default true unique,
  logo_base64 text,
  logo_content_type text,
  logo_updated_at timestamptz
);

create table accounts (
  username text primary key,
  email text,
  password_hash text not null,
  active boolean not null default true,
  permissions jsonb not null,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null,
  description text,
  category text,
  supplier text,
  cost_price numeric(12, 2) not null check (cost_price >= 0),
  selling_price numeric(12, 2) check (selling_price is null or selling_price >= 0),
  low_stock_threshold integer not null check (low_stock_threshold >= 0),
  -- Balance of stock. Change it only inside record_stock_movement.
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_sku_unique unique (sku)
);

create index products_name_lower_idx on products (lower(name));

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id),
  movement_type text not null check (movement_type in ('IN', 'OUT', 'ADJUSTMENT')),
  quantity integer not null check (quantity > 0),
  quantity_before integer not null check (quantity_before >= 0),
  quantity_after integer not null check (quantity_after >= 0),
  note text,
  reason text,
  created_at timestamptz not null default now(),
  created_by text,
  constraint stock_movements_reason check (
    reason is null or reason in ('sold', 'damaged', 'shop', 'correction')
  ),
  constraint stock_movements_adjustment_note check (
    movement_type <> 'ADJUSTMENT'
    or (note is not null and length(btrim(note)) > 0)
  )
);

create index stock_movements_product_created_idx
  on stock_movements (product_id, created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on products
for each row
execute function set_updated_at();

create trigger inventory_settings_set_updated_at
before update on inventory_settings
for each row
execute function set_updated_at();

-- Blocks quantity edits from the product form and from direct table updates.
create or replace function guard_quantity_on_hand()
returns trigger
language plpgsql
as $$
declare
  quantity_change_allowed boolean := coalesce(current_setting('stockflow.allow_quantity_update', true), '') = 'on';
begin
  if tg_op = 'INSERT' then
    if new.quantity_on_hand <> 0 and not quantity_change_allowed then
      raise exception 'New products start at zero. Add stock with record_stock_movement.';
    end if;
    return new;
  end if;

  if new.quantity_on_hand is distinct from old.quantity_on_hand and not quantity_change_allowed then
    raise exception 'Quantity can only change through record_stock_movement.';
  end if;

  return new;
end;
$$;

create trigger products_guard_quantity
before insert or update on products
for each row
execute function guard_quantity_on_hand();

-- Updates the balance and writes history in one transaction.
-- p_adjustment_direction is required for ADJUSTMENT and must be null otherwise.
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

-- Deletes a product that has no stock history.
-- A product with history is deactivated so the ledger stays intact.
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

revoke all on function remove_product(uuid) from public, anon, authenticated;
grant execute on function remove_product(uuid) to service_role;

alter table products enable row level security;
alter table stock_movements enable row level security;
alter table inventory_settings enable row level security;
alter table accounts enable row level security;

revoke all on products from anon, authenticated;
revoke all on stock_movements from anon, authenticated;
revoke all on inventory_settings from anon, authenticated;
revoke all on accounts from public, anon, authenticated;

grant select, insert, update, delete on products to service_role;
grant select, insert, update, delete on stock_movements to service_role;
grant select, update on inventory_settings to service_role;
grant select, insert, update, delete on accounts to service_role;
