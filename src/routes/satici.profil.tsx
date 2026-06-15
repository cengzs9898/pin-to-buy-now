import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import pintosLogo from "@/assets/pintos-logo.png.asset.json";
import { getMyProfile, updateMyProfile } from "@/lib/api/seller-profile.functions";
import { getAuthToken, clearAuthToken } from "@/lib/auth-token";

export const Route = createFileRoute("/satici/profil")({
  head: () => ({
    meta: [
      { title: "Satıcı Profili — Pintos" },
      { name: "description", content: "İşletme bilgilerini tamamla ve haritada görün." },
    ],
  }),
  component: SaticiProfil,
});

type Form = {
  business_name: string;
  business_type: string;
  tax_number: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  latitude: string;
  longitude: string;
};

const EMPTY: Form = {
  business_name: "",
  business_type: "",
  tax_number: "",
  phone: "",
  address: "",
  city: "",
  district: "",
  latitude: "",
  longitude: "",
};

function SaticiProfil() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(EMPTY);
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "saved" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyProfile();
        const f = res.fields as Record<string, unknown>;
        setEmail((f.email as string) ?? "");
        setVerified(Boolean(f.is_verified));
        setForm({
          business_name: (f.business_name as string) ?? "",
          business_type: (f.business_type as string) ?? "",
          tax_number: (f.tax_number as string) ?? "",
          phone: (f.phone as string) ?? "",
          address: (f.address as string) ?? "",
          city: (f.city as string) ?? "",
          district: (f.district as string) ?? "",
          latitude: f.latitude != null ? String(f.latitude) : "",
          longitude: f.longitude != null ? String(f.longitude) : "",
        });
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setMsg(err instanceof Error ? err.message : "Profil yüklenemedi.");
        if (err instanceof Error && /satıcılar/i.test(err.message)) {
          navigate({ to: "/giris" });
        }
      }
    })();
  }, [navigate]);

  const onChange = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const useMyLocation = () => {
    if (!navigator.geolocation) return setMsg("Tarayıcı konum desteklemiyor.");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setForm((p) => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        })),
      (err) => setMsg(err.message),
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setMsg("");
    try {
      await updateMyProfile({
        data: {
          business_name: form.business_name.trim(),
          business_type: form.business_type.trim(),
          tax_number: form.tax_number.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          district: form.district.trim(),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        },
      });
      setStatus("saved");
      setMsg("Profil güncellendi.");
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Kaydedilemedi.");
    }
  };

  const field = (
    id: keyof Form,
    label: string,
    extra: { type?: string; placeholder?: string; textarea?: boolean; step?: string; inputMode?: "numeric" | "decimal" | "tel" } = {},
  ) => (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium">
        {label} <span className="text-red-600">*</span>
      </label>
      {extra.textarea ? (
        <textarea
          id={id}
          required
          value={form[id]}
          onChange={onChange(id)}
          placeholder={extra.placeholder}
          rows={3}
          className="w-full rounded-xl border border-input bg-surface-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      ) : (
        <input
          id={id}
          required
          type={extra.type ?? "text"}
          step={extra.step}
          inputMode={extra.inputMode}
          value={form[id]}
          onChange={onChange(id)}
          placeholder={extra.placeholder}
          className="w-full rounded-xl border border-input bg-surface-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <nav className="sticky top-0 z-50 border-b border-hairline bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="Pintos">
            <img src={pintosLogo.url} alt="Pintos" className="h-8 w-auto" />
          </Link>
          <Link to="/harita" className="text-sm text-muted-foreground hover:text-foreground">
            Harita
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Satıcı Profili</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tüm alanları doldurman gerekiyor. Eksik bilgiler kaydedilemez.
          </p>
          {email && (
            <p className="mt-3 text-xs text-muted-foreground">
              Hesap: <span className="font-medium text-foreground">{email}</span>
              {verified ? (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Doğrulanmış</span>
              ) : (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Doğrulanmamış</span>
              )}
            </p>
          )}
        </header>

        {status === "loading" ? (
          <p className="text-sm text-muted-foreground">Yükleniyor…</p>
        ) : (
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl bg-surface p-6 shadow-lg shadow-zinc-200/40 ring-1 ring-black/5"
          >
            {field("business_name", "İşletme Adı", { placeholder: "Örn. Ahmet Bey Tekel" })}
            {field("business_type", "İşletme Türü", { placeholder: "Örn. Tekel, Market, Şarap Evi" })}
            {field("tax_number", "Vergi Numarası", { placeholder: "10 haneli vergi no", inputMode: "numeric" })}
            {field("phone", "Telefon", { type: "tel", placeholder: "+90 5xx xxx xx xx", inputMode: "tel" })}
            {field("city", "Şehir", { placeholder: "İstanbul" })}
            {field("district", "İlçe", { placeholder: "Kadıköy" })}
            {field("address", "Adres", { textarea: true, placeholder: "Açık adres" })}

            <div className="grid grid-cols-2 gap-3">
              {field("latitude", "Enlem", { type: "number", step: "any", placeholder: "41.0082", inputMode: "decimal" })}
              {field("longitude", "Boylam", { type: "number", step: "any", placeholder: "28.9784", inputMode: "decimal" })}
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              className="w-full rounded-xl border border-input bg-surface-2 py-2.5 text-sm font-medium hover:bg-surface"
            >
              📍 Mevcut konumumu kullan
            </button>

            <button
              type="submit"
              disabled={status === "saving"}
              className="w-full rounded-xl bg-ink py-3 text-sm font-medium text-ink-foreground transition-transform hover:brightness-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {status === "saving" ? "Kaydediliyor…" : "Profili Kaydet"}
            </button>

            {msg && (
              <p
                className={
                  status === "error"
                    ? "text-center text-xs text-red-600"
                    : "text-center text-xs text-emerald-600"
                }
              >
                {msg}
              </p>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
