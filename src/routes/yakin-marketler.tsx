import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import pintosLogoH from "@/assets/pintos-logo.png.asset.json";
import {
  findNearbyStores,
  type NearbyStore,
} from "@/lib/api/nearby-stores.functions";

export const Route = createFileRoute("/yakin-marketler")({
  head: () => ({
    meta: [
      { title: "Yakın Marketler — Pintos" },
      {
        name: "description",
        content:
          "Konumuna göre 5 km çevrendeki A101, BIM, Migros ve tüm marketleri haritada gör.",
      },
    ],
  }),
  component: YakinMarketlerPage,
  ssr: false,
});

const ISTANBUL_FALLBACK: [number, number] = [41.0082, 28.9784];
const BRANDS = ["A101", "BIM", "Migros", "ŞOK", "Carrefour"] as const;
type Brand = (typeof BRANDS)[number];

const BRAND_COLORS: Record<Brand, string> = {
  A101: "#e11d48",
  BIM: "#dc2626",
  Migros: "#f97316",
  "ŞOK": "#eab308",
  Carrefour: "#2563eb",
};

const userIcon = L.divIcon({
  className: "pintos-user",
  html: `<div style="position:relative;width:22px;height:22px">
    <div style="position:absolute;inset:0;background:rgba(59,130,246,.25);border-radius:50%;animation:pintosPulse 2s ease-out infinite"></div>
    <div style="position:absolute;inset:5px;background:#3b82f6;border-radius:50%;box-shadow:0 0 0 3px #fff,0 4px 10px rgba(59,130,246,.5)"></div>
  </div>
  <style>@keyframes pintosPulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2.2);opacity:0}}</style>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const brandIcon = (color: string, label: string) =>
  L.divIcon({
    className: "pintos-brand-pin",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-6px)">
      <div style="background:${color};color:#fff;border-radius:6px;padding:2px 8px;font:700 10px 'JetBrains Mono',monospace;box-shadow:0 4px 10px -2px rgba(0,0,0,.35);white-space:nowrap">${label}</div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color};margin-top:-1px"></div>
    </div>`,
    iconSize: [60, 30],
    iconAnchor: [30, 28],
  });

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.2 });
  }, [center, map]);
  return null;
}

