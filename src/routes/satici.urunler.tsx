import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import pintosLogo from "@/assets/pintos-logo.png.asset.json";
import {
  listMyProducts,
  createProduct,
  deleteProduct,
  analyzeAndCreateProduct,
} from "@/lib/api/products.functions";
import { getAuthToken, clearAuthToken } from "@/lib/auth-token";

export const Route = createFileRoute("/satici/urunler")({
  head: () => ({
    meta: [
      { title: "Ürünlerim — Pintos" },
      { name: "description", content: "Ürünlerini ekle, listele ve yönet." },
    ],
  }),
  component: SaticiUrunler,
});

type Row = { id: string; fields: Record<string, unknown> };

function SaticiUrunler() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ name: "", price: "", image_url: "" });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const token = getAuthToken();
      const recs = (await listMyProducts({ data: { token } })) as Row[];
      setRows(recs);
    } catch (err) {
      const m = err instanceof Error ? err.message : "Yüklenemedi.";
      setMsg(m);
      if (/satıcılar/i.test(m)) {
        clearAuthToken();
        navigate({ to: "/giris" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await createProduct({
        data: {
          name: form.name.trim(),
          price: Number(form.price),
          image_url: form.image_url.trim(),
          token: getAuthToken(),
        },
      });
      setForm({ name: "", price: "", image_url: "" });
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Eklenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Silinsin mi?")) return;
    try {
      await deleteProduct({ data: { id, token: getAuthToken() } });
      setRows((p) => p.filter((r) => r.id !== id));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Silinemedi.");
    }
  };

  // Downscale + convert to JPEG data URL to keep payload small
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Görsel okunamadı."));
        img.onload = () => {
          const MAX = 1024;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas hatası."));
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAnalyzing(true);
    setMsg("");
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = (await analyzeAndCreateProduct({
        data: { image_data_url: dataUrl, token: getAuthToken() },
      })) as { isReceipt?: boolean; count?: number } | unknown;
      const r = res as { isReceipt?: boolean; count?: number };
      if (r?.count && r.count > 0) {
        setMsg(
          r.isReceipt
            ? `Fiş/fatura tarandı: ${r.count} ürün eklendi.`
            : `Ürün eklendi.`,
        );
      }
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Analiz başarısız.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <nav className="sticky top-0 z-50 border-b border-hairline bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="Pintos">
            <img src={pintosLogo.url} alt="Pintos" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/satici/profil" className="text-muted-foreground hover:text-foreground">
              Profil
            </Link>
            <Link to="/harita" className="text-muted-foreground hover:text-foreground">
              Harita
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Ürünlerim</h1>
          <p className="mt-1 text-sm text-muted-foreground">Satır satır ürün ekle, listele ve sil.</p>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-hairline bg-surface p-3">
          <span className="mr-1 text-sm font-medium">Fotoğraf / fiş / fatura ile otomatik ekle:</span>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={onPickImage}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onPickImage}
          />
          <button
            type="button"
            disabled={analyzing}
            onClick={() => cameraRef.current?.click()}
            className="rounded bg-ink px-3 py-2 text-sm font-medium text-ink-foreground disabled:opacity-60"
          >
            📷 Fotoğraf çek
          </button>
          <button
            type="button"
            disabled={analyzing}
            onClick={() => fileRef.current?.click()}
            className="rounded border border-input bg-surface-2 px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            🖼️ Görsel yükle
          </button>
          {analyzing && (
            <span className="text-xs text-muted-foreground">Analiz ediliyor, ürün ekleniyor…</span>
          )}
        </div>

        <form
          onSubmit={onAdd}
          className="mb-6 grid grid-cols-1 gap-2 rounded-lg border border-hairline bg-surface p-3 sm:grid-cols-[1fr_140px_1fr_auto]"
        >
          <input
            required
            placeholder="Ürün adı"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="rounded border border-input bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="Fiyat (₺)"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            className="rounded border border-input bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            placeholder="Görsel URL (opsiyonel)"
            value={form.image_url}
            onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
            className="rounded border border-input bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-ink px-4 py-2 text-sm font-medium text-ink-foreground disabled:opacity-60"
          >
            {saving ? "Ekleniyor…" : "Ekle"}
          </button>
        </form>

        {msg && <p className="mb-3 text-sm text-red-600">{msg}</p>}

        <div className="overflow-x-auto rounded-lg border border-hairline bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="w-16 border-b border-hairline px-3 py-2">Görsel</th>
                <th className="border-b border-hairline px-3 py-2">Ürün Adı</th>
                <th className="w-32 border-b border-hairline px-3 py-2 text-right">Fiyat</th>
                <th className="w-20 border-b border-hairline px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    Yükleniyor…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    Henüz ürün yok.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const f = r.fields as { name?: string; price?: number; image_url?: string; currency?: string };
                  return (
                    <tr key={r.id} className="border-b border-hairline last:border-0 hover:bg-surface-2">
                      <td className="px-3 py-2">
                        {f.image_url ? (
                          <img src={f.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-surface-2" />
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">{f.name ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {typeof f.price === "number" ? f.price.toFixed(2) : "—"} {f.currency ?? "TRY"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => onDelete(r.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
