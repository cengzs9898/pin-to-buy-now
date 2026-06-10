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
              "Görseldeki ürünü tanımla. Sadece kısa Türkçe bir arama sorgusu döndür (en fazla 5 kelime). Marka + ürün tipi formatında, açıklama yok.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Bu ürün için arama sorgusu üret." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Görsel analizi başarısız: ${res.status} ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const query = (json.choices?.[0]?.message?.content ?? "").trim().replace(/^["']|["']$/g, "");
    return { query };
  });
