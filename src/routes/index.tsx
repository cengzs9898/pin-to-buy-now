import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import mapPreview from "@/assets/map-preview.jpg";
import pintosLogo from "@/assets/pintos-logo.png.asset.json";
import { visionSearch } from "@/lib/api/vision-search.functions";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pintos — En yakın pin'de, en ucuz fiyata bul" },
      {
        name: "description",
        content:
          "Pintos; aradığın ürünü tek aramayla en yakın satıcıda ve en ucuz fiyata bulan hyperlocal alışveriş motoru. Acil, planlı ya da kargo — sen seç, biz pinleyelim.",
      },
      { property: "og:title", content: "Pintos — En yakın pin'de, en ucuz fiyata bul" },
      {
        property: "og:description",
        content:
          "Tek arama. En yakın mağaza. En ucuz fiyat. Pintos ile şehrindeki ticareti pinle.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const INTENTS = [
  { id: "urgent", label: "Acil Lazım" },
  { id: "cheap", label: "En Ucuz Olsun" },
  { id: "ship", label: "Kargoyla Gelsin" },
] as const;

function Index() {
  const [intent, setIntent] = useState<(typeof INTENTS)[number]["id"]>("urgent");
  const [query, setQuery] = useState("");
  const [visionState, setVisionState] = useState<"idle" | "loading" | "error">("idle");
  const [visionError, setVisionError] = useState<string | null>(null);
  const [visionItems, setVisionItems] = useState<string[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setVisionState("error");
      setVisionError("Görsel 8MB'tan büyük olamaz.");
      return;
    }
    try {
      setVisionState("loading");
      setVisionError(null);
      setVisionItems([]);
      const imageDataUrl = await fileToDataUrl(file);
      const result = await visionSearch({ data: { imageDataUrl } });
      if (result.query) {
        setQuery(result.query);
        setVisionItems(result.items ?? []);
        setVisionState("idle");
      } else {
        setVisionState("error");
        setVisionError("Ürün tanımlanamadı, tekrar dene.");
      }
    } catch (err) {
      setVisionState("error");
      setVisionError(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
  };




  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-hairline bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2" aria-label="Pintos">
            <img src={pintosLogo.url} alt="Pintos" className="h-8 w-auto" />
          </a>
          <div className="flex items-center gap-6">
            <a
              href="#how"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Nasıl Çalışır?
            </a>
            <a
              href="#integrations"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Entegrasyonlar
            </a>
            <a
              href="/harita"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Canlı Harita
            </a>
            <Link
              to="/kayit-ol"
              className="inline-flex h-8 items-center rounded-md bg-ink px-3 text-sm font-medium text-ink-foreground ring-1 ring-ink transition-transform hover:scale-[1.02]"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pb-24 pt-16">
        <div className="mx-auto max-w-screen-xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
              </span>
              Hyperlocal Commerce Engine
            </div>

            <h1 className="mb-8 max-w-[24ch] text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Aradığın ürünü en yakın pin'de, en ucuz fiyata bul.
            </h1>

            {/* Search Bar */}
            <div className="w-full max-w-2xl">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="group relative flex items-center rounded-2xl bg-surface p-2 shadow-xl shadow-zinc-200/60 ring-1 ring-black/5 transition-all focus-within:ring-2 focus-within:ring-brand"
              >
                <div className="shrink-0 pl-3 pr-2">
                  <svg
                    className="size-4 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    visionState === "loading"
                      ? "Görsel analiz ediliyor..."
                      : "Şarj kablosu, bebek bezi veya soğuk kahve..."
                  }
                  disabled={visionState === "loading"}
                  className="w-full border-none bg-transparent px-2 py-3 text-base outline-none placeholder:text-muted-foreground disabled:opacity-60"
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelected}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageSelected}
                />
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={visionState === "loading"}
                  aria-label="Görsel yükle"
                  title="Görselden ara"
                  className="mr-1 grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
                >
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={visionState === "loading"}
                  aria-label="Kamera ile çek"
                  title="Kamera ile ara"
                  className="mr-1 grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
                >
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={visionState === "loading"}
                  className="shrink-0 rounded-xl bg-brand px-6 py-3 text-sm font-medium text-brand-foreground transition-transform hover:brightness-[1.02] active:scale-95 disabled:opacity-60"
                >
                  {visionState === "loading" ? "..." : "Pinle"}
                </button>
              </form>
              {visionState === "error" && visionError && (
                <p className="mt-2 text-xs text-red-600">{visionError}</p>
              )}
              {visionState === "loading" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Görsel AI ile inceleniyor, ürün tanımlanıyor...
                </p>
              )}


              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Niyet Algıla:
                </span>
                {INTENTS.map((it) => {
                  const active = intent === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => setIntent(it.id)}
                      className={
                        active
                          ? "rounded-full border border-ink bg-ink px-2.5 py-1 text-xs font-medium text-ink-foreground"
                          : "rounded-full border border-hairline bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                      }
                    >
                      {it.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Product Preview */}
          <div className="mt-20 grid gap-6 lg:grid-cols-12">
            {/* Map */}
            <div className="relative h-[500px] overflow-hidden rounded-3xl bg-surface-2 ring-1 ring-black/5 lg:col-span-8">
              <img
                src={mapPreview}
                alt="Pintos haritası — yakındaki satıcıların fiyat pinleriyle gösterimi"
                className="size-full object-cover"
                width={1600}
                height={1024}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-background/40 via-transparent to-transparent" />

              {/* Nearest Card */}
              <div className="absolute left-6 top-6 flex max-w-xs flex-col gap-3">
                <div className="rounded-xl bg-surface/95 p-4 shadow-lg ring-1 ring-black/5 backdrop-blur">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      En Yakın Opsiyon
                    </span>
                    <span className="rounded bg-success-soft px-1.5 py-0.5 font-mono text-[10px] text-success">
                      12 dk
                    </span>
                  </div>
                  <p className="text-sm font-medium">Anker PowerLine III USB-C</p>
                  <p className="mb-3 text-xs text-muted-foreground">Mahalle Teknoloji Market</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold tracking-tight">₺349,00</span>
                    <button className="flex items-center gap-1.5 rounded-lg bg-ink py-2 pl-2 pr-3 text-xs font-medium text-ink-foreground transition-transform active:scale-95">
                      <svg
                        className="size-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                        />
                      </svg>
                      Yol Tarifi
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating pin */}
              <div className="absolute bottom-10 right-12 flex flex-col items-center">
                <div className="mb-1 rounded-full bg-surface-2 px-3 py-1 font-mono text-[11px] font-bold shadow-lg ring-1 ring-black/5">
                  ₺349
                </div>
                <div className="size-4 rounded-full bg-brand shadow-xl ring-4 ring-surface-2" />
              </div>

              {/* Coord chip */}
              <div className="absolute bottom-6 left-6 rounded-lg bg-ink/90 px-3 py-2 font-mono text-[10px] leading-tight text-ink-foreground/80">
                LAT 41.0082 · LNG 28.9784
                <br />
                <span className="text-brand">ACTIVE_PINS: 14</span>
              </div>
            </div>

            {/* Price Comparison */}
            <div className="flex flex-col gap-4 lg:col-span-4">
              <div className="flex flex-1 flex-col justify-between rounded-3xl bg-surface p-6 ring-1 ring-black/5">
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Fiyat Karşılaştırma
                  </h3>

                  <div className="flex items-center justify-between border-b border-hairline py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Trendyol</span>
                      <span className="text-[10px] text-muted-foreground">Yarın teslim</span>
                    </div>
                    <span className="font-mono text-sm font-medium">₺429,00</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-hairline py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Hepsiburada</span>
                      <span className="text-[10px] text-muted-foreground">Bugün kapında</span>
                    </div>
                    <span className="font-mono text-sm font-medium">₺455,00</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-hairline py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Amazon TR</span>
                      <span className="text-[10px] text-muted-foreground">2 gün kargo</span>
                    </div>
                    <span className="font-mono text-sm font-medium">₺389,00</span>
                  </div>

                  <div className="-mx-2 flex items-center justify-between rounded-lg border border-brand/30 bg-brand/15 px-2 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Pintos Önerisi</span>
                      <span className="text-[10px] text-foreground/70">400m uzaklıkta</span>
                    </div>
                    <span className="font-mono text-sm font-bold">₺349,00</span>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl bg-ink p-4 text-xs leading-relaxed text-ink-foreground/70">
                  Pintos, 42 farklı platform ve binlerce yerel mağazayı saniyeler içinde taradı.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="border-y border-hairline bg-surface-2 py-24">
        <div className="mx-auto max-w-screen-xl px-6">
          <div className="grid gap-12 md:grid-cols-3">
            {[
              {
                value: "%70",
                label: "Daha hızlı satın alma kararı. Onlarca sekme yerine tek bir pin.",
              },
              {
                value: "%15–35",
                label: "Ortalama tasarruf. En yakın ve en ucuzun mükemmel dengesi.",
              },
              {
                value: "3.2k+",
                label: "Entegre mağaza ve marketplace tek arama çubuğunda birleşti.",
              },
            ].map((m) => (
              <div key={m.value} className="space-y-2">
                <div className="font-mono text-4xl font-semibold tracking-tight">{m.value}</div>
                <p className="max-w-[32ch] text-pretty text-sm text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-background py-24">
        <div className="mx-auto max-w-screen-xl px-6">
          <div className="mb-16 max-w-2xl">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-brand">
              Workflow
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Üç adımda en akıllı satın alma.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Niyet algılamadan teslimat seçimine — karmaşık alışveriş süreçlerini tek bir akışa
              sıkıştırdık.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Arama Yap",
                desc: "İhtiyacın olan ürünü yaz. Sistem niyetini — acil, ucuz veya kargo — saniyeler içinde sınıflandırır.",
              },
              {
                step: "02",
                title: "Fiyat & Mesafe",
                desc: "Harita üzerinde en yakın mağaza ve dijitalde en ucuz opsiyon yan yana gelir.",
              },
              {
                step: "03",
                title: "Pinle ve Al",
                desc: "İster kapına kurye, ister aynı gün kargo, ister mağazaya yönlen. Karar senin.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-2xl bg-surface p-8 ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-200/60"
              >
                <div className="mb-6 grid size-10 place-items-center rounded-xl bg-ink font-mono text-sm font-bold text-ink-foreground">
                  {s.step}
                </div>
                <h3 className="mb-3 text-lg font-medium">{s.title}</h3>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="border-t border-hairline bg-surface-2 py-20">
        <div className="mx-auto max-w-screen-xl px-6">
          <p className="mb-10 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Tek aramada birleşen platformlar
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
            {["TRENDYOL", "HEPSİBURADA", "AMAZON.TR", "GETIR", "MİGROS", "N11", "ÇİÇEKSEPETİ"].map(
              (name) => (
                <span
                  key={name}
                  className="font-mono text-sm font-semibold tracking-tight text-foreground"
                >
                  {name}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section id="waitlist" className="bg-ink px-6 py-32 text-ink-foreground">
        <div className="mx-auto flex max-w-screen-xl flex-col items-center text-center">
          <h2 className="mb-8 max-w-[28ch] text-balance text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            Alışverişin en hızlı haliyle tanışmaya hazır mısın?
          </h2>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="E-posta adresin"
              className="flex-1 rounded-xl border-none bg-white/5 px-4 py-3 text-sm text-ink-foreground outline-none ring-1 ring-white/10 placeholder:text-ink-foreground/40 focus:ring-brand"
            />
            <button
              type="submit"
              className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-transform active:scale-95"
            >
              Sıraya Gir
            </button>
          </form>
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-ink-foreground/40">
            Early access yakında
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/40 bg-ink py-10 text-ink-foreground/60">
        <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid size-5 place-items-center rounded bg-brand">
              <div className="size-1 rounded-full bg-ink" />
            </div>
            <span className="font-mono text-xs">PINTOS © 2026</span>
          </div>
          <div className="flex gap-6 text-xs">
            <a href="#" className="transition-colors hover:text-ink-foreground">
              Twitter
            </a>
            <a href="#" className="transition-colors hover:text-ink-foreground">
              Gizlilik
            </a>
            <a href="#" className="transition-colors hover:text-ink-foreground">
              İletişim
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
