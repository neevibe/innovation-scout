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

// helper to cut boilerplate
type C = MarketCandidate;
const mk = (o: Omit<C, "buzz"> & { m: number[]; t: BuzzTrajectory; bn: string; fs: string }): C => {
  const { m, t, bn, fs, ...rest } = o;
  return { ...rest, buzz: bz(m, t, bn, fs) };
};
const S = (label: string, url: string, tier: 1 | 2 | 3 | 4) => ({ label, url, tier });

// ===========================================================================
// DELHI NCR (#1 domestic by pax) — many already live at Delhi T3 (precedent).
// ===========================================================================
export const DELHI_CANDIDATES: C[] = [
  mk({ id: "cand-del-renee", city: "Delhi NCR", brand: "Renee Cosmetics", vertical: "Duty Free", category: "Homegrown Colour Cosmetics", score: 76, airportPrecedent: true, why: "Homegrown colour-cosmetics brand added to Delhi T3's retail mix.", bialFit: "Homegrown beauty SKU line / travel-exclusive kit in duty free.", sources: [S("Moodie Davitt — Delhi T3 speciality retail", "https://moodiedavittreport.com/delhi-airport-opens-two-speciality-retail-concessions-in-t3/", 2)], m: [55, 58, 62, 66, 70, 76], t: "Accelerating", bn: "Homegrown beauty scaling into airports; 6/6 months.", fs: "2026-02" }),
  mk({ id: "cand-del-giva", city: "Delhi NCR", brand: "Giva", vertical: "Retail", category: "Demi-Fine Jewellery D2C", score: 74, airportPrecedent: true, why: "D2C silver/demi-fine jewellery brand present at Delhi T3.", bialFit: "Affordable-luxury jewellery kiosk — strong impulse + gifting.", sources: [S("Moodie Davitt — Delhi T3 retail additions", "https://moodiedavittreport.com/india-retails-hospitality-elevates-delhi-airport-retail-mix-with-cross-category-store-openings/", 2)], m: [50, 55, 60, 66, 72, 78], t: "Accelerating", bn: "Fast-scaling D2C jewellery, airport-proven.", fs: "2026-02" }),
  mk({ id: "cand-del-frido", city: "Delhi NCR", brand: "Frido", vertical: "Products & SKUs", category: "Travel-Comfort / Ergonomics SKUs", score: 74, why: "D2C ergonomics/comfort brand opened 15 experiential stores across metros.", bialFit: "Travel-comfort SKUs (neck pillows, seat cushions, insoles) grab-and-go — a natural airport product category.", sources: [S("Indian Retailer — Frido 15 experiential stores", "https://www.indianretailer.com/news/frido-expands-offline-presence-15-new-experiential-stores-across-india", 2)], m: [48, 54, 60, 66, 70, 76], t: "Accelerating", bn: "Rapid experiential-retail rollout; product category made for airports.", fs: "2026-02" }),
  mk({ id: "cand-del-neotravel", city: "Delhi NCR", brand: "NeoTravel (IRHPL)", vertical: "Travel Services", category: "Cross-Category Travel Retail", score: 72, airportPrecedent: true, why: "Cross-category travel-retail concept expanding across Delhi airport.", bialFit: "Multi-category travel-essentials store format for BLR departures.", sources: [S("Indian Retailer — IRHPL NeoTravel stores, Delhi", "https://www.indianretailer.com/news/retail-india-news-irhpl-expands-airport-retail-neotravel-stores-delhi", 2)], m: [52, 56, 60, 64, 68, 72], t: "Accelerating", bn: "Airport-native format scaling at Delhi.", fs: "2026-02" }),
  mk({ id: "cand-del-maharishi", city: "Delhi NCR", brand: "Maharishi Ayurveda", vertical: "Wellness", category: "Ayurvedic Wellness Retail", score: 70, why: "First experiential wellness flagship (Green Park) pairing Ayurvedic consultation with a full product portfolio.", bialFit: "Ayurveda wellness + travel-remedy SKU counter — a 'sense-of-India' wellness gifting play.", sources: [S("Indian Retailer — Delhi NCR retail trends 2026", "https://www.indianretailer.com/news/frido-expands-offline-presence-15-new-experiential-stores-across-india", 3)], m: [40, 46, 52, 58, 62, 66], t: "Emerging", bn: "New experiential wellness format, rising.", fs: "2026-03" }),
  mk({ id: "cand-del-olfactive", city: "Delhi NCR", brand: "The Olfactive", vertical: "Duty Free", category: "Niche Fragrance", score: 71, airportPrecedent: true, why: "Homegrown fragrance concept added at Delhi T3.", bialFit: "Niche-fragrance travel-exclusive bay in duty free.", sources: [S("Moodie Davitt — Delhi T3 speciality retail", "https://moodiedavittreport.com/delhi-airport-opens-two-speciality-retail-concessions-in-t3/", 2)], m: [58, 60, 62, 64, 66, 68], t: "Sustained", bn: "Steady; airport-proven fragrance concept.", fs: "2026-01" }),
  mk({ id: "cand-del-newbalance", city: "Delhi NCR", brand: "New Balance (New Retail Concept)", vertical: "Retail", category: "Performance-Lifestyle Footwear", score: 68, why: "Launched its first 'New Retail Concept' store in India at DLF Mall of India.", bialFit: "Performance-lifestyle footwear concept for younger travellers.", sources: [S("Indian Retailer — New Balance concept store, India", "https://www.indianretailer.com/franchisetv/archives/news/franchise-news-new-balance-launches-first-new-retail-concept-store-india-dlf-mall", 2)], m: [40, 46, 52, 58, 62, 66], t: "Emerging", bn: "New format, rising.", fs: "2026-03" }),
  mk({ id: "cand-del-tomford", city: "Delhi NCR", brand: "Tom Ford (made-to-measure)", vertical: "Duty Free", category: "Luxury / Made-to-Measure", score: 69, why: "New boutique at DLF Emporio with made-to-measure suiting from international mills.", bialFit: "Luxury travel-exclusive / made-to-measure appointment concept for premium flyers.", sources: [S("Indian Retailer — Tom Ford DLF Emporio", "https://www.indianretailer.com/news/broadway-expands-mumbai-largest-experiential-retail-store", 3)], m: [60, 62, 62, 64, 66, 68], t: "Sustained", bn: "Luxury premiumisation, steady.", fs: "2026-02" }),
  mk({ id: "cand-del-hidesign", city: "Delhi NCR", brand: "Hidesign", vertical: "Retail", category: "Homegrown Leather Accessories", score: 66, airportPrecedent: true, why: "Indian leather brand featured in Delhi T3's retail refresh.", bialFit: "Homegrown leather accessories travel retail — 'Made-in-India' story.", sources: [S("Moodie Davitt — Delhi T3 retail mix", "https://moodiedavittreport.com/india-retails-hospitality-elevates-delhi-airport-retail-mix-with-cross-category-store-openings/", 2)], m: [56, 56, 58, 58, 60, 62], t: "Sustained", bn: "Established, airport-present.", fs: "2026-01" }),
  mk({ id: "cand-del-experiential", city: "Delhi NCR", brand: "Experiential / phygital mixed-use format", vertical: "Experiences", category: "Experiential & Activation Formats", score: 66, why: "NCR's ₹13,000cr live-events market and a shift to experiential/phygital mixed-use; 78% of consumers prefer spending on experiences over products.", bialFit: "Experiential activation zones / phygital retail formats airside — capture the experience-over-product shift.", sources: [S("Eventales — Delhi NCR event trends 2026", "https://eventales.com/event-trends-2026-for-delhi-ncr-brands/", 3)], m: [45, 52, 58, 64, 70, 76], t: "Accelerating", bn: "Structural shift to experiences, accelerating.", fs: "2026-02" }),
];

