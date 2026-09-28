import type { TrendDefinition } from "./types";

// ---------------------------------------------------------------------------
// The tracked trend universe. Each entry is measured on every connected
// platform by the collector (scripts/collectTrends.ts). The `blr` block is the
// analyst layer — the only hand-authored part — translating a trend into an
// airport commercial move. Numbers on the page never come from here except
// `blr.fit`, which is labelled as analyst fit.
// ---------------------------------------------------------------------------
export const TREND_CATALOG: TrendDefinition[] = [
  {
    id: "k-beauty", name: "K-Beauty", category: "Beauty", query: "k-beauty", wiki: "K-beauty",
    blr: { fit: 90, vertical: "Duty Free", zone: "T2 Intl departures", play: "K-beauty travel-exclusive bay — sheet masks, SPF, minis. Present at DXB/SIN/ICN, absent at BLR; the youngest outbound mix in India.", links: [{ label: "Foxtale — homegrown beauty opp", href: "/opportunities/opp-foxtale" }] },
  },
  {
    id: "matcha", name: "Matcha", category: "F&B", query: "matcha", wiki: "Matcha",
    blr: { fit: 86, vertical: "F&B", zone: "T1 + T2 landside/airside", play: "Matcha bar or matcha-led café slot (VE/LA-class). Pairs with the existing matcha pop-up opportunity.", links: [{ label: "Matcha pop-up opportunity", href: "/opportunities/opp-matcha" }, { label: "Singapore shortlist (VE/LA)", href: "/markets/sin" }] },
  },
  {
    id: "hojicha", name: "Hojicha", category: "F&B", query: "hojicha", wiki: "Hōjicha",
    blr: { fit: 62, vertical: "F&B", zone: "Café menus", play: "Menu-level add-on to matcha/specialty coffee operators rather than a standalone unit.", links: [{ label: "Dubai shortlist (Puzzle Coffee)", href: "/markets/dxb" }] },
  },
  {
    id: "labubu", name: "Labubu / Pop Mart", category: "Culture", query: "labubu", wiki: "Labubu",
    blr: { fit: 74, vertical: "Retail", zone: "T2 Intl + landside", play: "Designer-toy / blind-box vending wall or Pop Mart robo-shop — high-velocity impulse retail with queue appeal.", links: [] },
  },
  {
    id: "dubai-chocolate", name: "Dubai chocolate", category: "F&B", query: "dubai chocolate", wiki: "Dubai chocolate",
    blr: { fit: 70, vertical: "Duty Free", zone: "Confectionery / gifting", play: "Kunafa-pistachio bars as a confectionery SKU line — check lifecycle before committing shelf space.", links: [{ label: "Dubai shortlist", href: "/markets/dxb" }] },
  },
  {
    id: "specialty-coffee", name: "Specialty coffee", category: "F&B", query: "specialty coffee", wiki: "Specialty coffee",
    blr: { fit: 84, vertical: "F&B", zone: "Airside piers", play: "Craft roaster flagship with brew-bar theatre (Subko / Third Wave class).", links: [{ label: "Subko opportunity", href: "/opportunities/opp-subko" }] },
  },
  {
    id: "filter-coffee", name: "South Indian filter coffee", category: "F&B", query: "filter coffee", wiki: "Indian filter coffee",
    blr: { fit: 82, vertical: "F&B", zone: "T1 + T2, gifting", play: "Bengaluru-signature filter-coffee counter + packaged decoction gifting — local identity product.", links: [{ label: "Sweet Karam Coffee opp", href: "/opportunities/opp-sweetkaram" }] },
  },
  {
    id: "protein-snacks", name: "High-protein snacks", category: "F&B", query: "protein snacks", wiki: "Protein bar",
    blr: { fit: 72, vertical: "F&B", zone: "Grab-and-go / convenience", play: "Protein-forward grab-and-go range in convenience and QSR (Basil-class kiosk).", links: [{ label: "Basil grab-and-go opp", href: "/opportunities/opp-basil" }] },
  },
  {
    id: "mushroom-coffee", name: "Mushroom coffee", category: "Wellness", query: "mushroom coffee", wiki: "Medicinal fungi",
    blr: { fit: 45, vertical: "F&B", zone: "Wellness shelf", play: "SKU test inside a wellness/pharmacy shelf only.", links: [] },
  },
  {
    id: "pickleball", name: "Pickleball", category: "Wellness", query: "pickleball", wiki: "Pickleball",
    blr: { fit: 38, vertical: "Experiences", zone: "Landside / campus", play: "Brand activation or landside court on the airport campus — not a terminal format.", links: [] },
  },
  {
    id: "run-clubs", name: "Run clubs", category: "Wellness", query: "run club", wiki: "Running club",
    blr: { fit: 40, vertical: "Experiences", zone: "Campus events", play: "Community partnership (BLR campus runs) rather than a retail play.", links: [] },
  },
  {
    id: "sleep-tourism", name: "Sleep tourism", category: "Travel", query: "sleep tourism", wiki: "Sleep tourism",
    blr: { fit: 76, vertical: "Wellness", zone: "T2 transit", play: "Bookable sleep pods / nap lounge for red-eye and transit passengers.", links: [{ label: "Dubai shortlist (sleep pods)", href: "/markets/dxb" }] },
  },
  {
    id: "red-light-therapy", name: "Red light therapy", category: "Wellness", query: "red light therapy", wiki: "Light therapy",
    blr: { fit: 58, vertical: "Wellness", zone: "Lounge / wellness zone", play: "Recovery studio sessions (Hamad ORCHARD model) inside a lounge or wellness zone.", links: [] },
  },
  {
    id: "solo-travel", name: "Solo travel", category: "Travel", query: "solo travel",
    blr: { fit: 55, vertical: "Travel Services", zone: "Services", play: "Solo-traveller services: single-seat dining counters, safety/concierge services, compact travel kits.", links: [] },
  },
  {
    id: "digiyatra", name: "DigiYatra / biometric travel", category: "Technology", query: "digiyatra", wiki: "Digi Yatra",
    blr: { fit: 68, vertical: "Technology", zone: "Processors", play: "Biometric identity as a retail and personalisation layer (walk-through lanes, pay-by-face).", links: [] },
  },
  {
    id: "smart-glasses", name: "AI smart glasses", category: "Technology", query: "smart glasses", wiki: "Smartglasses",
    blr: { fit: 66, vertical: "Retail", zone: "T2 Intl tech retail", play: "Demo-led tech retail (Ray-Ban Meta class) — high AOV, strong gifting and try-on theatre.", links: [] },
  },
  {
    id: "quick-commerce", name: "Quick commerce", category: "Retail", query: "quick commerce", wiki: "Q-commerce",
    blr: { fit: 60, vertical: "Services", zone: "Landside / pre-order", play: "Pre-order to gate or 10-minute landside pickup via a q-commerce partner.", links: [] },
  },
  {
    id: "lab-grown-diamonds", name: "Lab-grown diamonds", category: "Retail", query: "lab grown diamonds", wiki: "Synthetic diamond",
    blr: { fit: 64, vertical: "Retail", zone: "T2 luxury walk", play: "Lab-grown fine jewellery boutique — accessible luxury with a strong India supply story.", links: [] },
  },
  {
    id: "athleisure", name: "Athleisure", category: "Fashion", query: "athleisure", wiki: "Athleisure",
    blr: { fit: 70, vertical: "Retail", zone: "Airside fashion", play: "Travel-comfort athleisure (BlissClub — Bengaluru-born — or lululemon-class).", links: [] },
  },
  {
    id: "quiet-luxury", name: "Quiet luxury", category: "Fashion", query: "quiet luxury", wiki: "Quiet luxury",
    blr: { fit: 52, vertical: "Duty Free", zone: "T2 luxury walk", play: "Informs assortment tone of the luxury walk rather than a single tenant.", links: [] },
  },
  {
    id: "anime-merch", name: "Anime merchandise", category: "Culture", query: "anime merchandise", wiki: "One Piece",
    blr: { fit: 66, vertical: "Retail", zone: "T2 pop-up", play: "Anime IP pop-up (Toei Animation store model at Jewel Changi).", links: [{ label: "Singapore shortlist (Toei)", href: "/markets/sin" }] },
  },
  {
    id: "niche-fragrance", name: "Niche fragrance", category: "Beauty", query: "niche perfume", wiki: "Perfume",
    blr: { fit: 78, vertical: "Duty Free", zone: "T2 Intl beauty", play: "Niche/Indian-attar fragrance discovery bar with travel minis.", links: [] },
  },
];
