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
  {
    id: "cand-dxb-sleeppods", city: "Dubai", brand: "Wellness Sleep Pods (aromatherapy + biometric)", vertical: "Wellness", category: "Passenger-Experience Service", score: 72,
    airportPrecedent: true,
    buzz: bz([40, 46, 52, 58, 64, 70], "Accelerating", "Airport-wellness demand rising all 6 months; pods now layer aromatherapy, soundscapes and biometric sleep/HR tracking. A paid SERVICE — not F&B/retail.", "2026-03"),
    why: "Dubai Airport sleep pods now include aromatherapy diffusers, customisable soundscapes, guided-meditation apps and biometric sensors tracking sleep quality, heart rate and stress.",
    bialFit: "A paid wellness sleep-pod + recovery lounge for BLR red-eye / long-layover passengers — direct non-aero service revenue and a premium experience differentiator.",
    sources: [{ label: "airssist — Dubai Airport sleeping pods", url: "https://airssist.com/dubai-airport-sleeping-pods/", tier: 3 }, { label: "The National — Dubai sleep-pod lounge", url: "https://www.thenationalnews.com/travel/news/2022/08/30/inside-the-biggest-sleep-pod-lounge-at-dubai-international-airport/", tier: 2 }],
  },
  {
    id: "cand-dxb-biometric", city: "Dubai", brand: "Biometric Smart Gates + AI personalisation", company: "Dubai Airports", vertical: "Technology", category: "Seamless-Journey Tech / Passenger Experience", score: 70,
    airportPrecedent: true,
    buzz: bz([48, 52, 56, 60, 66, 72], "Accelerating", "Structural airport-tech shift; 9M+ pax cleared via biometric Smart Gates in H1 2026, AI-personalised services scaling. A technology/idea play, not a product.", "2026-01"),
    why: "Over 9M travellers cleared immigration via biometric Smart Gates at Dubai Airport in H1 2026, with full Emirates ID integration and AI-powered personalised services underway.",
    bialFit: "Biometric seamless journey + AI personalisation at BLR — faster flow AND a data engine for dwell-based retail/F&B offers and retail-media (a commercial play, not just ops).",
    sources: [{ label: "Travel And Tour World — Dubai AI/biometric travel 2026", url: "https://www.travelandtourworld.com/news/article/jlojyrd3vjw8/", tier: 2 }, { label: "Airport Show 2026 — biometrics", url: "https://tech.einnews.com/pr_news/923826973/airport-show-2026-to-showcase-newest-biometrics-technology-for-seamless-and-secure-passenger-experience", tier: 3 }],
  },
];

