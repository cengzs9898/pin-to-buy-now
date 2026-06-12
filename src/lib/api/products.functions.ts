import { createServerFn } from "@tanstack/react-start";

type CreateProductInput = {
  name: string;
  category?: string;
  price: number;
  currency?: string;
  description?: string;
  image_url?: string;
  stock?: number;
};

export const listMyProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { readSession } = await import("@/lib/server/session.server");
  const { TABLES, listRecords, esc } = await import("@/lib/server/airtable.server");
  const s = await readSession();
  if (!s || s.role !== "seller") throw new Error("Sadece satıcılar erişebilir.");
  const { records } = await listRecords(TABLES.Products, {
    filterByFormula: `LOWER({seller_email}) = "${esc(s.email)}"`,
    pageSize: 100,
    sort: [{ field: "created_at", direction: "desc" }],
  });
  return records;
});

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((input: CreateProductInput) => {
    if (!input?.name?.trim()) throw new Error("Ürün adı zorunlu.");
    if (typeof input.price !== "number" || input.price < 0) throw new Error("Geçerli fiyat girin.");
    return input;
  })
  .handler(async ({ data }) => {
    const { readSession } = await import("@/lib/server/session.server");
    const { TABLES, countRecords, createRecord, esc, PRODUCT_LIMIT_PER_SELLER } = await import(
      "@/lib/server/airtable.server"
    );
    const s = await readSession();
    if (!s || s.role !== "seller") throw new Error("Sadece satıcılar ekleyebilir.");

    const count = await countRecords(TABLES.Products, `LOWER({seller_email}) = "${esc(s.email)}"`);
    if (count >= PRODUCT_LIMIT_PER_SELLER) {
      throw new Error(`Ürün limiti aşıldı (maks ${PRODUCT_LIMIT_PER_SELLER}).`);
    }

    return createRecord(TABLES.Products, {
      name: data.name.trim(),
      seller_email: s.email,
      category: data.category ?? "",
      price: data.price,
      currency: data.currency ?? "TRY",
      description: data.description ?? "",
      image_url: data.image_url ?? "",
      stock: data.stock ?? 0,
      is_active: true,
      created_at: new Date().toISOString(),
    });
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id gerekli.");
    return input;
  })
  .handler(async ({ data }) => {
    const { readSession } = await import("@/lib/server/session.server");
    const { TABLES, listRecords, deleteRecord, esc } = await import("@/lib/server/airtable.server");
    const s = await readSession();
    if (!s || s.role !== "seller") throw new Error("Yetkisiz.");
    // Verify ownership
    const { records } = await listRecords<{ seller_email?: string }>(TABLES.Products, {
      filterByFormula: `RECORD_ID() = "${esc(data.id)}"`,
      maxRecords: 1,
    });
    const rec = records[0];
    if (!rec || (rec.fields.seller_email ?? "").toLowerCase() !== s.email) throw new Error("Yetkisiz.");
    return deleteRecord(TABLES.Products, data.id);
  });
