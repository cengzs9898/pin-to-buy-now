import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
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
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
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
            <a
              href="/market-fiyatlari"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Market Fiyatları
            </a>
            <a
              href="/yakin-marketler"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Yakın Marketler
            </a>
            <Link
              to="/kayit-ol"
              className="inline-flex h-9 items-center rounded-xl bg-linear-to-r from-[#ff6b35] to-[#e84393] px-4 text-sm font-semibold text-white shadow-lg shadow-[#ff6b35]/20 transition-transform hover:scale-[1.03]"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-8 md:py-16">
        {/* Hero */}
        <section className="space-y-8 py-6 text-center md:py-10">
          <div className="space-y-5">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#ff6b35]/20 bg-[#ff6b35]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#e84393]">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b35] opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[#ff6b35]" />
              </span>
              Hyperlocal Commerce Engine
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-foreground md:text-7xl">
              Şehrindeki{" "}
              <span className="bg-linear-to-r from-[#ff6b35] via-[#f7931e] to-[#e84393] bg-clip-text text-transparent">
                Pintos
              </span>
              'u keşfet.
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Yerel mağazalardaki en yakın ürünü ve en iyi fiyatı tek aramada bul — bütçeni koru, vaktinden kazan.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mx-auto max-w-3xl">
            <div
              aria-hidden
              className="absolute -inset-1 rounded-2xl bg-linear-to-r from-[#ff6b35] via-[#f7931e] to-[#6c5ce7] opacity-25 blur-sm transition duration-700 group-hover:opacity-50"
            />
            <form
              onSubmit={(e) => e.preventDefault()}
              className="group relative flex items-center rounded-2xl border border-hairline bg-surface-2 p-2 shadow-xl shadow-zinc-200/50 transition-all focus-within:ring-2 focus-within:ring-[#ff6b35]"
            >
              <div className="shrink-0 pl-3 pr-2">
                <svg
                  className="size-5 text-[#ff6b35]"
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
                className="w-full min-w-0 border-none bg-transparent px-2 py-3 text-base outline-none placeholder:text-muted-foreground disabled:opacity-60"
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
                className="mr-1 grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={visionState === "loading"}
                aria-label="Kamera ile çek"
                title="Kamera ile ara"
                className="mr-1 grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                  />
                </svg>
              </button>
              <button
                type="submit"
                disabled={visionState === "loading"}
                className="shrink-0 rounded-xl bg-linear-to-r from-[#ff6b35] to-[#e84393] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#ff6b35]/25 transition-transform hover:brightness-105 active:scale-95 disabled:opacity-60"
              >
                {visionState === "loading" ? "..." : "Pinle"}
              </button>
            </form>
            {visionState === "error" && visionError && (
              <p className="mt-2 text-xs text-[#e84393]">{visionError}</p>
            )}
            {visionState === "loading" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Görsel AI ile inceleniyor, ürün tanımlanıyor...
              </p>
            )}
            {visionItems.length > 1 && visionState === "idle" && (
              <div className="mt-3 text-left">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Fişten çıkan {visionItems.length} ürün — birini seç:
                </p>
                <div className="flex flex-wrap gap-2">
                  {visionItems.map((item, i) => (
                    <button
                      key={`${item}-${i}`}
                      type="button"
                      onClick={() => setQuery(item)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        query === item
                          ? "border-[#ff6b35] bg-[#ff6b35] text-white"
                          : "border-hairline bg-surface text-foreground hover:bg-muted"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Niyet Algıla:
              </span>
              {INTENTS.map((it, i) => {
                const active = intent === it.id;
                const accent = ["#ff6b35", "#e84393", "#6c5ce7"][i];
                return (
                  <button
                    key={it.id}
                    onClick={() => setIntent(it.id)}
                    style={active ? { backgroundColor: accent, borderColor: accent } : undefined}
                    className={
                      active
                        ? "rounded-full px-3 py-1 text-xs font-semibold text-white shadow-md"
                        : "rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    }
                  >
                    {it.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bento Grid */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Map Preview — big card */}
          <div className="relative h-[420px] overflow-hidden rounded-3xl border border-hairline bg-surface-2 p-6 shadow-sm md:col-span-8">
            {/* Map background pattern */}
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(255,107,53,0.08), transparent 40%), radial-gradient(circle at 80% 70%, rgba(108,92,231,0.08), transparent 45%), radial-gradient(#e5e7eb 1px, transparent 1px)",
                backgroundSize: "auto, auto, 22px 22px",
              }}
            />
            <svg
              aria-hidden
              className="absolute inset-0 h-full w-full text-slate-200"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path d="M0,55 Q25,35 50,55 T100,55" stroke="currentColor" fill="transparent" strokeWidth="0.4" />
              <path d="M20,0 Q40,45 20,100" stroke="currentColor" fill="transparent" strokeWidth="0.4" />
              <path d="M75,0 Q60,50 80,100" stroke="currentColor" fill="transparent" strokeWidth="0.4" />
            </svg>

            {/* Header text */}
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Sana En Yakın Fırsatlar
                </h3>
                <p className="text-sm text-muted-foreground">
                  Şu an civarında aktif <span className="font-semibold text-foreground">124</span> pin gösteriliyor.
                </p>
              </div>
              <a
                href="/harita"
                className="hidden rounded-full border border-hairline bg-surface-2/80 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur transition-colors hover:bg-surface md:inline-flex"
              >
                Canlı Haritayı Aç →
              </a>
            </div>

            {/* Floating pins */}
            <div className="absolute left-[22%] top-[38%] flex flex-col items-center">
              <div className="mb-1 rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-bold shadow-md ring-1 ring-black/5">
                ₺399
              </div>
              <div className="size-3 rounded-full bg-[#6c5ce7] shadow-lg ring-4 ring-white" />
            </div>
            <div className="absolute left-[55%] top-[50%] flex flex-col items-center">
              <div className="mb-1 rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-bold shadow-md ring-1 ring-black/5">
                ₺499
              </div>
              <div className="size-3 rounded-full bg-[#f7931e] shadow-lg ring-4 ring-white" />
            </div>
            <div className="absolute right-[18%] top-[62%] flex flex-col items-center">
              <div className="mb-1 rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-bold shadow-md ring-1 ring-black/5">
                ₺349
              </div>
              <div className="size-4 rounded-full bg-[#ff6b35] shadow-xl ring-4 ring-white">
                <span className="absolute -inset-1.5 -z-10 animate-ping rounded-full bg-[#ff6b35]/40" />
              </div>
            </div>
            <div className="absolute right-[35%] bottom-[16%] flex flex-col items-center">
              <div className="mb-1 rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-bold shadow-md ring-1 ring-black/5">
                ₺789
              </div>
              <div className="size-3 rounded-full bg-[#e84393] shadow-lg ring-4 ring-white" />
            </div>

            {/* Nearest card */}
            <div className="absolute bottom-6 left-6 max-w-xs rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur">
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  En Yakın Opsiyon
                </span>
                <span className="rounded bg-success-soft px-1.5 py-0.5 font-mono text-[10px] text-success">
                  12 dk
                </span>
              </div>
              <p className="text-sm font-semibold">Anker PowerLine III USB-C</p>
              <p className="mb-3 text-xs text-muted-foreground">Mahalle Teknoloji Market</p>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold tracking-tight">₺349,00</span>
                <button className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-[#ff6b35] to-[#e84393] py-2 pl-3 pr-3 text-xs font-semibold text-white shadow-md transition-transform active:scale-95">
                  Yol Tarifi
                  <svg
                    className="size-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Right column: price comparison + stats */}
          <div className="flex flex-col gap-6 md:col-span-4">
            <div className="flex-1 rounded-3xl bg-linear-to-br from-[#6c5ce7] to-[#8072e9] p-6 text-white shadow-xl shadow-[#6c5ce7]/20">
              <h3 className="mb-4 font-display text-lg font-bold">Fiyat Karşılaştırma</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/10 p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Trendyol</span>
                    <span className="text-[10px] text-white/70">Yarın teslim</span>
                  </div>
                  <span className="font-mono text-sm font-bold">₺429,00</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/10 p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Hepsiburada</span>
                    <span className="text-[10px] text-white/70">Bugün kapında</span>
                  </div>
                  <span className="font-mono text-sm font-bold">₺455,00</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/10 p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Amazon TR</span>
                    <span className="text-[10px] text-white/70">2 gün kargo</span>
                  </div>
                  <span className="font-mono text-sm font-bold">₺389,00</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/25 p-3 ring-2 ring-white/40">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      Pintos Önerisi
                      <span className="rounded-full bg-[#ff6b35] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        En İyi
                      </span>
                    </span>
                    <span className="text-[10px] text-white/70">400m uzaklıkta</span>
                  </div>
                  <span className="font-mono text-sm font-bold">₺349,00</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-hairline bg-surface-2 p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="font-display text-3xl font-bold text-[#ff6b35]">%70</p>
                  <p className="text-xs text-muted-foreground">Daha hızlı karar</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-bold text-[#e84393]">3.2k+</p>
                  <p className="text-xs text-muted-foreground">Yerel mağaza</p>
                </div>
              </div>
              <div className="mt-4 border-t border-hairline pt-4 text-center">
                <p className="font-display text-2xl font-bold text-[#6c5ce7]">%15–35</p>
                <p className="text-xs text-muted-foreground">Ortalama tasarruf</p>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section id="how" className="pt-10">
          <div className="mb-10 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#ff6b35]">
              Workflow
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Üç adımda en akıllı satın alma.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Niyet algılamadan teslimat seçimine — karmaşık süreçleri tek bir akışa sıkıştırdık.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Konumunu Belirle",
                desc: "Sana en yakın mağazaları ve pinleri anında listele.",
                color: "#ff6b35",
              },
              {
                step: "2",
                title: "Fiyatları Karşılaştır",
                desc: "Hiç yorulmadan en ucuz ve en yakın opsiyonu yan yana gör.",
                color: "#e84393",
              },
              {
                step: "3",
                title: "Pinle ve Al",
                desc: "İster mağazadan al, ister kapına gelsin — karar senin.",
                color: "#6c5ce7",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="group flex flex-col items-center space-y-4 text-center"
              >
                <div
                  className="grid size-16 place-items-center rounded-2xl font-display text-2xl font-bold transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${s.color}1a`,
                    color: s.color,
                  }}
                >
                  {s.step}
                </div>
                <div>
                  <h4 className="font-display font-bold text-foreground">{s.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Integrations */}
        <section id="integrations" className="rounded-3xl border border-hairline bg-surface-2 px-6 py-12">
          <p className="mb-8 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Tek aramada birleşen platformlar
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {["TRENDYOL", "HEPSİBURADA", "AMAZON.TR", "GETIR", "MİGROS", "N11", "ÇİÇEKSEPETİ"].map(
              (name) => (
                <span
                  key={name}
                  className="font-mono text-sm font-semibold tracking-tight text-muted-foreground transition-colors hover:text-foreground"
                >
                  {name}
                </span>
              ),
            )}
          </div>
        </section>

        {/* Waitlist CTA */}
        <section
          id="waitlist"
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#ff6b35] via-[#e84393] to-[#6c5ce7] px-6 py-16 text-white shadow-xl shadow-[#ff6b35]/20 md:py-20"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2), transparent 40%)",
            }}
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
            <h2 className="mb-6 font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
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
                className="flex-1 rounded-xl border-none bg-white/15 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/20 placeholder:text-white/60 focus:ring-white"
              />
              <button
                type="submit"
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#e84393] shadow-lg transition-transform hover:brightness-105 active:scale-95"
              >
                Sıraya Gir
              </button>
            </form>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-white/70">
              Early access yakında
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-surface-2 py-8 text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid size-5 place-items-center rounded bg-linear-to-br from-[#ff6b35] to-[#e84393]">
              <div className="size-1 rounded-full bg-white" />
            </div>
            <span className="font-mono text-xs">PINTOS © 2026</span>
          </div>
          <div className="flex gap-6 text-xs">
            <a href="#" className="transition-colors hover:text-foreground">Twitter</a>
            <a href="#" className="transition-colors hover:text-foreground">Gizlilik</a>
            <a href="#" className="transition-colors hover:text-foreground">İletişim</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
