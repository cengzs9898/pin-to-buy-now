import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const visionSearch = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      imageDataUrl: z
        .string()
        .min(20)
        .refine((v) => v.startsWith("data:image/"), "Geçersiz görsel"),
    }),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI Gateway yapılandırılmamış");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Sen görsel bir alışveriş asistanısın. Görselde tek bir ürün varsa tek ürün, fiş/fatura/liste ise TÜM satırları çıkar. Sadece JSON döndür.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  'Görseli incele. Eğer bir market fişi, fatura veya ürün listesi ise her satırdaki ürünü ayrı ayrı çıkar. Aksi halde görseldeki tek ürünü döndür. Yanıt formatı: {"is_receipt": bool, "items": ["kısa Türkçe arama sorgusu 1", "sorgu 2", ...]}. Her sorgu en fazla 5 kelime, marka+ürün tipi. Fiyat/adet/KDV yazma. Sadece JSON döndür.',
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Görsel analizi başarısız: ${res.status} ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = (json.choices?.[0]?.message?.content ?? "").trim();
    let parsed: { is_receipt?: boolean; items?: unknown } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {
          /* ignore */
        }
      }
    }
    const items = Array.isArray(parsed.items)
      ? (parsed.items as unknown[])
          .map((v) => (typeof v === "string" ? v.trim().replace(/^["']|["']$/g, "") : ""))
          .filter((s) => s.length > 0)
          .slice(0, 30)
      : [];
    const query = items[0] ?? "";
    return { query, items, isReceipt: Boolean(parsed.is_receipt) };
  });
