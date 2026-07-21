import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type NearbyStore = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  brand: string;
  distanceM: number;
};

function metersBetween(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

export const findNearbyStores = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      brand: z.string().min(1).max(40).default("A101"),
      radiusM: z.number().min(100).max(20000).default(5000),
    }),
  )
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps bağlantısı yapılandırılmamış");
    }

    const res = await fetch(
      "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location",
        },
        body: JSON.stringify({
          textQuery: `${data.brand} market`,
          languageCode: "tr",
          maxResultCount: 20,
          locationBias: {
            circle: {
              center: { latitude: data.lat, longitude: data.lng },
              radius: data.radiusM,
            },
          },
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Google Places hatası: ${res.status} ${text.slice(0, 200)}`,
      );
    }

    const json = (await res.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude: number; longitude: number };
      }>;
    };

    const stores: NearbyStore[] = (json.places ?? [])
      .filter((p) => p.location)
      .map((p) => {
        const lat = p.location!.latitude;
        const lng = p.location!.longitude;
        return {
          id: p.id,
          name: p.displayName?.text ?? data.brand,
          address: p.formattedAddress ?? "",
          lat,
          lng,
          brand: data.brand,
          distanceM: metersBetween([data.lat, data.lng], [lat, lng]),
        };
      })
      .filter((s) => s.distanceM <= data.radiusM)
      .sort((a, b) => a.distanceM - b.distanceM);

    return { stores };
  });
