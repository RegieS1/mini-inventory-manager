-- Development seed for Bayani Moto Parts.
-- Run supabase/schema.sql first.
-- Run this once on an empty movement ledger. It refuses to run twice.

do $$
begin
  if exists (select 1 from stock_movements) then
    raise exception 'Seed aborted: stock_movements already has rows.';
  end if;
end $$;

insert into inventory_settings (shop_name, default_low_stock_threshold, currency_code)
select 'Bayani Moto Parts', 5, 'PHP'
where not exists (select 1 from inventory_settings);

insert into products (name, sku, description, category, cost_price, selling_price, low_stock_threshold)
values
  ('Brake Pad Set', 'BP-041', 'Front brake pads for common underbone models.', 'Brakes', 420, 650, 5),
  ('Chain 428H', 'CH-428', null, 'Drive', 890, 1250, 3),
  ('Oil Filter', 'OF-110', null, 'Engine', 150, 240, 6),
  ('Spark Plug NGK', 'SP-NGK', null, 'Engine', 95, 160, 8),
  ('Engine Oil 10W-40', 'EO-1040', null, 'Fluids', 280, 420, 5),
  ('LED Headlight', 'HL-LED', null, 'Electrical', 1150, 1680, 4)
on conflict (sku) do nothing;

-- Each call updates quantity_on_hand and writes one history row.
select record_stock_movement((select id from products where sku = 'BP-041'), 'IN', 12, 'Opening balance');
select record_stock_movement((select id from products where sku = 'BP-041'), 'OUT', 10, 'Counter sale', null, null, 'sold');

select record_stock_movement((select id from products where sku = 'CH-428'), 'IN', 2, 'Opening balance');
select record_stock_movement((select id from products where sku = 'CH-428'), 'OUT', 2, 'Counter sale', null, null, 'sold');

select record_stock_movement((select id from products where sku = 'OF-110'), 'IN', 6, 'Opening balance');
select record_stock_movement((select id from products where sku = 'OF-110'), 'OUT', 5, 'Counter sale', null, null, 'sold');

select record_stock_movement((select id from products where sku = 'SP-NGK'), 'IN', 5, 'Opening balance');
select record_stock_movement((select id from products where sku = 'SP-NGK'), 'ADJUSTMENT', 1, 'Count correction', null, 'decrease');

select record_stock_movement((select id from products where sku = 'EO-1040'), 'IN', 24, 'Opening balance');
select record_stock_movement((select id from products where sku = 'EO-1040'), 'IN', 12, 'Restock');

select record_stock_movement((select id from products where sku = 'HL-LED'), 'IN', 9, 'Opening balance');
select record_stock_movement((select id from products where sku = 'HL-LED'), 'OUT', 1, 'Counter sale', null, null, 'sold');
