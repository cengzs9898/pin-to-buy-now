import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";

type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  role: "user" | "seller";
  businessName?: string;
  phone?: string;
};

type LoginInput = { email: string; password: string; role: "user" | "seller" };

function normalizeEmail(s: string) {
  return s.trim().toLowerCase();
}

export const registerAccount = createServerFn({ method: "POST" })
  .inputValidator((input: RegisterInput) => {
    if (!input?.email || !input?.password || !input?.fullName || !input?.role) {
      throw new Error("Eksik alanlar var.");
    }
    if (input.password.length < 6) throw new Error("Şifre en az 6 karakter olmalı.");
    if (input.role === "seller" && !input.businessName) throw new Error("İşletme adı zorunlu.");
    return input;
  })
  .handler(async ({ data }) => {
    const { TABLES, findOne, createRecord, esc } = await import("@/lib/server/airtable.server");
    const { issueSession } = await import("@/lib/server/session.server");

    const email = normalizeEmail(data.email);
    const table = data.role === "seller" ? TABLES.Sellers : TABLES.Users;

    const existing = await findOne(table, `LOWER({email}) = "${esc(email)}"`);
    if (existing) throw new Error("Bu e-posta zaten kayıtlı.");

    const passwordHash = await bcrypt.hash(data.password, 10);
    const nowIso = new Date().toISOString();

    type Fields = import("@/lib/server/airtable.server").AirtableFields;
    const fields: Fields =
      data.role === "seller"
        ? {
            email,
            password_hash: passwordHash,
            business_name: data.businessName!,
            phone: data.phone ?? "",
            created_at: nowIso,
          }
        : {
            email,
            password_hash: passwordHash,
            full_name: data.fullName,
            phone: data.phone ?? "",
            created_at: nowIso,
          };

    const rec = await createRecord(table, fields);
    const token = await issueSession({
      sub: rec.id,
      email,
      role: data.role,
      name: data.role === "seller" ? data.businessName! : data.fullName,
    });
    return { success: true, role: data.role, email, token };
  });

export const loginAccount = createServerFn({ method: "POST" })
  .inputValidator((input: LoginInput) => {
    if (!input?.email || !input?.password || !input?.role) throw new Error("Eksik alanlar.");
    return input;
  })
  .handler(async ({ data }) => {
    const { TABLES, findOne, esc } = await import("@/lib/server/airtable.server");
    const { issueSession } = await import("@/lib/server/session.server");

    const email = normalizeEmail(data.email);
    const table = data.role === "seller" ? TABLES.Sellers : TABLES.Users;
    const rec = await findOne<{
      email: string;
      password_hash?: string;
      full_name?: string;
      business_name?: string;
    }>(table, `LOWER({email}) = "${esc(email)}"`);

    if (!rec || !rec.fields.password_hash) throw new Error("E-posta veya şifre hatalı.");
    const ok = await bcrypt.compare(data.password, rec.fields.password_hash);
    if (!ok) throw new Error("E-posta veya şifre hatalı.");

    const name = data.role === "seller" ? rec.fields.business_name ?? email : rec.fields.full_name ?? email;
    const token = await issueSession({ sub: rec.id, email, role: data.role, name });
    return { success: true, role: data.role, email, name, token };
  });

export const getMe = createServerFn({ method: "GET" }).handler(async () => {
  const { readSession } = await import("@/lib/server/session.server");
  const s = await readSession();
  return s;
});

export const logoutAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { clearSession } = await import("@/lib/server/session.server");
  clearSession();
  return { success: true };
});
