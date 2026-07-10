// Sabit kategori taksonomisi. Bu listenin dışına ÇIKMAYIN.
export const CATEGORY_TREE = {
  "Meyve ve Sebze": ["Meyve", "Sebze"],
  "Et, Tavuk ve Balık": ["Kırmızı Et", "Beyaz Et", "Deniz Ürünleri", "Şarküteri", "Sakatat"],
  "Süt Ürünleri ve Kahvaltılık": [
    "Süt",
    "Yumurta",
    "Peynir",
    "Yoğurt",
    "Zeytin",
    "Tereyağı ve Margarin",
    "Sürülebilir Ürünler ve Kahvaltılık Soslar",
    "Helva Tahin ve Pekmez",
    "Bal ve Reçel",
    "Kahvaltılık Gevrek Bar ve Granola",
    "Kaymak ve Krema",
  ],
  "Temel Gıda": [
    "Ekmek ve Unlu Mamüller",
    "Sıvı Yağlar",
    "Bakliyat",
    "Şeker ve Tatlandırıcılar",
    "Pasta Malzemeleri",
    "Un ve İrmik",
    "Mantı Makarna ve Erişte",
    "Ketçap Mayonez Sos ve Sirkeler",
    "Tuz Baharat ve Harçlar",
    "Salça",
    "Turşu",
    "Konserve",
    "Hazır Gıda",
    "Bebek Mamaları",
  ],
  "İçecek": [
    "Su",
    "Meyve Suyu",
    "Gazlı İçecekler",
    "Gazsız İçecekler",
    "Ayran ve Kefir",
    "Maden Suyu",
    "Çay ve Bitki Çayları",
    "Kahve",
  ],
  "Atıştırmalık ve Tatlı": [
    "Çikolata",
    "Gofret",
    "Bisküvi ve Kraker",
    "Kek",
    "Cips",
    "Kuruyemiş ve Kuru Meyve",
    "Sakız ve Şekerleme",
    "Tatlılar",
    "Dondurmalar",
  ],
  "Temizlik ve Kişisel Bakım Ürünleri": [
    "Bulaşık Temizlik Ürünleri",
    "Çamaşır Temizlik Ürünleri",
    "Genel Temizlik Ürünleri",
    "Mutfak Sarf Malzemeleri",
    "Tuvalet Kağıdı",
    "Kağıt Havlu",
    "Kağıt Peçete ve Mendil",
    "Islak Mendil",
    "Saç Bakım",
    "Duş Banyo ve Sabun",
    "Ağız Bakım",
    "Hijyenik Ped",
    "Bebek ve Hasta Bezi",
    "Parfüm Deodorant Kolonya ve Kokular",
    "Cilt Bakımı",
    "Makyaj",
    "Diğer Temizlik ve Kişisel Bakım Ürünleri",
  ],
} as const;

export type CategoryGroup = keyof typeof CATEGORY_TREE;

export const CATEGORY_GROUPS: readonly CategoryGroup[] = Object.keys(
  CATEGORY_TREE,
) as CategoryGroup[];

export const ALL_SUBCATEGORIES: readonly string[] = Object.values(CATEGORY_TREE).flat();

export function isValidSubcategory(v: string): boolean {
  return ALL_SUBCATEGORIES.includes(v);
}

export function groupOf(sub: string): CategoryGroup | null {
  for (const g of CATEGORY_GROUPS) {
    if ((CATEGORY_TREE[g] as readonly string[]).includes(sub)) return g;
  }
  return null;
}

// AI prompt için düz metin liste
export function categoryPromptList(): string {
  return CATEGORY_GROUPS.map(
    (g) => `- ${g}: ${(CATEGORY_TREE[g] as readonly string[]).join(", ")}`,
  ).join("\n");
}
