// ⚠ Handles were filled in from memory and are UNVERIFIED — check each one on
// instagram.com / facebook.com before relying on it.
// Brand accounts the scout follows on Instagram / Facebook, per pilot market.
// Handles are the public account usernames — edit freely; an unknown or
// non-business handle is skipped (Business Discovery only sees Business /
// Creator accounts). Hashtags are searched for recent posts (Meta allows 30
// unique hashtags per rolling 7 days, so keep the total ≤ 25).

export interface WatchBrand {
  brand: string;
  city: string; // pilot city (City.name)
  instagram?: string;
  facebook?: string; // page username or numeric id
}

export const WATCHLIST: WatchBrand[] = [
  { brand: "Mokobara", city: "Mumbai", instagram: "mokobara", facebook: "mokobara" },
  { brand: "Blue Tokai", city: "Delhi NCR", instagram: "bluetokaicoffee", facebook: "bluetokaicoffee" },
  { brand: "Third Wave Coffee", city: "Kolkata", instagram: "thirdwavecoffeeindia" },
  { brand: "Subko", city: "Mumbai", instagram: "subko.coffee" },
  { brand: "FiLLi Cafe", city: "Dubai", instagram: "fillicafe" },
  { brand: "Bateel", city: "Dubai", instagram: "bateel", facebook: "Bateel" },
  { brand: "TWG Tea", city: "Singapore", instagram: "twgteaofficial", facebook: "TWGTea" },
  { brand: "Gail's Bakery", city: "London", instagram: "gailsbakery" },
  { brand: "Olive Young", city: "Singapore", instagram: "oliveyoung_global" },
];

export const CITY_HASHTAGS: Record<string, string[]> = {
  Dubai: ["dubaifood", "dubaicafe"],
  Singapore: ["sgfood", "singaporecafe"],
  London: ["londonfood", "newinlondon"],
  "Delhi NCR": ["delhifood", "delhicafe"],
  Mumbai: ["mumbaifood", "mumbaicafe"],
  Kolkata: ["kolkatafood", "kolkatacafe"],
};
export const GLOBAL_HASHTAGS = ["dutyfree", "travelretail", "kbeauty", "newopening"];
