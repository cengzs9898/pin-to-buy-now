import { createServerFn } from "@tanstack/react-start";

export type MarketPriceRow = {
  id: string;
  product_id: string;
  title: string;
  brand: string | null;
  image_url: string | null;
  main_category: string | null;
  menu_category: string | null;
  market: string;
  depot_name: string | null;
  price: number;
  unit_price: string | null;
  index_time: string | null;
  updated_at: string;
};

export const listMarketPrices = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ rows: MarketPriceRow[]; lastUpdated: string | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("market_prices")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as MarketPriceRow[];
    const lastUpdated = rows[0]?.updated_at ?? null;
    return { rows, lastUpdated };
  },
);
