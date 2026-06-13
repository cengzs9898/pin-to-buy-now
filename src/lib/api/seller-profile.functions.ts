import { createServerFn } from "@tanstack/react-start";

export type SellerProfile = {
  email: string;
  business_name: string;
  business_type: string;
  tax_number: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  is_verified?: boolean;
};

type UpdateInput = {
  business_name: string;
  business_type: string;
  tax_number: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
};

function requireString(v: unknown, label: string, max = 200): string {
  if (typeof v !== "string" || !v.trim()) throw new Error(`${label} zorunludur.`);
  const s = v.trim();
  if (s.length > max) throw new Error(`${label} en fazla ${max} karakter olabilir.`);
  return s;
}

function requireCoord(v: unknown, label: string, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error(`${label} zorunludur.`);
  if (n < min || n > max) throw new Error(`${label} ${min} ile ${max} arasında olmalı.`);
  return n;
}

export const getMyProfile = createServerFn({ method: "GET" }).handler(async () => {
  const { readSession } = await import("@/lib/server/session.server");
  const { TABLES, findOne, esc } = await import("@/lib/server/airtable.server");
  const s = await readSession();
  if (!s || s.role !== "seller") throw new Error("Sadece satıcılar erişebilir.");
  const rec = await findOne<Partial<SellerProfile>>(
    TABLES.Sellers,
    `LOWER({email}) = "${esc(s.email)}"`,
  );
  if (!rec) throw new Error("Satıcı kaydı bulunamadı.");
  return { id: rec.id, fields: rec.fields };
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateInput) => {
    return {
      business_name: requireString(input?.business_name, "İşletme adı"),
      business_type: requireString(input?.business_type, "İşletme türü", 100),
      tax_number: requireString(input?.tax_number, "Vergi numarası", 50),
      phone: requireString(input?.phone, "Telefon", 30),
      address: requireString(input?.address, "Adres", 500),
      city: requireString(input?.city, "Şehir", 100),
      district: requireString(input?.district, "İlçe", 100),
      latitude: requireCoord(input?.latitude, "Enlem", -90, 90),
      longitude: requireCoord(input?.longitude, "Boylam", -180, 180),
    };
  })
  .handler(async ({ data }) => {
    const { readSession } = await import("@/lib/server/session.server");
    const { TABLES, findOne, updateRecord, esc } = await import("@/lib/server/airtable.server");
    const s = await readSession();
    if (!s || s.role !== "seller") throw new Error("Sadece satıcılar düzenleyebilir.");
    const rec = await findOne(TABLES.Sellers, `LOWER({email}) = "${esc(s.email)}"`);
    if (!rec) throw new Error("Satıcı kaydı bulunamadı.");
    const updated = await updateRecord(TABLES.Sellers, rec.id, { ...data });
    return { success: true, id: updated.id };
  });
