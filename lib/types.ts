export type MovementType = "IN" | "OUT" | "ADJUSTMENT";

export type AdjustmentDirection = "increase" | "decrease";

export type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  supplier: string | null;
  cost_price: number;
  selling_price: number | null;
  low_stock_threshold: number;
  quantity_on_hand: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StockMovement = {
  id: string;
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  note: string | null;
  created_at: string;
  created_by: string | null;
};

export type InventorySettings = {
  id: string;
  shop_name: string;
  default_low_stock_threshold: number;
  currency_code: string;
  updated_at: string;
};
