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

export const Route = createFileRoute("/harita")({
  head: () => ({
    meta: [
      { title: "Pintos Harita — Yakındaki satıcılar canlı" },
      {
        name: "description",
        content:
          "Konumuna göre yakındaki satıcıları gerçek zamanlı haritada gör. En yakın ve en ucuz ürünü tek pin ile bul.",
      },
    ],
  }),
  component: HaritaPage,
  ssr: false,
});

type Seller = {
  id: string;
  name: string;
  category: string;
  product: string;
  price: number;
  distanceM: number;
  etaMin: number;
  lat: number;
  lng: number;
};

const ISTANBUL_FALLBACK: [number, number] = [41.0082, 28.9784];

const SELLER_TEMPLATES: Omit<Seller, "lat" | "lng" | "distanceM">[] = [
  { id: "s1", name: "Mahalle Teknoloji Market", category: "Elektronik", product: "Anker USB-C Kablo", price: 349, etaMin: 12 },
  { id: "s2", name: "Şarj Dünyası", category: "Elektronik", product: "Apple USB-C 1m", price: 549, etaMin: 18 },
  { id: "s3", name: "Hızlı Bakkal", category: "Market", product: "Soğuk Kahve 250ml", price: 39, etaMin: 8 },
  { id: "s4", name: "Eczane Sağlık", category: "Eczane", product: "Bebek Bezi 4 Beden", price: 289, etaMin: 15 },
  { id: "s5", name: "Troy Store", category: "Elektronik", product: "Baseus 100W Kablo", price: 320, etaMin: 22 },
  { id: "s6", name: "Migros Express", category: "Market", product: "Süt 1L", price: 49, etaMin: 10 },
  { id: "s7", name: "TeknoPoint", category: "Elektronik", product: "Anker Kablo (Lite)", price: 299, etaMin: 25 },
  { id: "s8", name: "Carrefour Mini", category: "Market", product: "Çamaşır Deterjanı", price: 159, etaMin: 14 },
];

function metersBetween(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

function offsetCoord([lat, lng]: [number, number], meters: number, bearingDeg: number): [number, number] {
  const R = 6371000;
  const br = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(meters / R) + Math.cos(lat1) * Math.sin(meters / R) * Math.cos(br),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(br) * Math.sin(meters / R) * Math.cos(lat1),
      Math.cos(meters / R) - Math.sin(lat1) * Math.sin(lat2),
    );
  return [(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI];
}

const pinIcon = (color: string, label: string) =>
  L.divIcon({
    className: "pintos-pin",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-6px)">
      <div style="background:#fafafa;border:1px solid rgba(0,0,0,.08);box-shadow:0 6px 14px -6px rgba(0,0,0,.25);border-radius:999px;padding:2px 8px;font:600 11px 'JetBrains Mono',monospace;color:#18181b;margin-bottom:2px;white-space:nowrap">${label}</div>
      <div style="width:14px;height:14px;background:${color};border-radius:50%;box-shadow:0 0 0 4px #fafafa,0 6px 12px -4px rgba(0,0,0,.4)"></div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 36],
  });

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

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.2 });
  }, [center, map]);
  return null;
}