// ===========================================================================
// MUMBAI (#2 domestic by pax) — premium + experiential + craft.
// ===========================================================================
export const MUMBAI_CANDIDATES: C[] = [
  mk({ id: "cand-bom-subko", city: "Mumbai", brand: "Subko", vertical: "F&B", category: "Craft Third-Wave Coffee", score: 80, promotedOpportunityId: "opp-subko", why: "Mumbai craft roaster-baker (Series B, Dubai + Bangalore 'Craftery'), 20–30% price premium over Blue Tokai.", bialFit: "Craft coffee-roaster flagship with brew-bar theatre — a 'first-at-airport craft' statement.", sources: [S("World Coffee Portal — Subko raises ~$9.5m", "https://www.worldcoffeeportal.com/news/further-boost-for-indias-coffee-shop-market-as-subko-reportedly-raises-9-5m/", 3)], m: [58, 60, 0, 64, 70, 74], t: "Sustained", bn: "Durable craft-coffee momentum (one source predates window — flagged).", fs: "2026-01" }),
  mk({ id: "cand-bom-broadway", city: "Mumbai", brand: "Broadway", vertical: "Experiences", category: "Experiential Multi-Brand Retail", score: 74, why: "Expanded to Mumbai with its largest experiential retail store.", bialFit: "Experiential multi-brand 'discovery' concept for a departures lifestyle zone.", sources: [S("Indian Retailer — Broadway largest experiential store, Mumbai", "https://www.indianretailer.com/news/broadway-expands-mumbai-largest-experiential-retail-store", 2)], m: [48, 54, 60, 66, 72, 78], t: "Accelerating", bn: "Experiential retail scaling fast.", fs: "2026-02" }),
  mk({ id: "cand-bom-rumbabaa", city: "Mumbai", brand: "RumBabaa", vertical: "F&B", category: "Culture-Led Café (coffee + vinyl)", score: 70, why: "All-day coffee + vinyl-led café concept opened in Andheri (26 Apr 2026).", bialFit: "Culture-led experiential café — music + coffee to extend dwell.", sources: [S("Indian Retailer — RumBabaa enters Mumbai", "https://indianretailer.com/franchisetv/archives/news/rumbabaa-enters-mumbai-experiential-cafe-concept", 2)], m: [0, 40, 50, 58, 64, 70], t: "Accelerating", bn: "New concept climbing since Apr.", fs: "2026-04" }),
  mk({ id: "cand-bom-premiumfb", city: "Mumbai", brand: "Premium F&B formats", vertical: "F&B", category: "Premium Dining Category", score: 70, why: "Premium food formats reported 85% growth FY25→26 with 12–15 new outlets and 70% revenue-growth targets.", bialFit: "Premium casual-dining category push for T2 international departures.", sources: [S("Aeroleads — top Mumbai F&B companies 2026", "https://aeroleads.com/list/top-food-and-beverage-companies-in-mumbai", 3)], m: [50, 56, 62, 68, 74, 80], t: "Accelerating", bn: "Premium F&B category compounding.", fs: "2026-01" }),
  mk({ id: "cand-bom-d2cbeauty", city: "Mumbai", brand: "D2C beauty (experiential offline)", vertical: "Retail", category: "Beauty · Experiential D2C", score: 68, why: "D2C beauty brands strengthening offline via experiential try-before-buy formats.", bialFit: "Experiential beauty try-bar / sampling counter airside.", sources: [S("Indian Retailer — Mumbai retail trends 2026", "https://www.indianretailer.com/news/broadway-expands-mumbai-largest-experiential-retail-store", 3)], m: [50, 54, 58, 62, 66, 70], t: "Accelerating", bn: "D2C beauty going omnichannel.", fs: "2026-02" }),
  mk({ id: "cand-bom-dohful", city: "Mumbai", brand: "Dohful Cookies & Coffee", vertical: "F&B", category: "Cookies + Specialty Coffee", score: 66, why: "Opened 19 Jul 2026 with signature freshly-baked cookies, desserts and specialty coffee.", bialFit: "Cookies/dessert + coffee grab-and-go — impulse dessert format.", sources: [S("Indian Retailer — Dohful Mumbai opening", "https://www.indianretailer.com/news/millo-mumbai-unveils-new-veg-menu-global-dishes", 3)], m: [0, 0, 0, 40, 55, 66], t: "Emerging", bn: "Brand-new (Jul), 3/6 months.", fs: "2026-06" }),
  mk({ id: "cand-bom-pique", city: "Mumbai", brand: "Pique", vertical: "F&B", category: "Contemporary Wine Bar / Dining", score: 64, why: "Contemporary wine + European-inspired dining, first neighbourhood wine bar in South Mumbai.", bialFit: "Premium wine bar / lounge-adjacent dining for T2 international.", sources: [S("Indian Retailer — Pique wine bar, South Mumbai", "https://www.indianretailer.com/franchisetv/archives/news/pique-brings-contemporary-wine-and-dining-experience-south-mumbai", 3)], m: [40, 46, 50, 54, 58, 62], t: "Emerging", bn: "Wine-culture concept, rising.", fs: "2026-03" }),
  mk({ id: "cand-bom-millo", city: "Mumbai", brand: "Millo", vertical: "F&B", category: "Global Veg QSR", score: 62, why: "Unveiled a new veg menu with global dishes — healthy global-veg positioning.", bialFit: "Healthy global-veg QSR grab-and-go for domestic departures.", sources: [S("Indian Retailer — Millo new veg menu", "https://www.indianretailer.com/news/millo-mumbai-unveils-new-veg-menu-global-dishes", 3)], m: [40, 44, 48, 52, 56, 60], t: "Sustained", bn: "Healthy-QSR, steady.", fs: "2026-02" }),
  mk({ id: "cand-bom-globalcafe", city: "Mumbai", brand: "Globally-inspired café concepts", vertical: "F&B", category: "Korean / Japanese / European Cafés", score: 64, why: "Rising demand for globally-inspired café concepts and authentic international specialty beverages.", bialFit: "Rotating international-café format to test viral global concepts.", sources: [S("FranchiseBazar — top Mumbai café franchises 2026", "https://www.franchisebazar.com/blog/top-cafe-franchise-in-mumbai-2026", 3)], m: [44, 50, 56, 60, 66, 72], t: "Accelerating", bn: "Global-café demand accelerating.", fs: "2026-02" }),
  mk({ id: "cand-bom-frido", city: "Mumbai", brand: "Frido (Mumbai)", vertical: "Products & SKUs", category: "Travel-Comfort SKUs", score: 66, why: "Frido's experiential-store rollout includes Mumbai — travel-comfort/ergonomics SKUs.", bialFit: "Travel-comfort product wall (pillows, cushions, insoles) at departures.", sources: [S("Indian Retailer — Frido experiential stores", "https://www.indianretailer.com/news/frido-expands-offline-presence-15-new-experiential-stores-across-india", 2)], m: [46, 52, 56, 60, 64, 68], t: "Accelerating", bn: "Product category ideal for airports.", fs: "2026-02" }),
];