function YakinMarketlerPage() {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<
    "idle" | "locating" | "ready" | "denied"
  >("idle");
  const [activeBrands, setActiveBrands] = useState<Set<Brand>>(new Set(["A101"]));
  const [stores, setStores] = useState<Record<Brand, NearbyStore[]>>({
    A101: [],
    BIM: [],
    Migros: [],
    "ŞOK": [],
    Carrefour: [],
  });
  const [loading, setLoading] = useState<Set<Brand>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("denied");
      setUserPos(ISTANBUL_FALLBACK);
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setStatus("ready");
      },
      () => {
        setUserPos(ISTANBUL_FALLBACK);
        setStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  const fetchBrand = async (brand: Brand, lat: number, lng: number) => {
    setLoading((prev) => new Set(prev).add(brand));
    setError(null);
    try {
      const res = await findNearbyStores({
        data: { lat, lng, brand, radiusM: 5000 },
      });
      setStores((prev) => ({ ...prev, [brand]: res.stores }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(brand);
        return next;
      });
    }
  };

  // Auto-fetch A101 as soon as location resolves
  useEffect(() => {
    if (userPos && stores.A101.length === 0 && !loading.has("A101")) {
      fetchBrand("A101", userPos[0], userPos[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos]);

  const toggleBrand = (brand: Brand) => {
    setActiveBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) {
        next.delete(brand);
      } else {
        next.add(brand);
        if (userPos && stores[brand].length === 0 && !loading.has(brand)) {
          fetchBrand(brand, userPos[0], userPos[1]);
        }
      }
      return next;
    });
  };

  const visibleStores = useMemo(() => {
    const arr: NearbyStore[] = [];
    activeBrands.forEach((b) => arr.push(...stores[b]));
    return arr.sort((a, b) => a.distanceM - b.distanceM);
  }, [stores, activeBrands]);

  const center = userPos ?? ISTANBUL_FALLBACK;

  return (
    <div className="flex h-screen flex-col bg-background font-sans text-foreground">
      <header className="z-20 flex items-center justify-between border-b border-hairline bg-background/90 px-6 py-3 backdrop-blur">
        <a href="/" className="flex items-center gap-2" aria-label="Pintos">
          <img src={pintosLogoH.url} alt="Pintos" className="h-7 w-auto" />
          <span className="text-xs font-semibold tracking-tight text-muted-foreground">
            · Yakın Marketler
          </span>
        </a>
        <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
          {status === "locating" && "Konum alınıyor…"}
          {status === "ready" &&
            `LAT ${center[0].toFixed(4)} · LNG ${center[1].toFixed(4)}`}
          {status === "denied" && "Varsayılan: İstanbul"}
        </span>
      </header>

      <div className="grid flex-1 min-h-0 lg:grid-cols-[360px_1fr]">
        <aside className="z-10 flex min-h-0 flex-col border-r border-hairline bg-surface">
          <div className="border-b border-hairline p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              5 km çevrende · Google Maps
            </p>
            <div className="flex flex-wrap gap-1.5">
              {BRANDS.map((b) => {
                const on = activeBrands.has(b);
                const isLoading = loading.has(b);
                return (
                  <button
                    key={b}
                    onClick={() => toggleBrand(b)}
                    className={
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors " +
                      (on
                        ? "border-transparent text-white"
                        : "border-hairline bg-background text-foreground hover:bg-muted")
                    }
                    style={on ? { background: BRAND_COLORS[b] } : undefined}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{
                        background: on ? "#fff" : BRAND_COLORS[b],
                      }}
                    />
                    {b}
                    {isLoading && <span className="animate-pulse">…</span>}
                    {!isLoading && on && stores[b].length > 0 && (
                      <span className="font-mono text-[10px] opacity-80">
                        {stores[b].length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {error && (
              <p className="mt-2 font-mono text-[10px] text-destructive">
                {error}
              </p>
            )}
          </div>

          <ul className="flex-1 divide-y divide-hairline overflow-y-auto">
            {visibleStores.length === 0 && (
              <li className="p-6 text-center text-xs text-muted-foreground">
                {loading.size > 0
                  ? "Marketler yükleniyor..."
                  : "Bir marka seç, çevrendeki mağazalar burada listelensin."}
              </li>
            )}
            {visibleStores.map((s, idx) => {
              const active = selected === s.id;
              const color = BRAND_COLORS[s.brand as Brand] ?? "#18181b";
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setSelected(s.id)}
                    className={
                      "w-full px-4 py-3 text-left transition-colors " +
                      (active ? "bg-brand/10" : "hover:bg-background")
                    }
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 size-2.5 shrink-0 rounded-full"
                        style={{ background: color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            #{String(idx + 1).padStart(2, "0")}
                          </span>
                          <p className="truncate text-sm font-medium">
                            {s.name}
                          </p>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {s.address}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground ring-1 ring-hairline">
                            {s.distanceM < 1000
                              ? `${s.distanceM}m`
                              : `${(s.distanceM / 1000).toFixed(1)}km`}
                          </span>
                          <span
                            className="rounded px-1.5 py-0.5 font-mono text-[10px] text-white"
                            style={{ background: color }}
                          >
                            {s.brand}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="relative min-h-0">
          {status === "locating" && !userPos && (
            <div className="absolute inset-0 z-[400] grid place-items-center bg-background/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-xs font-medium shadow-lg ring-1 ring-black/5">
                <span className="size-2 animate-pulse rounded-full bg-brand" />
                Konum alınıyor…
              </div>
            </div>
          )}
          <MapContainer
            center={center}
            zoom={14}
            scrollWheelZoom
            className="h-full w-full"
            style={{ background: "#f4f4f5" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {userPos && <Recenter center={userPos} />}
            {userPos && (
              <>
                <Marker position={userPos} icon={userIcon}>
                  <Popup>Buradasın</Popup>
                </Marker>
                <Circle
                  center={userPos}
                  radius={5000}
                  pathOptions={{
                    color: "#fbbf24",
                    weight: 1,
                    opacity: 0.5,
                    fillColor: "#fbbf24",
                    fillOpacity: 0.04,
                  }}
                />
              </>
            )}
            {visibleStores.map((s) => {
              const color = BRAND_COLORS[s.brand as Brand] ?? "#18181b";
              return (
                <Marker
                  key={s.id}
                  position={[s.lat, s.lng]}
                  icon={brandIcon(color, s.brand)}
                  eventHandlers={{ click: () => setSelected(s.id) }}
                >
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>
                        {s.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          margin: "4px 0 6px",
                        }}
                      >
                        {s.address}
                      </div>
                      <div style={{ fontSize: 11 }}>
                        {s.distanceM < 1000
                          ? `${s.distanceM}m uzakta`
                          : `${(s.distanceM / 1000).toFixed(1)}km uzakta`}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
