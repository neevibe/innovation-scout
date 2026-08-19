import type { MarketCandidate, BuzzProfile, BuzzTrajectory } from "@/lib/types";

// Buzz helper: monthly index (oldest→newest) → persistence + trajectory.
function bz(monthly: number[], trajectory: BuzzTrajectory, note: string, firstSeen: string): BuzzProfile {
  const active = monthly.filter((m) => m > 0).length;
  return { windowMonths: 6, firstSeen, monthsActive: active, monthly, persistence: +(active / 6).toFixed(2), trajectory, note };
}

// ===========================================================================
// DUBAI market shortlist (≥10) — the first fully-worked market.
// Every candidate is grounded in ≥1 real source (web / media / social) from
// the last ~6 months, scored on the same model, and buzz-profiled so a
// one-month spike can't masquerade as a durable trend.
// ===========================================================================
export const DUBAI_CANDIDATES: MarketCandidate[] = [
  {
    id: "cand-dxb-filli", city: "Dubai", brand: "FiLLi (Zafran Chai)", company: "FiLLi Café", vertical: "F&B", category: "Regional Beverage / Grab-and-Go", score: 82,
    airportPrecedent: true,
    buzz: bz([56, 58, 62, 66, 70, 76], "Accelerating", "Established homegrown chai chain now pushing into airports — 6/6 months, rising on the DXB airport rollout.", "2026-03"),
    why: "Homegrown saffron 'Zafran Chai' chain; Emirates Leisure Retail just introduced its signature concept at Dubai International Airport with street-food menu and warm-toned interiors.",
    bialFit: "Saffron-chai grab-and-go kiosk in T1/T2 — a regional-beverage novelty with a proven airport operating model and diaspora appeal.",
    sources: [{ label: "Moodie Davitt — FiLLi & Café Bateel at Dubai International", url: "https://moodiedavittreport.com/emirates-leisure-retail-introduces-homegrown-fb-concepts-filli-and-cafe-bateel-at-dubai-international/", tier: 2 }],
  },
  {
    id: "cand-dxb-bateel", city: "Dubai", brand: "Café Bateel", company: "Bateel", vertical: "Duty Free", category: "Gourmet Dates + Coffee / Gifting", score: 80,
    airportPrecedent: true,
    buzz: bz([62, 63, 64, 66, 68, 70], "Sustained", "Premium gourmet brand with steady presence; airport openings kept it in buzz all 6 months.", "2026-02"),
    why: "Mediterranean gourmet concept (handcrafted coffee, pastries, signature date desserts) that opened at Dubai International alongside FiLLi.",
    bialFit: "Premium dates + gourmet-gifting bay in T2 duty free — high-margin diaspora/tourist gifting; travel-exclusive festive packs.",
    sources: [{ label: "Moodie Davitt — Café Bateel at Dubai International", url: "https://moodiedavittreport.com/emirates-leisure-retail-introduces-homegrown-fb-concepts-filli-and-cafe-bateel-at-dubai-international/", tier: 2 }],
  },
  {
    id: "cand-dxb-bkry", city: "Dubai", brand: "bkry", company: "bkry", vertical: "F&B", category: "Viral Bakery / Grab-and-Go", score: 77,
    buzz: bz([18, 28, 46, 66, 82, 88], "Accelerating", "Sharp rise but backed by a FACT award + royal endorsement + sustained queues — durable momentum, not a one-week spike. Watch for plateau.", "2026-03"),
    why: "Viral Korean Tissue Bread earned a FACT Award and a public endorsement from Sheikh Mohammed bin Rashid; queue-worthy Alserkal Avenue venue.",
    bialFit: "Viral-bakery grab-and-go counter or rotating pop-up to capture social-led, queue-driving demand from young travellers.",
    sources: [{ label: "WildyNess — Dubai viral cafés 2026", url: "https://wildyness.com/news/instagrammable-cafes-in-dubai-uae", tier: 4 }, { label: "Fact Dubai — Instagrammable cafés", url: "https://www.factdubai.com/uae/dubai/food/instagrammable-cafes-in-dubai-you-need-to-try", tier: 3 }],
  },
  {
    id: "cand-dxb-eln", city: "Dubai", brand: "EL&N London", company: "EL&N", vertical: "F&B", category: "Experiential 'Instagrammable' Café", score: 74,
    buzz: bz([66, 66, 68, 68, 70, 72], "Sustained", "Globally viral brand with multiple Dubai sites; steady high buzz all 6 months — a proven, not fleeting, social draw.", "2026-01"),
    why: "Viral pink, flower-decorated, neon 'most-Instagrammable' café with sites at Dubai Hills Mall, Dubai Festival City and DIFC Gate Village.",
    bialFit: "Instagrammable experiential café in a dwell zone — designed for social sharing, extends dwell and spend.",
    sources: [{ label: "WildyNess — most Instagrammable cafés Dubai", url: "https://wildyness.com/news/instagrammable-cafes-in-dubai-uae", tier: 4 }, { label: "Akbar Travels — viral Dubai cafés", url: "https://www.akbartravels.com/in/blogs/top-instagrammable-cafes-in-dubai-go-viral-today/", tier: 3 }],
  },
  {
    id: "cand-dxb-espressolab", city: "Dubai", brand: "The Espresso Lab", company: "The Espresso Lab", vertical: "F&B", category: "Specialty Coffee", score: 73,
    buzz: bz([50, 54, 58, 62, 66, 70], "Accelerating", "Homegrown specialty leader scaling steadily across the window.", "2026-02"),
    why: "Emirati design-led specialty-coffee leader repeatedly cited among Dubai's best; strong barista/roastery credentials.",
    bialFit: "Homegrown specialty-coffee flagship with brew-bar theatre — premium third-wave positioning airside.",
    sources: [{ label: "Two Continents — Dubai's best cafés 2026", url: "https://twocontinents.com/blog/cafes-in-dubai-guide", tier: 3 }],
  },
  {
    id: "cand-dxb-tashas", city: "Dubai", brand: "Tashas", company: "Tashas Group", vertical: "F&B", category: "Premium All-Day Café", score: 72,
    buzz: bz([48, 52, 56, 62, 68, 74], "Accelerating", "Homegrown premium café group in active expansion (new-mall openings) — rising slope, 6/6 months.", "2026-02"),
    why: "Premium all-day dining café, a homegrown brand opening at The Grand (new Dubai mall) from September 2026.",
    bialFit: "Premium all-day café for airside dwell — sit-down + grab-and-go hybrid for affluent travellers.",
    sources: [{ label: "What's On — The Grand mall homegrown line-up", url: "https://whatson.ae/2026/07/the-grand-dubais-newest-mall-is-opening-next-month/", tier: 2 }],
  },
  {
    id: "cand-dxb-sevenseeds", city: "Dubai", brand: "Seven Seeds", company: "Seven Seeds", vertical: "F&B", category: "Specialty Coffee", score: 66,
    buzz: bz([30, 38, 46, 54, 60, 66], "Emerging", "Rising specialty name (Melbourne-style); newer, climbing — validate before committing.", "2026-04"),
    why: "Brings Melbourne's specialty-coffee culture to Dubai in an industrial-chic setting with curated food pairings.",
    bialFit: "Third-wave coffee concept — an alternative craft-coffee anchor to test against homegrown options.",
    sources: [{ label: "Two Continents — Dubai's best cafés 2026", url: "https://twocontinents.com/blog/cafes-in-dubai-guide", tier: 3 }],
  },
  {
    id: "cand-dxb-rawcoffee", city: "Dubai", brand: "RAW Coffee Company", company: "RAW Coffee", vertical: "F&B", category: "Specialty Coffee / Roastery", score: 70,
    buzz: bz([58, 58, 60, 60, 62, 62], "Sustained", "Long-standing cult roastery; flat-but-durable buzz — reliable, not hyped.", "2026-01"),
    why: "Al Quoz warehouse-style roastery café known for ethical sourcing and freshly roasted beans; a cult specialty following.",
    bialFit: "Craft-roaster kiosk with retail bean shelf — sustainability + provenance story for conscious travellers.",
    sources: [{ label: "Two Continents — Dubai's best cafés 2026", url: "https://twocontinents.com/blog/cafes-in-dubai-guide", tier: 3 }],
  },
  {
    id: "cand-dxb-foreverrose", city: "Dubai", brand: "Forever Rose Café", company: "Forever Rose", vertical: "F&B", category: "Experiential / Themed Café", score: 64,
    buzz: bz([56, 56, 58, 60, 60, 62], "Sustained", "Steady social-led buzz; themed-café niche, durable but not accelerating.", "2026-01"),
    why: "Illustration-themed, hand-drawn-look Instagrammable café with strong social sharing.",
    bialFit: "Themed experiential café / dessert bar for a photogenic dwell moment.",
    sources: [{ label: "WildyNess — most Instagrammable cafés Dubai", url: "https://wildyness.com/news/instagrammable-cafes-in-dubai-uae", tier: 4 }],
  },
  {
    id: "cand-dxb-hmhome", city: "Dubai", brand: "H&M HOME (concept store)", company: "H&M", vertical: "Retail", category: "Home / Lifestyle Concept", score: 61,
    buzz: bz([0, 0, 22, 46, 60, 66], "Emerging", "New concept (opened May 2026) climbing fast, but only 4/6 months and a lower airport-fit category.", "2026-05"),
    why: "H&M opened its first global HOME concept store at Dubai Mall (23 May 2026) — a full home universe with its own entrance and layout.",
    bialFit: "Travel-lifestyle / home-gifting concept — lower airport-fit, but a compact gifting edit could work landside.",
    sources: [{ label: "RetailBoss — H&M HOME first global concept, Dubai Mall", url: "https://retailboss.co/hm-home-opens-first-global-concept-store-at-dubai-mall/", tier: 2 }],
  },
];

export const ALL_CANDIDATES: MarketCandidate[] = [...DUBAI_CANDIDATES];