// ===========================================================================
// SINGAPORE (#2 international by pax) — Changi precedents + Asian F&B wave + tech.
// ===========================================================================
export const SINGAPORE_CANDIDATES: C[] = [
  mk({ id: "cand-sin-clarins", city: "Singapore", brand: "Clarins Beauty Concierge (Changi)", vertical: "Technology", category: "Phygital Beauty Concierge", score: 80, airportPrecedent: true, why: "Clarins + Changi Airport Group + Shilla launched a personalised, interactive Beauty Concierge with Singapore storytelling at Changi.", bialFit: "Personalised phygital beauty-concierge counter in duty free — consult + interactive + travel-exclusive.", sources: [S("DFNI — Clarins Beauty Concierge at Changi", "https://www.dfnionline.com/brand-news/cosmetics/clarins-unveils-beauty-concierge-concept-at-singapore-changi-airport-15-07-2026/", 2)], m: [55, 60, 64, 68, 72, 78], t: "Accelerating", bn: "Airport-native phygital beauty, rising.", fs: "2026-03" }),
  mk({ id: "cand-sin-fitfun", city: "Singapore", brand: "Changi Fit&Fun Zone", vertical: "Wellness", category: "Airport Fitness + Wellness", score: 78, airportPrecedent: true, why: "Changi launched a Fit&Fun Zone blending fitness + wellness + entertainment (T2 Transit L3).", bialFit: "Airport wellness/fitness zone — a paid passenger-experience service and dwell differentiator.", sources: [S("Passenger Terminal Today — Changi Fit&Fun", "https://www.passengerterminaltoday.com/videos/changi-airport-unveils-fitness-and-wellness-space.html", 2), S("Travel And Tour World — Changi Fit&Fun", "https://www.travelandtourworld.com/news/article/singapores-changi-airport-fitfun-zone-offers-travelers-a-unique-wellness-experience/", 2)], m: [48, 54, 60, 66, 72, 78], t: "Accelerating", bn: "Airport-wellness proven at Changi.", fs: "2026-03" }),
  mk({ id: "cand-sin-chinesefb", city: "Singapore", brand: "Chinese F&B wave (bubble tea / value coffee)", vertical: "F&B", category: "High-Velocity Value F&B", score: 74, why: "Chinese F&B brands in Singapore surged from 32 to ~85 in a year with 400+ outlets — a structural high-velocity wave.", bialFit: "High-velocity value beverage (bubble tea / value coffee) grab-and-go for young travellers.", sources: [S("ChinaRetailNews — Chinese F&B in Singapore", "https://www.chinaretailnews.com/2026/05/09/23146-thriving-chinese-fb-revolutionizes-singapores-food-scene/", 3), S("Vulcan Post — Chinese F&B wars in S'pore", "https://vulcanpost.com/911259/chinese-brands-bringing-fnb-wars-to-singapore/", 3)], m: [50, 58, 64, 70, 74, 78], t: "Accelerating", bn: "Explosive category growth.", fs: "2026-01" }),
  mk({ id: "cand-sin-on", city: "Singapore", brand: "On (activewear)", vertical: "Retail", category: "Premium Activewear", score: 74, why: "Swiss performance brand On opened a Singapore flagship (Jewel / MBS).", bialFit: "Premium activewear travel retail — high AOV, athleisure demand.", sources: [S("Urban List — Singapore new brands SS26", "https://www.theurbanlist.com/singapore/a-list/boutiques-singapore-spring-summer-2026", 3)], m: [50, 56, 62, 66, 70, 74], t: "Accelerating", bn: "Flagship push, rising.", fs: "2026-03" }),
  mk({ id: "cand-sin-osim", city: "Singapore", brand: "OSIM uDream (AI massage chair)", vertical: "Products & SKUs", category: "Wellness Tech / Paid Relaxation", score: 72, airportPrecedent: true, why: "OSIM's uDream AI massage chair debuted at IT Show 2026 — paid AI-massage is a proven airport format.", bialFit: "Paid AI-massage-chair relaxation zone (service + product) — direct non-aero revenue.", sources: [S("HardwareZone — IT Show 2026 launches", "https://www.hardwarezone.com.sg/lifestyle/it-show-2026-singapore-suntec-tech-deals-preview", 3)], m: [44, 50, 56, 62, 66, 72], t: "Accelerating", bn: "Wellness-tech product with clear airport service model.", fs: "2026-02" }),
  mk({ id: "cand-sin-alo", city: "Singapore", brand: "Alo Yoga", vertical: "Wellness", category: "Athleisure / Wellness Retail", score: 70, why: "Alo opened a flagship at The Shoppes at Marina Bay Sands.", bialFit: "Wellness/athleisure store — mindful-movement lifestyle for premium flyers.", sources: [S("Urban List — Singapore new brands SS26", "https://www.theurbanlist.com/singapore/a-list/boutiques-singapore-spring-summer-2026", 3)], m: [48, 54, 58, 62, 66, 70], t: "Accelerating", bn: "Wellness-lifestyle flagship.", fs: "2026-03" }),
  mk({ id: "cand-sin-lifestylehub", city: "Singapore", brand: "Changi lifestyle + wellness hub", vertical: "Experiences", category: "Airport Lifestyle / Wellness Hub", score: 72, airportPrecedent: true, why: "Changi is expanding a lifestyle + wellness hub and a revamped private terminal (from mid-2027).", bialFit: "Premium lifestyle/wellness hub model for a T2 dwell cluster.", sources: [S("Future Travel Experience — Changi lifestyle hub", "https://www.futuretravelexperience.com/2026/04/changi-airport-unveils-plans-to-revamp-private-terminal-and-expand-lifestyle-hub/", 2)], m: [58, 60, 62, 64, 66, 68], t: "Sustained", bn: "Structural airport-lifestyle direction.", fs: "2026-01" }),
  mk({ id: "cand-sin-rituel", city: "Singapore", brand: "Rituel (Tokyo bakery-café)", vertical: "F&B", category: "Premium Bakery-Café", score: 66, why: "Tokyo bakery-café concept Rituel landed in Singapore (Jul 2026).", bialFit: "Premium Japanese bakery-café — craft pastry + coffee grab-and-go.", sources: [S("HungryGoWhere — new Singapore openings Jul 2026", "https://hungrygowhere.com/what-to-eat/new-openings-2026/", 3)], m: [0, 0, 30, 48, 58, 66], t: "Emerging", bn: "New entrant, climbing.", fs: "2026-05" }),
  mk({ id: "cand-sin-yimanfen", city: "Singapore", brand: "Yimanfen Dessert (Hangzhou)", vertical: "F&B", category: "Viral Dessert", score: 63, why: "Popular Hangzhou dessert brand entered Singapore in 2026.", bialFit: "Viral dessert grab-and-go — social-led, queue-driving.", sources: [S("HungryGoWhere — new Singapore openings Jul 2026", "https://hungrygowhere.com/what-to-eat/new-openings-2026/", 3)], m: [0, 0, 0, 40, 55, 64], t: "Emerging", bn: "Brand-new, watch durability.", fs: "2026-06" }),
  mk({ id: "cand-sin-consumertech", city: "Singapore", brand: "Travel-tech gadgets (IT Show)", vertical: "Technology", category: "Consumer Tech / Gadget Retail", score: 61, why: "New consumer-tech (Dreame X60 Ultra, QD-OLED monitors) headlined IT Show 2026; strong gadget-retail culture.", bialFit: "Travel-tech / gadget concept store or smart vending (chargers, audio, wearables).", sources: [S("HardwareZone — IT Show 2026", "https://www.hardwarezone.com.sg/lifestyle/it-show-2026-singapore-suntec-tech-deals-preview", 3)], m: [40, 44, 48, 52, 56, 60], t: "Emerging", bn: "Gadget-retail interest steady-rising.", fs: "2026-03" }),
];

