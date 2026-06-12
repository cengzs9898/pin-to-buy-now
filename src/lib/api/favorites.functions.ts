import { createServerFn } from "@tanstack/react-start";

export const listMyFavorites = createServerFn({ method: "GET" }).handler(async () => {
  const { readSession } = await import("@/lib/server/session.server");
  const { TABLES, listRecords, esc } = await import("@/lib/server/airtable.server");
  const s = await readSession();
  if (!s || s.role !== "user") throw new Error("Sadece kullanıcılar erişebilir.");
  const { records } = await listRecords(TABLES.Favorites, {
    filterByFormula: `LOWER({user_email}) = "${esc(s.email)}"`,
    pageSize: 100,
    sort: [{ field: "created_at", direction: "desc" }],
  });
  return records;
});

export const addFavorite = createServerFn({ method: "POST" })
  .inputValidator((input: { productId: string }) => {
    if (!input?.productId) throw new Error("productId gerekli.");
    return input;
  })
  .handler(async ({ data }) => {
    const { readSession } = await import("@/lib/server/session.server");
    const { TABLES, countRecords, findOne, createRecord, esc, FAVORITE_LIMIT_PER_USER } = await import(
      "@/lib/server/airtable.server"
    );
    const s = await readSession();
    if (!s || s.role !== "user") throw new Error("Sadece kullanıcılar favoriye ekleyebilir.");

    const key = `${s.email}|${data.productId}`;
    const exists = await findOne(TABLES.Favorites, `{key} = "${esc(key)}"`);
    if (exists) return exists;

    const count = await countRecords(TABLES.Favorites, `LOWER({user_email}) = "${esc(s.email)}"`);
    if (count >= FAVORITE_LIMIT_PER_USER) {
      throw new Error(`Favori limiti aşıldı (maks ${FAVORITE_LIMIT_PER_USER}).`);
    }

    return createRecord(TABLES.Favorites, {
      key,
      user_email: s.email,
      product_id: data.productId,
      created_at: new Date().toISOString(),
    });
  });

export const removeFavorite = createServerFn({ method: "POST" })
  .inputValidator((input: { productId: string }) => {
    if (!input?.productId) throw new Error("productId gerekli.");
    return input;
  })
  .handler(async ({ data }) => {
    const { readSession } = await import("@/lib/server/session.server");
    const { TABLES, findOne, deleteRecord, esc } = await import("@/lib/server/airtable.server");
    const s = await readSession();
    if (!s || s.role !== "user") throw new Error("Yetkisiz.");
    const key = `${s.email}|${data.productId}`;
    const rec = await findOne(TABLES.Favorites, `{key} = "${esc(key)}"`);
    if (!rec) return { success: true };
    await deleteRecord(TABLES.Favorites, rec.id);
    return { success: true };
  });
