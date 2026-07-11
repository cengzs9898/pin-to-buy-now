import { createServerFn } from "@tanstack/react-start";
import { isValidSubcategory, categoryPromptList } from "@/lib/categories";

type CreateProductInput = {
  name: string;
  price: number;
  image_url?: string;
  category?: string;
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
    const category = input.category?.trim() ?? "";
    if (category && !isValidSubcategory(category)) throw new Error("Geçersiz kategori.");
    return {
      name: input.name.trim(),
      price,
      image_url: input.image_url?.trim() ?? "",
      category,
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
      category: data.category,
      category_group: data.category ? (groupOf(data.category) ?? "") : "",
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

type AnalyzeInput = {
  image_data_url: string; // data:image/...;base64,...
  token?: string;
};

export const analyzeAndCreateProduct = createServerFn({ method: "POST" })
  .inputValidator((input: AnalyzeInput) => {
    if (!input?.image_data_url?.startsWith("data:image/")) {
      throw new Error("Geçerli bir görsel gerekli.");
    }
    return { image_data_url: input.image_data_url, token: input.token };
  })
  .handler(async ({ data }) => {
    const { resolveSession } = await import("@/lib/server/session.server");
    const { TABLES, createRecord, countRecords, esc, PRODUCT_LIMIT_PER_SELLER } = await import(
      "@/lib/server/airtable.server"
    );
    const s = await resolveSession(data.token);
    if (!s || s.role !== "seller") throw new Error("Sadece satıcılar ekleyebilir.");

    const count = await countRecords(TABLES.Products, `LOWER({seller_email}) = "${esc(s.email)}"`);
    if (count >= PRODUCT_LIMIT_PER_SELLER) {
      throw new Error(`Ürün limiti aşıldı (maks ${PRODUCT_LIMIT_PER_SELLER}).`);
    }

    // Parse data URL
    const m = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/.exec(data.image_data_url);
    if (!m) throw new Error("Görsel formatı okunamadı.");
    const mime = m[1];
    const b64 = m[2];
    const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";

    // 1) AI analiz — ürün adı ve tahmini fiyat (TRY) çıkar
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("AI anahtarı eksik.");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Sen bir ürün kataloglama asistanısın. Görsel bir market fişi / fatura / ürün listesi ise HER satırı ayrı ürün olarak çıkar. Aksi halde görseldeki tek ürünü çıkar. Her ürünü SADECE aşağıdaki kategori taksonomisinden bir alt kategoriye ata. Liste dışına ASLA çıkma. Sadece JSON döndür.\n\nKATEGORİLER (üst grup: alt kategoriler):\n" +
              categoryPromptList(),
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  'Yanıt formatı: {"is_receipt": bool, "items": [{"name": "kısa Türkçe ürün adı (marka+çeşit+gramaj varsa dahil)", "price_try": TRY fiyatı (sayı; bilinmiyorsa 0), "category": "yukarıdaki listedeki alt kategori adı, harfi harfine"}]}. Fiş/fatura ise TOPLAM, ARA TOPLAM, KDV, TOPKDV, İSKONTO gibi satırları DAHİL ETME. Kategori mutlaka listedeki tam ada eşit olmalı; emin değilsen en yakın alt kategoriyi seç. En fazla 30 ürün. Sadece JSON döndür.',
              },
              { type: "image_url", image_url: { url: data.image_data_url } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      throw new Error(`AI analiz hatası (${aiRes.status}): ${t.slice(0, 200)}`);
    }
    const aiJson = (await aiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = aiJson.choices?.[0]?.message?.content ?? "{}";
    let parsed: {
      is_receipt?: boolean;
      items?: Array<{ name?: string; price_try?: number; category?: string }>;
      name?: string;
      price_try?: number;
      category?: string;
    } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const jm = raw.match(/\{[\s\S]*\}/);
      if (jm) parsed = JSON.parse(jm[0]);
    }

    let items: Array<{ name: string; price: number; category: string }> = [];
    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
      items = parsed.items
        .map((it) => {
          const p = typeof it?.price_try === "number" ? it.price_try : Number(it?.price_try);
          const c = (it?.category ?? "").toString().trim();
          return {
            name: (it?.name ?? "").toString().trim(),
            price: Number.isFinite(p) && p >= 0 ? p : 0,
            category: isValidSubcategory(c) ? c : "",
          };
        })
        .filter((it) => it.name.length > 0)
        .slice(0, 30);
    } else {
      const name = (parsed.name ?? "").toString().trim() || "İsimsiz ürün";
      const price =
        typeof parsed.price_try === "number" && parsed.price_try >= 0 ? parsed.price_try : 0;
      const c = (parsed.category ?? "").toString().trim();
      items = [{ name, price, category: isValidSubcategory(c) ? c : "" }];
    }

    if (items.length === 0) throw new Error("Görselde ürün bulunamadı.");

    const isReceipt = Boolean(parsed.is_receipt) || items.length > 1;

    const remaining = PRODUCT_LIMIT_PER_SELLER - count;
    if (remaining <= 0) {
      throw new Error(`Ürün limiti aşıldı (maks ${PRODUCT_LIMIT_PER_SELLER}).`);
    }
    if (items.length > remaining) items = items.slice(0, remaining);

    // Görseli sadece tek ürün modunda ürün görseli olarak yükle
    let image_url = "";
    if (!isReceipt) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = `${s.sub}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabaseAdmin.storage.from("product-images").upload(key, bytes, {
        contentType: mime,
        upsert: false,
      });
      if (up.error) throw new Error(`Görsel yüklenemedi: ${up.error.message}`);
      image_url = `/api/public/product-images/${key}`;
    }

    const created = [];
    for (const it of items) {
      const rec = await createRecord(TABLES.Products, {
        name: it.name,
        seller_email: s.email,
        price: it.price,
        currency: "TRY",
        image_url,
        category: it.category,
        category_group: it.category ? (groupOf(it.category) ?? "") : "",
        is_active: true,
        created_at: new Date().toISOString(),
      });
      created.push(rec);
    }
    return { isReceipt, count: created.length, records: created };
  });