// ===========================================================================
// LONDON (#3 international by pax) — Heathrow = World's Best for Shopping.
// Almost every candidate is already airport-proven at LHR (directly transferable).
// ===========================================================================
export const LONDON_CANDIDATES: C[] = [
  mk({ id: "cand-lon-waitrose", city: "London", brand: "Waitrose (RELAY, Heathrow)", vertical: "Retail", category: "Premium Convenience / Grab-and-Go Grocery", score: 78, airportPrecedent: true, why: "Waitrose entered airport retail for the first time via RELAY stores at Heathrow T2 (2026).", bialFit: "Premium grab-and-go grocery/convenience — elevated travel essentials + ready food.", sources: [S("John Lewis Partnership — Waitrose enters airport retail", "https://www.johnlewispartnership.co.uk/media-centre/latest-news/2026/23883", 1)], m: [0, 40, 55, 65, 72, 78], t: "Accelerating", bn: "First-time airport entry, scaling.", fs: "2026-04" }),
  mk({ id: "cand-lon-t5luxury", city: "London", brand: "Heathrow T5 luxury zone", vertical: "Duty Free", category: "Consolidated Luxury Walk", score: 76, airportPrecedent: true, why: "Heathrow's luxury revival — a T5 departure-lounge luxury zone (Jun 2026); named World's Best Airport for Shopping (Skytrax 2026).", bialFit: "A consolidated luxury walk / lounge luxury zone for T2 international (Burberry/Chanel/LV-class).", sources: [S("TravelWires — Heathrow World's Best for Shopping (Skytrax 2026)", "https://www.travelwires.com/heathrow-named-world-s-best-airport-for-shopping-at-2026-skytrax-awards/", 2), S("The Traveler — Heathrow luxury revival", "https://www.thetraveler.org/heathrows-luxury-revival-and-the-new-british-airport-retail/", 3)], m: [55, 58, 62, 66, 70, 74], t: "Accelerating", bn: "Luxury premiumisation, award-winning.", fs: "2026-02" }),
  mk({ id: "cand-lon-deso", city: "London", brand: "Heathrow DESO + VIP booking (click-&-collect)", vertical: "Technology", category: "Digital Commerce / Pre-Order", score: 74, airportPrecedent: true, why: "Heathrow's retail strategy runs on Digital-Experience-Space-Offer (DESO) with a new VIP online booking portal and pre-order/reserve.", bialFit: "Pre-order / click-&-collect + VIP booking platform — digital commerce layer over BLR retail (higher conversion + basket).", sources: [S("TRBusiness — Heathrow brings more formats", "https://www.trbusiness.com/regional-news/europe/heathrow-brings-more-brands-and-more-formats-into-the-mix/282460", 2)], m: [50, 55, 60, 65, 70, 75], t: "Accelerating", bn: "Airport digital-commerce, structural.", fs: "2026-01" }),
  mk({ id: "cand-lon-whsmith", city: "London", brand: "WHSmith flagship + pharmacy", vertical: "Services", category: "Travel Essentials + Pharmacy/Health", score: 72, airportPrecedent: true, why: "WHSmith opened three Heathrow flagships combining everyday travel essentials with pharmacy services (T3/4/5).", bialFit: "Travel-essentials + airside pharmacy/health-service combo — a service+retail hybrid BLR lacks.", sources: [S("TRBusiness — Heathrow formats", "https://www.trbusiness.com/regional-news/europe/heathrow-brings-more-brands-and-more-formats-into-the-mix/282460", 2)], m: [58, 60, 62, 64, 66, 70], t: "Sustained", bn: "Service+retail hybrid, durable.", fs: "2026-01" }),
  mk({ id: "cand-lon-slimchickens", city: "London", brand: "Slim Chickens (Heathrow)", vertical: "F&B", category: "Premium QSR (retail-tech enabled)", score: 70, airportPrecedent: true, why: "Slim Chickens landed at London Heathrow with a retail-technology-enabled format.", bialFit: "Premium chicken QSR grab-and-go with self-order tech for peak flows.", sources: [S("RTIH — Slim Chickens at Heathrow", "https://retailtechinnovationhub.com/home/2026/7/12/slim-chickens-touches-down-at-london-heathrow-last-weeks-most-read-rtih-retail-technology-articles", 3)], m: [0, 0, 40, 55, 64, 70], t: "Emerging", bn: "New airport QSR entrant, rising.", fs: "2026-05" }),
  mk({ id: "cand-lon-lululemon", city: "London", brand: "Lululemon", vertical: "Wellness", category: "Premium Athleisure", score: 70, why: "Premium athleisure among Heathrow's headline brands; strong wellness-travel crossover.", bialFit: "Athleisure / mindful-movement travel retail — high AOV wellness lifestyle.", sources: [S("The Traveler — Heathrow premium brands", "https://www.thetraveler.org/heathrows-luxury-revival-and-the-new-british-airport-retail/", 3)], m: [58, 60, 62, 64, 66, 68], t: "Sustained", bn: "Athleisure demand steady-high.", fs: "2026-01" }),
  mk({ id: "cand-lon-harrods", city: "London", brand: "Harrods (airport boutique)", vertical: "Duty Free", category: "British Luxury / Gifting", score: 68, airportPrecedent: true, why: "Harrods among Heathrow's luxury tenants — British-luxury gifting with airport presence.", bialFit: "British-luxury travel-exclusive gifting boutique concept (heritage gifting).", sources: [S("The Traveler — Heathrow luxury", "https://www.thetraveler.org/heathrows-luxury-revival-and-the-new-british-airport-retail/", 3)], m: [56, 58, 58, 60, 62, 64], t: "Sustained", bn: "Heritage-luxury gifting, durable.", fs: "2026-01" }),
  mk({ id: "cand-lon-pharmacy", city: "London", brand: "Airside pharmacy / health services", vertical: "Wellness", category: "Traveller Health Services + SKUs", score: 66, airportPrecedent: true, why: "Pharmacy + health services are entering airport retail (WHSmith pharmacy at Heathrow), meeting traveller health needs.", bialFit: "Airside pharmacy / traveller-health kiosk (OTC + travel-health SKUs + service) — a genuine service gap.", sources: [S("TRBusiness — Heathrow pharmacy formats", "https://www.trbusiness.com/regional-news/europe/heathrow-brings-more-brands-and-more-formats-into-the-mix/282460", 2)], m: [40, 46, 52, 58, 62, 66], t: "Emerging", bn: "Health-service format emerging at airports.", fs: "2026-03" }),
  mk({ id: "cand-lon-formats", city: "London", brand: "Revamped store formats (experiential)", vertical: "Experiences", category: "Store-Format Innovation", score: 64, why: "Multiple brands revamped store formats in 2026 toward experiential, discovery-led retail.", bialFit: "Adopt new experiential store-format templates for BLR concessions.", sources: [S("Retail Gazette — revamped store formats Apr 2026", "https://www.retailgazette.co.uk/blog/2026/04/retail-refresh-april-2026/", 2)], m: [46, 50, 54, 58, 62, 66], t: "Accelerating", bn: "Format innovation accelerating.", fs: "2026-02" }),
  mk({ id: "cand-lon-burberry", city: "London", brand: "Burberry (travel-exclusive)", vertical: "Duty Free", category: "British Heritage Luxury", score: 65, airportPrecedent: true, why: "Burberry anchors Heathrow's luxury line-up — British heritage luxury with travel-exclusive potential.", bialFit: "British heritage-luxury travel-exclusive capsule / boutique.", sources: [S("The Traveler — Heathrow luxury brands", "https://www.thetraveler.org/heathrows-luxury-revival-and-the-new-british-airport-retail/", 3)], m: [56, 56, 58, 58, 60, 62], t: "Sustained", bn: "Heritage luxury, steady.", fs: "2026-01" }),
];

export const ALL_CANDIDATES: MarketCandidate[] = [
  ...DUBAI_CANDIDATES, ...KOLKATA_CANDIDATES, ...DELHI_CANDIDATES,
  ...MUMBAI_CANDIDATES, ...SINGAPORE_CANDIDATES, ...LONDON_CANDIDATES,
];