const FILTERS = [
  { id: "nearest", label: "En Yakın" },
  { id: "cheapest", label: "En Ucuz" },
  { id: "fastest", label: "En Hızlı" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

function HaritaPage() {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "ready" | "denied">("idle");
  const [filter, setFilter] = useState<Filter>("nearest");
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

  const sellers = useMemo<Seller[]>(() => {
    if (!userPos) return [];
    return SELLER_TEMPLATES.map((t, i) => {
      const meters = 250 + ((i * 173) % 1800);
      const bearing = (i * 47) % 360;
      const [lat, lng] = offsetCoord(userPos, meters, bearing);
      return {
        ...t,
        lat,
        lng,
        distanceM: metersBetween(userPos, [lat, lng]),
      };
    });
  }, [userPos]);

  const sorted = useMemo(() => {
    const arr = [...sellers];
    if (filter === "nearest") arr.sort((a, b) => a.distanceM - b.distanceM);
    if (filter === "cheapest") arr.sort((a, b) => a.price - b.price);
    if (filter === "fastest") arr.sort((a, b) => a.etaMin - b.etaMin);
    return arr;
  }, [sellers, filter]);

  const recenter = () => {
    if (!("geolocation" in navigator)) return;
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setStatus("ready");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const center = userPos ?? ISTANBUL_FALLBACK;

  return (
    <div className="flex h-screen flex-col bg-background font-sans text-foreground">
      {/* Header */}
      <header className="z-20 flex items-center justify-between border-b border-hairline bg-background/90 px-6 py-3 backdrop-blur">
        <a href="/" className="flex items-center gap-2">
          <div className="grid size-6 place-items-center rounded bg-brand">
            <div className="size-1.5 rounded-full bg-ink" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Pintos · Harita</span>
        </a>
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
            {status === "locating" && "Konum alınıyor…"}
            {status === "ready" && `LAT ${center[0].toFixed(4)} · LNG ${center[1].toFixed(4)}`}
            {status === "denied" && "Varsayılan: İstanbul"}
            {status === "idle" && "Hazır"}
          </span>
          <button
            onClick={recenter}
            className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground transition-transform active:scale-95"
          >
            Konumumu Bul
          </button>
        </div>
      </header>

      <div className="grid flex-1 min-h-0 lg:grid-cols-[360px_1fr]">
        {/* Sidebar */}
        <aside className="z-10 flex min-h-0 flex-col border-r border-hairline bg-surface">
          <div className="border-b border-hairline p-4">
            <div className="mb-3 flex gap-1 rounded-lg bg-background p-1 ring-1 ring-black/5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={
                    filter === f.id
                      ? "flex-1 rounded-md bg-brand px-2 py-1.5 text-xs font-semibold text-brand-foreground"
                      : "flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {sorted.length} satıcı · canlı
            </p>
          </div>

          <ul className="flex-1 divide-y divide-hairline overflow-y-auto">
            {sorted.map((s, idx) => {
              const active = selected === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setSelected(s.id)}
                    className={
                      "w-full px-4 py-3 text-left transition-colors " +
                      (active ? "bg-brand/10" : "hover:bg-background")
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            #{String(idx + 1).padStart(2, "0")}
                          </span>
                          <p className="truncate text-sm font-medium">{s.name}</p>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {s.product} · {s.category}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground ring-1 ring-hairline">
                            {s.distanceM < 1000
                              ? `${s.distanceM}m`
                              : `${(s.distanceM / 1000).toFixed(1)}km`}
                          </span>
                          <span className="rounded bg-success-soft px-1.5 py-0.5 font-mono text-[10px] text-success">
                            {s.etaMin} dk
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-semibold tracking-tight">
                        ₺{s.price}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Map */}
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
                  radius={2000}
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
            {sorted.map((s) => {
              const isSelected = selected === s.id;
              const color =
                filter === "cheapest" && s.id === sorted[0]?.id
                  ? "#22c55e"
                  : filter === "fastest" && s.id === sorted[0]?.id
                    ? "#3b82f6"
                    : s.id === sorted[0]?.id
                      ? "#fbbf24"
                      : "#18181b";
              return (
                <Marker
                  key={s.id}
                  position={[s.lat, s.lng]}
                  icon={pinIcon(isSelected ? "#fbbf24" : color, `₺${s.price}`)}
                  eventHandlers={{ click: () => setSelected(s.id) }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                        {s.product}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                        <span>
                          {s.distanceM < 1000
                            ? `${s.distanceM}m`
                            : `${(s.distanceM / 1000).toFixed(1)}km`}{" "}
                          · {s.etaMin} dk
                        </span>
                        <strong>₺{s.price}</strong>
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
