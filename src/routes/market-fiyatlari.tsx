import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { listMarketPrices, type MarketPriceRow } from "@/lib/api/market-prices.functions";

export const Route = createFileRoute("/market-fiyatlari")({
  head: () => ({
    meta: [
      { title: "Market Fiyatları — Pintos" },
      {
        name: "description",
        content:
          "Türkiye'nin büyük marketlerindeki ürün fiyatları — kategori, market ve güncellenme tarihine göre haftalık olarak listelenir.",
      },
      { property: "og:title", content: "Market Fiyatları — Pintos" },
      { property: "og:description", content: "Haftalık güncellenen market fiyat karşılaştırması." },
    ],
  }),
  loader: async (): Promise<{ rows: MarketPriceRow[]; lastUpdated: string | null }> =>
    (await listMarketPrices()) as { rows: MarketPriceRow[]; lastUpdated: string | null },
  component: MarketPricesPage,
});

function fmtTL(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);
}

function MarketPricesPage() {
  const { rows, lastUpdated } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [market, setMarket] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const markets = useMemo(
    () => Array.from(new Set(rows.map((r) => r.market))).sort(),
    [rows],
  );
  const categories = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.menu_category).filter((c): c is string => Boolean(c))),
      ).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r: MarketPriceRow) => {
      if (market && r.market !== market) return false;
      if (category && r.menu_category !== category) return false;
      if (ql && !r.title.toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [rows, q, market, category]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Market Fiyatları</h1>
            <p className="text-sm text-muted-foreground">
              Kaynak: marketfiyati.org.tr · Haftalık otomatik güncellenir
              {lastUpdated && (
                <> · Son senkron: {new Date(lastUpdated).toLocaleString("tr-TR")}</>
              )}
            </p>
          </div>
          <Link to="/" className="text-sm underline">
            Ana sayfa
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ürün ara (örn. süt, ekmek, kola)"
            className="md:col-span-2 border border-border rounded-md px-3 py-2 bg-background"
          />
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="border border-border rounded-md px-3 py-2 bg-background capitalize"
          >
            <option value="">Tüm marketler</option>
            {markets.map((m) => (
              <option key={m} value={m} className="capitalize">
                {m}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-border rounded-md px-3 py-2 bg-background"
          >
            <option value="">Tüm kategoriler</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Henüz veri yok. Haftalık senkron çalıştığında burada listelenecek.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2">Ürün</th>
                  <th className="px-3 py-2">Kategori</th>
                  <th className="px-3 py-2">Market</th>
                  <th className="px-3 py-2 text-right">Fiyat</th>
                  <th className="px-3 py-2">Birim</th>
                  <th className="px-3 py-2">Güncellenme</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 500).map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {r.image_url && (
                          <img
                            src={r.image_url}
                            alt=""
                            className="h-8 w-8 object-contain rounded bg-white"
                            loading="lazy"
                          />
                        )}
                        <div>
                          <div className="font-medium">{r.title}</div>
                          {r.brand && (
                            <div className="text-xs text-muted-foreground">{r.brand}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.menu_category ?? "—"}
                    </td>
                    <td className="px-3 py-2 capitalize">{r.market}</td>
                    <td className="px-3 py-2 text-right font-semibold">{fmtTL(r.price)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.unit_price ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.index_time ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 500 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                {filtered.length} sonuçtan ilk 500 gösteriliyor. Filtreleri daralt.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