// ===========================================================================
// KOLKATA market shortlist (≥10) — the surprising data-driven #3 domestic.
// Mix of F&B (specialty coffee / dessert / experiential), retail D2C brands
// racing into East India, and a heritage-gifting anchor.
// ===========================================================================
export const KOLKATA_CANDIDATES: MarketCandidate[] = [
  {
    id: "cand-ccu-thirdwave", city: "Kolkata", brand: "Third Wave Coffee", company: "Third Wave Coffee", vertical: "F&B", category: "Specialty Coffee", score: 80,
    buzz: bz([55, 58, 62, 66, 72, 78], "Accelerating", "Fresh East-India entry with a stated 100-café FY27 plan (220→320 nationwide); rising every month of the window.", "2026-03"),
    why: "Debuted in East India with 3 Kolkata cafés (2 Ballygunge, 1 Salt Lake) and 5–6 more planned in-city this FY; national network 220+ heading to ~320.",
    bialFit: "Specialty-coffee flagship for T1 domestic — captures the Kolkata specialty-coffee wave for BLR's coffee-literate travellers.",
    sources: [{ label: "Indian Retailer — Third Wave enters East India (Kolkata)", url: "https://www.indianretailer.com/news/third-wave-coffee-enters-east-india-three-cafe-launches-kolkata", tier: 2 }, { label: "Franchise India — East-India entry", url: "https://www.franchiseindia.com/insights/en/news/third-wave-coffee-marks-east-india-entry-through-three-kolkata-cafs.59069", tier: 3 }],
  },
  {
    id: "cand-ccu-balaram", city: "Kolkata", brand: "Balaram Mullick & Radharaman Mullick", company: "Balaram Mullick", vertical: "Duty Free", category: "Heritage Bengali Sweets / Gifting", score: 79,
    buzz: bz([64, 64, 66, 66, 68, 70], "Sustained", "Heritage brand (since 1885) with modern SKUs + e-commerce — durable, gently rising buzz, not a fad.", "2026-01"),
    why: "Iconic Kolkata sweet house innovating on tradition — baked rasogolla, daab sandesh, mango soufflé, signature mishti doi; 7 locations + online delivery.",
    bialFit: "A Kolkata 'sense-of-place' sweets & gifting bay (duty free + domestic) — regional heritage gifting is exactly the diaspora/tourist white space BLR under-serves.",
    sources: [{ label: "Slurrp — Balaram Mullick history & signatures", url: "https://www.slurrp.com/article/balaram-mullik-amp-radharam-mullik-history-and-what-to-eat-at-this-iconic-sweet-shop-1728209582037", tier: 3 }, { label: "Balaram Mullick — official", url: "https://www.balarammullick.in/", tier: 1 }],
  },
  {
    id: "cand-ccu-thirdrush", city: "Kolkata", brand: "Third Rush (by Third Wave)", company: "Third Wave Coffee", vertical: "F&B", category: "Dessert-Forward Café", score: 76,
    buzz: bz([0, 0, 30, 52, 70, 82], "Accelerating", "Brand-new dessert concept climbing steeply on Bengal's dessert culture — 4/6 months, strong slope; young but purpose-built for the market.", "2026-05"),
    why: "Third Wave's dessert-forward concept (Jim Jam Tres Leches, layered cakes, tarts, mousses, cheesecakes) launched specifically for Kolkata's love of sweets/evening consumption.",
    bialFit: "Dessert-café grab-and-go — an Instagrammable, evening-occasion format for dwell zones; pairs with specialty coffee.",
    sources: [{ label: "Indian Retailer — Third Wave 'Third Rush' dessert concept", url: "https://www.indianretailer.com/news/third-wave-coffee-enters-east-india-three-cafe-launches-kolkata", tier: 2 }],
  },
  {
    id: "cand-ccu-snitch", city: "Kolkata", brand: "Snitch", company: "Snitch", vertical: "Retail", category: "Menswear D2C / Fast Fashion", score: 74,
    buzz: bz([50, 54, 60, 66, 72, 80], "Accelerating", "High-velocity menswear D2C in aggressive offline rollout; opened its first Kolkata store mid-window — accelerating, 6/6.", "2026-02"),
    why: "Fast-growing menswear D2C brand opened its first Kolkata store on 15 Aug 2026 as part of a rapid national retail expansion.",
    bialFit: "Compact menswear capsule / travel-retail store for young male travellers — high-turnover fashion, low-capex kiosk-to-inline.",
    sources: [{ label: "Indian Retailer — Snitch first Kolkata store", url: "https://www.indianretailer.com/news/retail-india-news-snitch-open-first-kolkata-store-august-15", tier: 2 }],
  },
  {
    id: "cand-ccu-palmonas", city: "Kolkata", brand: "Palmonas", company: "Palmonas", vertical: "Retail", category: "Demi-Fine Jewellery D2C", score: 70,
    buzz: bz([40, 46, 52, 58, 64, 70], "Accelerating", "D2C demi-fine jewellery brand entering East India; rising, 6/6 months.", "2026-03"),
    why: "Opened its first East India store in Kolkata — affordable demi-fine jewellery, a fast-scaling D2C category.",
    bialFit: "Affordable-luxury jewellery kiosk for self-treat + gifting — strong impulse/gifting fit at departures.",
    sources: [{ label: "Indian Retailer — Palmonas first East India store (Kolkata)", url: "https://www.indianretailer.com/news/retail-india-news-palmonas-opens-first-east-india-store-kolkata", tier: 2 }],
  },
  {
    id: "cand-ccu-azorte", city: "Kolkata", brand: "Azorte", company: "Reliance Retail", vertical: "Retail", category: "New-Age Fashion + Beauty Concept", score: 68,
    buzz: bz([30, 36, 44, 52, 58, 64], "Emerging", "Reliance-backed new-format concept opening its first Kolkata high-street store — rising but newer to the market.", "2026-04"),
    why: "Reliance's new-age fashion + beauty self-discovery concept opened its first high-street store in Kolkata.",
    bialFit: "Multi-brand fashion + beauty concept — a curated 'discovery' format for a departures lifestyle zone.",
    sources: [{ label: "Indian Retailer — Azorte first high-street store, Kolkata", url: "https://www.indianretailer.com/news/azorte-opens-first-high-street-store-kolkata", tier: 2 }],
  },
  {
    id: "cand-ccu-yourstruly", city: "Kolkata", brand: "Yours Truly", company: "Yours Truly", vertical: "F&B", category: "Specialty Coffee + Bakery", score: 68,
    buzz: bz([56, 58, 58, 60, 62, 64], "Sustained", "Steady experiential-café buzz; durable, moderate slope.", "2026-02"),
    why: "15,000 sq ft specialty-coffee destination in Bhowanipore with a Coffee Classroom and a bakery built with Lavonne Academy.",
    bialFit: "Experiential café-bakery — a flagship destination format if space allows; else a compact bakery-coffee grab-and-go.",
    sources: [{ label: "EazyDiner — Kolkata's most Instagrammable restaurants", url: "https://www.eazydiner.com/food-trends/kolkatas-8-most-instagrammable-restaurants-to-light-up-your-social-feed", tier: 3 }],
  },
  {
    id: "cand-ccu-lasoiree", city: "Kolkata", brand: "La Soiree", company: "La Soiree", vertical: "F&B", category: "Experiential Fine-Casual Dining", score: 66,
    buzz: bz([48, 50, 54, 56, 58, 60], "Sustained", "Design-led experiential venue; steady social-led buzz.", "2026-02"),
    why: "French-inspired multi-cuisine 'food library' in Bhowanipore, interiors designed by Gauri Khan — a design-led experiential draw.",
    bialFit: "Premium experiential dining / lounge concept for a lounge-adjacent or premium dwell zone.",
    sources: [{ label: "EazyDiner — Kolkata's most Instagrammable restaurants", url: "https://www.eazydiner.com/food-trends/kolkatas-8-most-instagrammable-restaurants-to-light-up-your-social-feed", tier: 3 }],
  },
  {
    id: "cand-ccu-hammer", city: "Kolkata", brand: "Hammer (rooftop café)", company: "Hammer", vertical: "F&B", category: "Rooftop / Experiential Café", score: 61,
    buzz: bz([0, 0, 0, 40, 55, 62], "Emerging", "New Park Street rooftop launch; only 3/6 months — genuinely emerging, validate durability.", "2026-06"),
    why: "Newly launched rooftop café on Park Street, Kolkata's marquee F&B high street.",
    bialFit: "Experiential café concept — lower airport-fit (rooftop format), but a landside terrace/viewing-deck adaptation could work.",
    sources: [{ label: "Indiablooms — Hammer rooftop café, Park Street", url: "https://www.indiablooms.com/life/kolkata-hammer-launches-rooftop-cafe-in-park-street/details", tier: 3 }],
  },
  {
    id: "cand-ccu-converse", city: "Kolkata", brand: "Converse (South City Mall)", company: "Converse", vertical: "Retail", category: "Footwear / Streetwear", score: 60,
    buzz: bz([50, 50, 52, 52, 54, 54], "Sustained", "International brand steady retail expansion; low volatility, dependable rather than hyped.", "2026-01"),
    why: "Converse opened a new store at South City Mall, Kolkata — continued global-brand retail expansion into the East.",
    bialFit: "Iconic footwear/streetwear travel-retail unit for younger travellers — proven global brand, easy airside ops.",
    sources: [{ label: "Indian Retailer — Converse new Kolkata store (South City Mall)", url: "https://www.indianretailer.com/news/retail-india-news-converse-opens-new-store-kolkata-south-city-mall", tier: 2 }],
  },
];

export const ALL_CANDIDATES: MarketCandidate[] = [...DUBAI_CANDIDATES, ...KOLKATA_CANDIDATES];
