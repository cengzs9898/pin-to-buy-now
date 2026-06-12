// Server-only Airtable gateway helpers. Never import from client code.
const BASE_ID = "app78U2DtCXbQ0V98";
const GW = `https://connector-gateway.lovable.dev/airtable/v0/${BASE_ID}`;

export const TABLES = {
  Users: "Users",
  Sellers: "Sellers",
  Products: "Products",
  Favorites: "Favorites",
} as const;

export const PRODUCT_LIMIT_PER_SELLER = 1000;
export const FAVORITE_LIMIT_PER_USER = 1000;

function headers() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const airtableKey = process.env.AIRTABLE_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY missing");
  if (!airtableKey) throw new Error("AIRTABLE_API_KEY missing");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": airtableKey,
    "Content-Type": "application/json",
  };
}

export type AirtableRecord<T = Record<string, unknown>> = {
  id: string;
  createdTime: string;
  fields: T;
};

async function gw<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GW}${path}`, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function listRecords<T = Record<string, unknown>>(
  table: string,
  opts: { filterByFormula?: string; maxRecords?: number; pageSize?: number; offset?: string; fields?: string[]; sort?: { field: string; direction?: "asc" | "desc" }[] } = {},
): Promise<{ records: AirtableRecord<T>[]; offset?: string }> {
  const params = new URLSearchParams();
  if (opts.filterByFormula) params.set("filterByFormula", opts.filterByFormula);
  if (opts.maxRecords) params.set("maxRecords", String(opts.maxRecords));
  if (opts.pageSize) params.set("pageSize", String(opts.pageSize));
  if (opts.offset) params.set("offset", opts.offset);
  if (opts.fields) for (const f of opts.fields) params.append("fields[]", f);
  if (opts.sort) opts.sort.forEach((s, i) => {
    params.append(`sort[${i}][field]`, s.field);
    if (s.direction) params.append(`sort[${i}][direction]`, s.direction);
  });
  const qs = params.toString();
  return gw(`/${encodeURIComponent(table)}${qs ? `?${qs}` : ""}`);
}

export async function findOne<T = Record<string, unknown>>(table: string, formula: string) {
  const { records } = await listRecords<T>(table, { filterByFormula: formula, maxRecords: 1 });
  return records[0] ?? null;
}

export async function countRecords(table: string, formula: string): Promise<number> {
  // Airtable has no count endpoint — page through ids only.
  let count = 0;
  let offset: string | undefined;
  do {
    const page = await listRecords(table, { filterByFormula: formula, pageSize: 100, fields: ["created_at"], offset });
    count += page.records.length;
    offset = page.offset;
  } while (offset);
  return count;
}

export async function createRecord<T = Record<string, unknown>>(table: string, fields: Record<string, unknown>) {
  const out = await gw<{ records: AirtableRecord<T>[] }>(`/${encodeURIComponent(table)}`, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  return out.records[0];
}

export async function updateRecord<T = Record<string, unknown>>(table: string, id: string, fields: Record<string, unknown>) {
  const out = await gw<{ records: AirtableRecord<T>[] }>(`/${encodeURIComponent(table)}`, {
    method: "PATCH",
    body: JSON.stringify({ records: [{ id, fields }], typecast: true }),
  });
  return out.records[0];
}

export async function deleteRecord(table: string, id: string) {
  return gw<{ id: string; deleted: boolean }>(`/${encodeURIComponent(table)}/${id}`, { method: "DELETE" });
}

// Escape a value for filterByFormula string literal
export function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
