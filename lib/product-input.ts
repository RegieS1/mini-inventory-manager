export type ProductInput = {
  name: string;
  sku: string;
  description: string;
  category: string;
  supplier: string;
  costPrice: string;
  sellingPrice: string;
  threshold: string;
};

export type ParsedProduct =
  | {
      ok: true;
      value: {
        name: string;
        sku: string;
        description: string | null;
        category: string | null;
        supplier: string | null;
        cost_price: number;
        selling_price: number | null;
        low_stock_threshold: number;
      };
    }
  | { ok: false; error: string };

function money(value: string, label: string, required: boolean) {
  if (!value) {
    return required ? { ok: false as const, error: `${label} is required.` } : { ok: true as const, amount: null };
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false as const, error: `${label} must be zero or greater.` };
  }

  return { ok: true as const, amount };
}

export function parseProductInput(input: ProductInput): ParsedProduct {
  const name = input.name.trim();
  const sku = input.sku.trim();
  const description = input.description.trim();
  const category = input.category.trim();
  const supplier = input.supplier.trim();

  if (!name) {
    return { ok: false, error: "Product name is required." };
  }

  if (!sku) {
    return { ok: false, error: "SKU is required." };
  }

  const cost = money(input.costPrice.trim(), "Cost price", true);
  if (!cost.ok) {
    return cost;
  }

  const selling = money(input.sellingPrice.trim(), "Selling price", false);
  if (!selling.ok) {
    return selling;
  }

  const thresholdText = input.threshold.trim();
  const threshold = Number(thresholdText);

  if (!thresholdText || !Number.isInteger(threshold) || threshold < 0) {
    return { ok: false, error: "Low-stock threshold must be a whole number, zero or greater." };
  }

  return {
    ok: true,
    value: {
      name,
      sku,
      description: description || null,
      category: category || null,
      supplier: supplier || null,
      cost_price: cost.amount ?? 0,
      selling_price: selling.amount,
      low_stock_threshold: threshold,
    },
  };
}
