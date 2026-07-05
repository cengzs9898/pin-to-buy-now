import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_product",
  title: "Get product by id",
  description: "Fetch a single Pintos marketplace product by its record id.",
  inputSchema: {
    id: z.string().min(1).describe("Product record id."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const { TABLES, listRecords, esc } = await import("@/lib/server/airtable.server");
    const { records } = await listRecords<{
      name?: string;
      price?: number;
      currency?: string;
      seller_email?: string;
      image_url?: string;
      is_active?: boolean;
    }>(TABLES.Products, {
      filterByFormula: `RECORD_ID() = "${esc(id)}"`,
      maxRecords: 1,
    });
    const rec = records[0];
    if (!rec) {
      return {
        content: [{ type: "text", text: `No product found with id ${id}` }],
        isError: true,
      };
    }
    const product = {
      id: rec.id,
      name: rec.fields.name ?? "",
      price: rec.fields.price ?? 0,
      currency: rec.fields.currency ?? "TRY",
      seller_email: rec.fields.seller_email ?? "",
      image_url: rec.fields.image_url ?? "",
      is_active: rec.fields.is_active ?? false,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(product, null, 2) }],
      structuredContent: { product },
    };
  },
});
