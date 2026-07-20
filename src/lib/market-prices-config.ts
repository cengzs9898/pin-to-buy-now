// Curated keyword list used by the weekly sync job. One or two per subcategory
// so we get a solid, balanced weekly snapshot from marketfiyati.org.tr.
export const SYNC_KEYWORDS: readonly string[] = [
  // Meyve ve Sebze
  "elma", "domates", "muz", "salatalık",
  // Et, Tavuk ve Balık
  "kıyma", "tavuk göğüs", "hamsi", "sucuk",
  // Süt Ürünleri ve Kahvaltılık
  "süt", "yumurta", "peynir", "yoğurt", "zeytin", "tereyağı", "bal", "reçel", "kahvaltılık gevrek",
  // Temel Gıda
  "ekmek", "ayçiçek yağı", "zeytinyağı", "pirinç", "mercimek", "nohut", "şeker",
  "makarna", "un", "salça", "ketçap", "mayonez", "tuz", "hazır çorba", "bebek maması",
  // İçecek
  "su", "meyve suyu", "kola", "ayran", "maden suyu", "çay", "kahve",
  // Atıştırmalık
  "çikolata", "gofret", "bisküvi", "kek", "cips", "fındık", "şekerleme", "dondurma",
  // Temizlik & Kişisel Bakım
  "bulaşık deterjanı", "çamaşır deterjanı", "yüzey temizleyici", "tuvalet kağıdı",
  "kağıt havlu", "peçete", "ıslak mendil", "şampuan", "duş jeli", "sabun",
  "diş macunu", "hijyenik ped", "bebek bezi", "deodorant", "krem",
];

// Menu category → group mapping we already ship (used to label rows).
