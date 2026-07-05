import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_products",
  title: "List marketplace products",
  description:
    "List active products in the Pintos marketplace. Optionally filter by a case-insensitive substring match on product name.",
  inputSchema: {
    query: z
      .string()
      .trim()
      .max(120)
      .optional()
      .describe("Optional case-insensitive substring to match against product name."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of products to return (default 25, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const { TABLES, listRecords, esc } = await import("@/lib/server/airtable.server");
    const parts = ["{is_active} = 1"];
    if (query && query.length > 0) {
      parts.push(`FIND(LOWER("${esc(query)}"), LOWER({name} & "")) > 0`);
    }
    const formula = parts.length === 1 ? parts[0] : `AND(${parts.join(", ")})`;
    const { records } = await listRecords<{
      name?: string;
      price?: number;
      currency?: string;
      seller_email?: string;
      image_url?: string;
    }>(TABLES.Products, {
      filterByFormula: formula,
      pageSize: limit ?? 25,
      maxRecords: limit ?? 25,
      sort: [{ field: "created_at", direction: "desc" }],
    });

    const items = records.map((r) => ({
      id: r.id,
      name: r.fields.name ?? "",
      price: r.fields.price ?? 0,
      currency: r.fields.currency ?? "TRY",
      seller_email: r.fields.seller_email ?? "",
      image_url: r.fields.image_url ?? "",
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { items, count: items.length },
    };
  },
});
