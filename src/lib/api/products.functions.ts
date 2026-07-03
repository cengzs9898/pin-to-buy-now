import { createServerFn } from "@tanstack/react-start";

type CreateProductInput = {
  name: string;
  price: number;
  image_url?: string;
  token?: string;
};

export const listMyProducts = createServerFn({ method: "POST" })
  .inputValidator((input: { token?: string } | undefined) => ({ token: input?.token }))
  .handler(async ({ data }) => {
    const { resolveSession } = await import("@/lib/server/session.server");
    const { TABLES, listRecords, esc } = await import("@/lib/server/airtable.server");
    const s = await resolveSession(data.token);
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
    const price = typeof input.price === "number" ? input.price : Number(input.price);
    if (!Number.isFinite(price) || price < 0) throw new Error("Geçerli fiyat girin.");
    return {
      name: input.name.trim(),
      price,
      image_url: input.image_url?.trim() ?? "",
      token: input.token,
    };
  })
  .handler(async ({ data }) => {
    const { resolveSession } = await import("@/lib/server/session.server");
    const { TABLES, countRecords, createRecord, esc, PRODUCT_LIMIT_PER_SELLER } = await import(
      "@/lib/server/airtable.server"
    );
    const s = await resolveSession(data.token);
    if (!s || s.role !== "seller") throw new Error("Sadece satıcılar ekleyebilir.");

    const count = await countRecords(TABLES.Products, `LOWER({seller_email}) = "${esc(s.email)}"`);
    if (count >= PRODUCT_LIMIT_PER_SELLER) {
      throw new Error(`Ürün limiti aşıldı (maks ${PRODUCT_LIMIT_PER_SELLER}).`);
    }

    return createRecord(TABLES.Products, {
      name: data.name,
      seller_email: s.email,
      price: data.price,
      currency: "TRY",
      image_url: data.image_url,
      is_active: true,
      created_at: new Date().toISOString(),
    });
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; token?: string }) => {
    if (!input?.id) throw new Error("id gerekli.");
    return { id: input.id, token: input.token };
  })
  .handler(async ({ data }) => {
    const { resolveSession } = await import("@/lib/server/session.server");
    const { TABLES, listRecords, deleteRecord, esc } = await import("@/lib/server/airtable.server");
    const s = await resolveSession(data.token);
    if (!s || s.role !== "seller") throw new Error("Yetkisiz.");
    const { records } = await listRecords<{ seller_email?: string }>(TABLES.Products, {
      filterByFormula: `RECORD_ID() = "${esc(data.id)}"`,
      maxRecords: 1,
    });
    const rec = records[0];
    if (!rec || (rec.fields.seller_email ?? "").toLowerCase() !== s.email) throw new Error("Yetkisiz.");
    return deleteRecord(TABLES.Products, data.id);
  });
