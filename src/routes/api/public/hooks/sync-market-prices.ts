import { createFileRoute } from "@tanstack/react-router";
import { SYNC_KEYWORDS } from "@/lib/market-prices-config";

type DepotInfo = {
  depotId?: string;
  depotName?: string;
  price?: number;
  unitPrice?: string;
  marketAdi?: string;
  indexTime?: string;
};
type ApiProduct = {
  id: string;
  title: string;
  brand?: string;
  imageUrl?: string;
  main_category?: string;
  menu_category?: string;
  productDepotInfoList?: DepotInfo[];
};
type ApiResp = { content?: ApiProduct[] };

async function fetchKeyword(keyword: string, size = 10): Promise<ApiProduct[]> {
  const res = await fetch("https://api.marketfiyati.org.tr/api/v2/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({ keywords: keyword, pages: 0, size }),
  });
  if (!res.ok) return [];
  const j = (await res.json()) as ApiResp;
  return j.content ?? [];
}

export const Route = createFileRoute("/api/public/hooks/sync-market-prices")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date().toISOString();
        type Row = {
          id: string;
          product_id: string;
          title: string;
          brand: string | null;
          image_url: string | null;
          main_category: string | null;
          menu_category: string | null;
          market: string;
          depot_id: string;
          depot_name: string | null;
          price: number;
          unit_price: string | null;
          index_time: string | null;
          updated_at: string;
        };
        const rows: Row[] = [];
        const seen = new Set<string>();

        for (const kw of SYNC_KEYWORDS) {
          try {
            const products = await fetchKeyword(kw, 8);
            for (const p of products) {
              const depots = p.productDepotInfoList ?? [];
              for (const d of depots) {
                const market = (d.marketAdi ?? "").toLowerCase();
                const depotId = d.depotId ?? "";
                const rowId = `${p.id}|${depotId}`;
                if (!market || !depotId || seen.has(rowId)) continue;
                seen.add(rowId);
                rows.push({
                  id: rowId,
                  product_id: p.id,
                  title: p.title,
                  brand: p.brand ?? null,
                  image_url: p.imageUrl ?? null,
                  main_category: p.main_category ?? null,
                  menu_category: p.menu_category ?? null,
                  market,
                  depot_id: depotId,
                  depot_name: d.depotName ?? null,
                  price: d.price ?? 0,
                  unit_price: d.unitPrice ?? null,
                  index_time: d.indexTime ?? null,
                  updated_at: now,
                });
              }
            }
          } catch (e) {
            console.error("sync error", kw, e);
          }
          await new Promise((r) => setTimeout(r, 150));
        }

        // Upsert in chunks
        let upserted = 0;
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { error } = await supabaseAdmin.from("market_prices").upsert(chunk, { onConflict: "id" });
          if (error) {
            return new Response(JSON.stringify({ ok: false, error: error.message, upserted }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
          upserted += chunk.length;
        }

        return new Response(
          JSON.stringify({ ok: true, upserted, keywords: SYNC_KEYWORDS.length, at: now }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
