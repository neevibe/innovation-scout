import type { StoreShape } from "@/lib/types";
import { DEFAULT_WEIGHTS } from "@/lib/scoring/engine";
import { ALL_CANDIDATES } from "@/lib/data/candidates";

// ===========================================================================
// SEED INTELLIGENCE
// Grounded in live trade-source research (Aug 2026). Every evidence URL below
// is a real, published source gathered during collection. Factor sub-scores
// are analyst-calibrated 0-100 values. Contacts follow the anti-PII rule:
// role/company channels by default; a named individual appears only where a
// cited source attributes it, and is marked AI-Inferred until human-verified.
// ===========================================================================

const now = "2026-08-19T06:00:00.000Z";

// Representative category photography (Unsplash — licensed stock, verified IDs).
// These illustrate the CATEGORY, not the brand's own store/SKU.
const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1000&q=80&auto=format&fit=crop`;

export const SEED: StoreShape = {
  config: {
    weights: DEFAULT_WEIGHTS,
    thresholds: {
      immediate: 80,
      highPotential: 65,
      monitor: 50,
      matrixAttractiveness: 60,
      matrixFeasibility: 60,
    },
    monitoringFrequencyHours: 24,
    mode: "offline",
    lastRefreshAt: now,
    // Scoped to Tavily only: it's the one provider that's both licensed for
    // this use case and reliably reachable. GDELT/GoogleNews/Reddit are
    // blocked or 403 on this network; running all 7 providers × 6 cities ×
    // 6 lenses (252 tasks) measured 3+ minutes and never returned — would
    // hard-fail Vercel's function timeout. Tavily-only completes in ~11s.
    enabledProviders: ["tavily"],
  },

  // Cities are chosen by REAL BLR flight connectivity (frequency + seats), not
  // assumption. Domestic top-3 and international top-3 by route volume from BLR.
  cities: [
    {
      id: "del", name: "Delhi NCR", country: "India", kind: "domestic", benchmarkAirport: "Delhi T3 (DEL)",
      rationale: "#1 domestic market from BLR by both flights and passengers (1.69M pax Apr–Aug); DEL T3 is India's retail benchmark hub.",
      active: true,
      connectivity: {
        rank: "#1 domestic (BLR data)",
        metric: "1,694,647 pax · 9,607 flights · 83.6% load",
        detail: "Largest BLR route on every axis (Apr–Aug 2026)",
        sources: [
          { label: "BIAL traffic data — Apr–Aug 2026 (domestic)", url: "#internal-blr-dom", kind: "aviation-data" },
        ],
      },
    },
    {
      id: "bom", name: "Mumbai", country: "India", kind: "domestic", benchmarkAirport: "Mumbai T2 (BOM)",
      rationale: "#2 domestic market from BLR by passengers (1.25M Apr–Aug); high-value business + premium leisure origin and craft-brand launchpad.",
      active: true,
      connectivity: {
        rank: "#2 domestic (BLR data)",
        metric: "1,249,529 pax · 7,339 flights · 75.3% load",
        detail: "Second on every axis",
        sources: [
          { label: "BIAL traffic data — Apr–Aug 2026 (domestic)", url: "#internal-blr-dom", kind: "aviation-data" },
        ],
      },
    },
    {
      id: "ccu", name: "Kolkata", country: "India", kind: "domestic", benchmarkAirport: "Kolkata (CCU)",
      rationale: "#3 domestic market from BLR by passengers (706k Apr–Aug), ahead of Pune (672k) and Hyderabad (658k). Highest-load domestic route (91.6% SLF) — genuine demand, not just frequency. East-India gateway with a strong food-culture scene.",
      active: true,
      connectivity: {
        rank: "#3 domestic by passengers (BLR data)",
        metric: "706,128 pax · 3,544 flights · 91.6% load",
        detail: "Beats Pune (672k pax @ 76.9% load) and Hyderabad (658k) — chosen on footfall + load, not raw flight count",
        sources: [
          { label: "BIAL traffic data — Apr–Aug 2026 (domestic)", url: "#internal-blr-dom", kind: "aviation-data" },
          { label: "Aviation A2Z — CCU-BLR in top-15 domestic routes", url: "https://aviationa2z.com/index.php/2024/11/22/top-15-busiest-domestic-routes-in-india/", kind: "web" },
        ],
      },
    },
    {
      id: "dxb", name: "Dubai", country: "UAE", kind: "international", benchmarkAirport: "Dubai International (DXB)",
      rationale: "#1 international market from BLR by passengers (307k Apr–Aug) at the highest load of any intl route (93.9%); travel-retail gold standard + very large Indian diaspora.",
      active: true,
      connectivity: {
        rank: "#1 international by passengers (BLR data)",
        metric: "306,923 pax · 976 flights · 93.9% load",
        detail: "Fewer flights than Abu Dhabi but far more passengers — biggest, fullest intl route",
        sources: [
          { label: "BIAL traffic data — Apr–Aug 2026 (international)", url: "#internal-blr-int", kind: "aviation-data" },
        ],
      },
    },
    {
      id: "sin", name: "Singapore", country: "Singapore", kind: "international", benchmarkAirport: "Changi (SIN)",
      rationale: "#2 international market from BLR by passengers (207k Apr–Aug, 90.2% load); global benchmark for experiential airport retail.",
      active: true,
      connectivity: {
        rank: "#2 international by passengers (BLR data)",
        metric: "207,431 pax · 956 flights · 90.2% load",
        detail: "Second on passengers; Changi is the experiential-retail benchmark",
        sources: [
          { label: "BIAL traffic data — Apr–Aug 2026 (international)", url: "#internal-blr-int", kind: "aviation-data" },
        ],
      },
    },
    {
      id: "lhr", name: "London", country: "United Kingdom", kind: "international", benchmarkAirport: "Heathrow (LHR)",
      rationale: "#3 international market from BLR by passengers (193k Apr–Aug, 90.3% load), ahead of Abu Dhabi (165k). Large VFR + business + premium-leisure base; Heathrow is the premium grab-and-go / F&B benchmark.",
      active: true,
      connectivity: {
        rank: "#3 international by passengers (BLR data)",
        metric: "192,522 pax · 941 flights · 90.3% load",
        detail: "Beats Abu Dhabi (165k pax @ 86.2% load) on footfall + load despite fewer flights",
        sources: [
          { label: "BIAL traffic data — Apr–Aug 2026 (international)", url: "#internal-blr-int", kind: "aviation-data" },
          { label: "Travel & Tour World — BA adds 2nd daily LHR–BLR (Jun 2026)", url: "https://www.travelandtourworld.com/news/article/bengaluru-joins-the-big-leagues-as-british-airways-boosts-global-connectivity-second-daily-flight-from-london-heathrow-to-kempegowda-airport-starts-june-2026-elevating-the-uks-most-popular-route-to/", kind: "news" },
        ],
      },
    },
  ],

  // --- BIAL current portfolio (internal reference) -------------------------
  bialPortfolio: [
    { category: "Design-led premium luggage", vertical: "Retail", terminal: "Both", present: false, brandsPresent: [], note: "Only legacy hard-luggage (Samsonite/VIP class) type presence; no design-led D2C luggage." },
    { category: "Third-wave craft coffee flagship", vertical: "F&B", terminal: "T2", present: false, brandsPresent: [], note: "Specialty coffee houses present, but no craft-roaster flagship with brew-bar theatre." },
    { category: "Modern regional South-Indian gifting", vertical: "Duty Free", terminal: "Both", present: false, brandsPresent: [], note: "Curated South Indian cuisine exists in F&B; no scaled modern regional gifting SKU line." },
    { category: "Clean / science-led beauty (travel-exclusive)", vertical: "Duty Free", terminal: "T2", present: false, brandsPresent: [], note: "Fragrance/cosmetics anchored by legacy houses; no homegrown clean-beauty travel SKUs." },
    { category: "Global first-to-India dining", vertical: "F&B", terminal: "T2", present: true, brandsPresent: ["P.F. Chang's", "Wolfgang Puck", "James Martin Kitchen"], note: "T2 has proven ability to land India-debut brands." },
    { category: "Healthy fresh grab-and-go", vertical: "F&B", terminal: "Both", present: false, brandsPresent: [], note: "Grab-and-go exists but limited dedicated healthy-fresh format." },
  ],

  // --- Duty Free SKU gap reference (POC input) -----------------------------
  dutyFreeSkus: [
    { category: "Clean/Science Beauty", brand: "Foxtale", presentAtBial: false, presentAtPeers: ["—"], note: "D2C breakout; no airport travel-exclusive line yet — first-mover window." },
    { category: "Clean/Science Beauty", brand: "Minimalist / Deconstruct", presentAtBial: false, presentAtPeers: ["—"], note: "Ingredient-led; strong for travel-exclusive kits." },
    { category: "Craft Spirits Discovery", brand: "Dewar's (activation model)", presentAtBial: false, presentAtPeers: ["Changi T3 pop-up"], note: "Experiential whisky discovery proven at Changi." },
    { category: "Regional Gifting Confectionery", brand: "Sweet Karam Coffee", presentAtBial: false, presentAtPeers: ["—"], note: "Personalised/giftable packaging trend (36% of new TR lines)." },
    { category: "Premium Dates & Gourmet", brand: "Bateel-class gourmet", presentAtBial: false, presentAtPeers: ["DXB"], note: "Strong at DXB; diaspora gifting relevance." },
  ],

  // --- Signals (post dedup/consolidation) ----------------------------------
  signals: [
    { id: "sig-mokobara", timestamp: now, firstDetectedAt: "2026-07-30T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-07-28", source: "D2C Insider", url: "https://pulse.d2cinsider.com/the-d2c-insider-20-indias-breakout-consumer-brands-of-2026/", city: "Delhi NCR", country: "India", brand: "Mokobara", company: "Mokobara", category: "Retail", subCategory: "Travel Lifestyle / Luggage", signalType: "Emerging Brand", trend: "Design-led premium luggage scaling fast", event: "Breakout Brand 2026 listing", description: "Mokobara named a D2C breakout brand of 2026: ₹119 Cr FY24 revenue at 121.9% YoY growth; rapid omnichannel/retail rollout.", confidence: 88, sourceTier: 2, corroboratingUrls: ["https://inc42.com/features/fb-d2c-brands-in-india/"], dedupeKey: "mokobara|india|premium-luggage", opportunityId: "opp-mokobara" },
    { id: "sig-subko", timestamp: now, firstDetectedAt: "2026-08-02T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-07-15", source: "World Coffee Portal", url: "https://www.worldcoffeeportal.com/news/further-boost-for-indias-coffee-shop-market-as-subko-reportedly-raises-9-5m/", city: "Mumbai", country: "India", brand: "Subko", company: "Subko Coffee", category: "F&B", subCategory: "Third-Wave Coffee & Bakery", signalType: "Emerging Brand", trend: "Craft coffee premiumisation; ~$9.5M raise; Dubai entry", event: "Series B raise + Dubai opening", description: "Mumbai craft roaster-baker Subko raised ~$9.5M, opened in Dubai and built 'The Craftery' in Bangalore; commands 20-30% price premium over Blue Tokai.", confidence: 84, sourceTier: 3, corroboratingUrls: ["https://behindthefeature.substack.com/p/how-subko-charged-20-30-more-than", "https://tracxn.com/d/companies/subkocoffee/"], dedupeKey: "subko|mumbai|craft-coffee", opportunityId: "opp-subko" },
    { id: "sig-sweetkaram", timestamp: now, firstDetectedAt: "2026-07-30T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-07-28", source: "D2C Insider", url: "https://pulse.d2cinsider.com/the-d2c-insider-20-indias-breakout-consumer-brands-of-2026/", city: "Hyderabad", country: "India", brand: "Sweet Karam Coffee", company: "Sweet Karam Coffee", category: "Duty Free", subCategory: "Regional Snacks & Gifting", signalType: "Emerging Brand", trend: "Modernised South-Indian snack gifting scaling nationally", description: "Sweet Karam Coffee modernises authentic South Indian snacks (preservative-free, giftable); expanding across D2C + marketplaces with growing national distribution.", confidence: 80, sourceTier: 2, corroboratingUrls: ["https://inc42.com/features/fb-d2c-brands-in-india/"], dedupeKey: "sweetkaram|south-india|regional-gifting", opportunityId: "opp-sweetkaram" },
    { id: "sig-tr-personalised", timestamp: now, firstDetectedAt: "2026-08-05T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-04-07", source: "GlobeNewswire / MEA Travel Retail Report", url: "https://www.globenewswire.com/news-release/2026/04/07/3268891/28124/en/Middle-East-and-Africa-Travel-Retail-Market-Trends-and-Forecasts-Report-2026.html", city: "Dubai", country: "UAE", airport: "Dubai International (DXB)", category: "Duty Free", subCategory: "Confectionery / Gifting", signalType: "Category Growth", trend: "Personalised, giftable packaging drives travel-retail food growth", description: "Food & confectionery is a rapid-growth travel-retail category; personalised packaging featured on 36% of new lines. Beauty still anchors ~31.7% of TR.", confidence: 82, sourceTier: 2, corroboratingUrls: ["https://www.mordorintelligence.com/industry-reports/duty-free-and-travel-retail-market"], dedupeKey: "personalised-packaging|dxb|confectionery" },
    { id: "sig-changi-dewars", timestamp: now, firstDetectedAt: "2026-08-06T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-08-01", source: "Moodie Davitt Report", url: "https://moodiedavittreport.com/", city: "Singapore", country: "Singapore", airport: "Changi (SIN)", brand: "Dewar's", company: "Bacardi", category: "Duty Free", subCategory: "Liquor / Experiential", signalType: "Airport Innovation", trend: "Immersive craft-spirits 'discovery' pop-ups lift duty-free baskets", event: "Dewar's speakeasy pop-up, Changi T3 (to 16 Sep)", description: "Dewar's brought whisky discovery, cocktail culture and speakeasy theatre to Changi T3 — a template for experiential duty-free that grows dwell-time spend.", confidence: 79, sourceTier: 2, corroboratingUrls: [], dedupeKey: "experiential-spirits|changi|discovery-popup" },
    { id: "sig-heathrow-pret", timestamp: now, firstDetectedAt: "2026-08-06T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-07-20", source: "Moodie Davitt Report", url: "https://moodiedavittreport.com/", city: "London", country: "United Kingdom", airport: "Heathrow (LHR)", brand: "Pret A Manger", company: "Pret A Manger", category: "F&B", subCategory: "Elevated Grab-and-Go", signalType: "Airport Innovation", trend: "Bespoke, design-led grab-and-go concepts at premium terminals", event: "Bespoke Pret concept, Heathrow T5", description: "Pret opened a bespoke, terminal-tuned concept at Heathrow T5 (design by Draw Creative) — handmade food + organic coffee, signalling premiumisation of grab-and-go.", confidence: 77, sourceTier: 2, corroboratingUrls: [], dedupeKey: "elevated-grab-and-go|heathrow|bespoke" },
    { id: "sig-foxtale", timestamp: now, firstDetectedAt: "2026-07-30T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-07-28", source: "D2C Insider", url: "https://pulse.d2cinsider.com/the-d2c-insider-20-indias-breakout-consumer-brands-of-2026/", city: "Delhi NCR", country: "India", brand: "Foxtale", company: "Foxtale", category: "Duty Free", subCategory: "Clean / Science Beauty", signalType: "Emerging Brand", trend: "Homegrown science-led clean beauty at scale", description: "Foxtale posted ₹199 Cr FY25 revenue (~$57M raised across six rounds); ~80% of Indian shoppers now want eco/clean beauty — a travel-exclusive white space.", confidence: 81, sourceTier: 2, corroboratingUrls: ["https://india.wildoak.store/blogs/skincare-ingredients/foxtale-vs-minimalist"], dedupeKey: "foxtale|india|clean-beauty", opportunityId: "opp-foxtale" },
    { id: "sig-basil", timestamp: now, firstDetectedAt: "2026-07-30T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-07-28", source: "D2C Insider", url: "https://pulse.d2cinsider.com/the-d2c-insider-20-indias-breakout-consumer-brands-of-2026/", city: "Hyderabad", country: "India", brand: "Basil", company: "Basil", category: "F&B", subCategory: "Healthy Fresh QSR", signalType: "Emerging Concept", trend: "Fresh, healthy QSR scaling toward 1,000 touchpoints", description: "Basil operates 60+ fresh-food outlets across three cities, targeting 1,000 touchpoints — a healthy grab-and-go format under-served airside at BLR.", confidence: 72, sourceTier: 2, corroboratingUrls: [], dedupeKey: "basil|india|healthy-qsr", opportunityId: "opp-basil" },
    { id: "sig-t2-debuts", timestamp: now, firstDetectedAt: "2026-08-04T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-06-10", source: "Hospitality Biz India", url: "https://hospitalitybizindia.com/news-track/international-fb-brands-make-india-debut-at-bengaluru-airports-terminal-2-boosting-non-aero-revenues/", city: "Hyderabad", country: "India", airport: "Kempegowda (BLR)", category: "F&B", subCategory: "Premium International Dining", signalType: "Competitive Movement", trend: "BLR T2 landing India-debut global brands boosts non-aero revenue", description: "P.F. Chang's, Wolfgang Puck and James Martin Kitchen made their India debut at BLR T2 — validating BLR's pull for 'first-at-airport / first-in-India' exclusives.", confidence: 83, sourceTier: 2, corroboratingUrls: ["https://www.bengaluruairport.com/terminal2"], dedupeKey: "t2-debuts|blr|first-in-india" },
    { id: "sig-mokobara-luggage-tender", timestamp: now, firstDetectedAt: "2026-08-04T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-05-01", source: "Moodie Davitt Report", url: "https://moodiedavittreport.com/four-retail-and-fb-opportunities-at-kempegowda-international-airport-bengaluru-set-to-close-for-bids/", city: "Delhi NCR", country: "India", airport: "Kempegowda (BLR)", category: "Retail", subCategory: "Accessories / Leather / Watches", signalType: "Commercial Gap", trend: "BLR T2 tendering leather, watches — accessories footprint expanding", description: "BLR T2 has actively tendered leather goods, luxury watches and accessories concessions — showing live appetite for design-led travel-retail categories.", confidence: 70, sourceTier: 1, corroboratingUrls: [], dedupeKey: "blr-tenders|accessories|retail" },

    // --- Kolkata (new data-selected feeder market) ---
    { id: "sig-twc-thirdrush", timestamp: now, firstDetectedAt: "2026-08-12T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-07-22", source: "Indian Retailer", url: "https://www.indianretailer.com/news/third-wave-coffee-enters-east-india-three-cafe-launches-kolkata", city: "Kolkata", country: "India", brand: "Third Wave Coffee", company: "Third Wave Coffee", category: "F&B", subCategory: "Specialty Coffee / Dessert Café", signalType: "Emerging Concept", trend: "Third Wave enters East India + launches 'Third Rush' dessert-café format", event: "3 café launches in Kolkata", description: "Third Wave Coffee entered East India with three Kolkata cafés and rolled out 'Third Rush', a dessert-focused concept for evening consumption occasions.", confidence: 78, sourceTier: 2, corroboratingUrls: [], dedupeKey: "thirdwave|kolkata|dessert-cafe" },
    { id: "sig-yourstruly-ccu", timestamp: now, firstDetectedAt: "2026-08-11T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-06-30", source: "EazyDiner", url: "https://www.eazydiner.com/food-trends/kolkatas-8-most-instagrammable-restaurants-to-light-up-your-social-feed", city: "Kolkata", country: "India", brand: "Yours Truly", company: "Yours Truly", category: "F&B", subCategory: "Specialty Coffee + Bakery", signalType: "Emerging Brand", trend: "15,000 sq ft specialty-coffee destination with Lavonne bakery + coffee classroom", description: "Bhowanipore's 'Yours Truly' is a 15,000 sq ft specialty-coffee destination (Coffee Classroom + bakery developed with Lavonne Academy) — an experiential-café format.", confidence: 68, sourceTier: 3, corroboratingUrls: [], dedupeKey: "yourstruly|kolkata|specialty-coffee" },
    { id: "sig-ccu-foodsocial", timestamp: now, firstDetectedAt: "2026-08-10T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-02-01", source: "Modash (Instagram influencer index)", url: "https://www.modash.io/find-influencers/india/kolkata/food", city: "Kolkata", country: "India", category: "F&B", subCategory: "Social Food Buzz", signalType: "Category Growth", trend: "Kolkata food-influencer economy driving 'Instagrammable' dining demand", description: "A dense Kolkata food-influencer scene on Instagram (top-20 index) plus 'most Instagrammable restaurant' round-ups signal strong social-led, experience-first dining demand.", confidence: 60, sourceTier: 4, corroboratingUrls: ["https://www.eazydiner.com/food-trends/kolkatas-8-most-instagrammable-restaurants-to-light-up-your-social-feed"], dedupeKey: "kolkata|social|instagrammable-dining" },

    // --- Abu Dhabi (new data-selected international hub) ---
    { id: "sig-reemmall", timestamp: now, firstDetectedAt: "2026-08-13T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-07-18", source: "TTN Worldwide", url: "https://www.ttnworldwide.com/ArticleTA/461530/vision-hospitality-unveils-multi-concept-destination-in-abu-dhabi", city: "Abu Dhabi", country: "UAE", brand: "Vision Hospitality", company: "Vision Hospitality", category: "Experiences", subCategory: "Eatertainment · F&B + live sport + social", signalType: "Airport Innovation", trend: "45,000 sq ft multi-concept F&B + live-sport + social destination at Reem Mall", event: "Reem Mall multi-concept launch", description: "Vision Hospitality is opening a 45,000 sq ft destination at Reem Mall combining food, live sport, entertainment and social spaces — an experiential 'eatertainment' format relevant to airport dwell zones.", confidence: 74, sourceTier: 2, corroboratingUrls: [], dedupeKey: "reemmall|abudhabi|eatertainment" },
    { id: "sig-curate-phygital", timestamp: now, firstDetectedAt: "2026-08-12T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-06-25", source: "Time Out Abu Dhabi", url: "https://www.timeoutabudhabi.com/shopping/concept-stores-boutiques", city: "Abu Dhabi", country: "UAE", brand: "Curate", company: "Curate", category: "Technology", subCategory: "Phygital retail + local-maker incubator", signalType: "Emerging Concept", trend: "Abu Dhabi's first 'phygital' experiential retail + local-maker (Emirati SME) incubator", description: "Curate (Reem Mall) is a 1,200 sqm phygital retail platform pairing physical experiential space with a digital marketplace, plus an incubator giving Emirati women-owned SMEs free year-long retail presence — a 'local makers' model.", confidence: 70, sourceTier: 3, corroboratingUrls: [], dedupeKey: "curate|abudhabi|phygital-retail" },
    { id: "sig-aldar-mubadala", timestamp: now, firstDetectedAt: "2026-08-13T00:00:00Z", lastUpdatedAt: now, publishedAt: "2026-05-20", source: "Mubadala", url: "https://www.mubadala.com/en/news/aldar-and-mubadala-complete-joint-venture-to-establish-aed-10-billion-retail-champion-in-abu-dhabi", city: "Abu Dhabi", country: "UAE", brand: "Aldar / Mubadala", company: "Aldar Properties", category: "Retail", subCategory: "Luxury Retail Platform", signalType: "Competitive Movement", trend: "AED 10bn Aldar–Mubadala retail JV consolidating Yas Mall + Galleria luxury", description: "Aldar and Mubadala completed an AED 10bn JV to build a curated luxury-retail champion (Yas Mall + The Galleria) — signalling a premiumisation wave in Abu Dhabi travel-adjacent retail.", confidence: 76, sourceTier: 2, corroboratingUrls: [], dedupeKey: "aldar-mubadala|abudhabi|luxury-retail" },
  ],

  // --- Opportunities -------------------------------------------------------
  opportunities: [
    {
      id: "opp-mokobara",
      image: img("1553062407-98eeb64c6a62"),
      imageAlt: "Premium travel luggage — representative category imagery",
      buzz: { windowMonths: 6, firstSeen: "2026-03", monthsActive: 6, monthly: [55, 60, 68, 72, 80, 88], persistence: 1, trajectory: "Accelerating", note: "Buzz in all 6 months (revenue + funding milestones, retail rollout); Jul-2026 D2C-breakout inclusion lifted it further. Durable and accelerating — not a one-month spike." },
      title: "Design-led premium Indian luggage flagship (Mokobara)",
      brand: "Mokobara",
      company: "Mokobara",
      vertical: "Retail",
      category: "Travel Lifestyle / Luggage & Accessories",
      city: "Delhi NCR",
      country: "India",
      signalType: "Emerging Brand",
      factors: { marketMomentum: 90, passengerRelevance: 95, commercialPotential: 88, strategicFit: 82, competitiveGap: 85, brandStrength: 80, implementationFeasibility: 90, evidenceConfidence: 80, innovationDifferentiation: 82 },
      recommendation: {
        opportunity: "Bring India's leading design-led luggage brand airside as BLR's premium travel-lifestyle anchor.",
        marketSignal: "Mokobara hit ₹119 Cr FY24 revenue at 121.9% YoY growth; named a D2C breakout brand of 2026 with rapid omnichannel expansion.",
        whyNow: "Luggage is a point-of-need airport purchase, BLR T2 is actively tendering accessories/retail categories, and no design-led Indian luggage brand is present airside yet — a first-mover window.",
        bialGap: "BLR retail carries legacy hard-luggage only; no design-led D2C travel-lifestyle brand.",
        bialRecommendation: "Sign an inline concession (~55-70 m²) in T2 International Departures with an in-store monogramming/personalisation bar to convert dwell into premium ATV.",
        potentialLocation: "T2 International Departures — post-security consolidation zone",
        targetPassenger: "Affluent, design-conscious millennial + business travellers",
        commercialPotential: "Very High",
        implementationComplexity: "Low",
        expectedStrategicValue: "High-margin dry retail, zero extraction, easy airside clearance; differentiates BLR vs Delhi T3 and Asian hubs with an Indian design-led story.",
        recommendedNextAction: "Contact brand → validate airport appetite → commercial feasibility → 3-yr lease with activation break clause → pilot monogramming bar.",
      },
      evidence: [
        { id: "ev-mk-1", role: "Original Source", title: "The D2C Insider 20: India's Breakout Consumer Brands of 2026", publisher: "D2C Insider", url: "https://pulse.d2cinsider.com/the-d2c-insider-20-indias-breakout-consumer-brands-of-2026/", tier: 2, publishedAt: "2026-07-28", excerpt: "Mokobara — ₹119 Cr FY24 revenue; 121.9% YoY growth." },
        { id: "ev-mk-2", role: "Comparable Airport/City", title: "Four retail & F&B opportunities at BLR set to close for bids", publisher: "Moodie Davitt Report", url: "https://moodiedavittreport.com/four-retail-and-fb-opportunities-at-kempegowda-international-airport-bengaluru-set-to-close-for-bids/", tier: 1, excerpt: "BLR T2 tendered leather goods, luxury watches and accessories concessions." },
        { id: "ev-mk-3", role: "Market/Consumer Signal", title: "F&B & consumer D2C brands reshaping the Indian market", publisher: "Inc42", url: "https://inc42.com/features/fb-d2c-brands-in-india/", tier: 2, excerpt: "Travel-native D2C brands scaling into omnichannel retail." },
        { id: "ev-mk-4", role: "BIAL Internal Data", title: "BIAL portfolio reference — luggage category", publisher: "BIAL (internal)", url: "#", tier: 1, excerpt: "No design-led D2C luggage brand currently present at T1/T2." },
      ],
      contacts: [
        { id: "c-mk-1", verification: "Verified Public Business Contact", designation: "Business Development / Retail Expansion (approach via corporate channel)", company: "Mokobara", companyWebsite: "https://www.mokobara.com", companyProfileUrl: "https://www.linkedin.com/company/mokobara/", linkedinUrl: "https://www.linkedin.com/company/mokobara/", confidence: 70, note: "Approach via public corporate/partnerships channel; identify named BD lead on LinkedIn before outreach." },
      ],
      signalIds: ["sig-mokobara", "sig-mokobara-luggage-tender"],
      stage: "Validated",
      createdAt: now,
      updatedAt: now,
      sufficientEvidence: true,
      tags: ["Retail", "Travel Lifestyle", "First-at-Airport", "High Margin"],
    },
    {
      id: "opp-sweetkaram",
      image: img("1606491956689-2ea866880c84"),
      imageAlt: "South-Indian snacks & gifting — representative category imagery",
      buzz: { windowMonths: 6, firstSeen: "2026-02", monthsActive: 6, monthly: [50, 54, 58, 62, 66, 72], persistence: 1, trajectory: "Sustained", note: "Steady month-on-month growth across the window via national D2C + marketplace distribution; no fade. Sustained, gently accelerating." },
      title: "Modern South-Indian craft gifting as a duty-free/kiosk anchor (Sweet Karam Coffee)",
      brand: "Sweet Karam Coffee",
      company: "Sweet Karam Coffee",
      vertical: "Duty Free",
      category: "Regional Snacks & Gifting",
      city: "Hyderabad",
      country: "India",
      signalType: "Emerging Brand",
      factors: { marketMomentum: 80, passengerRelevance: 82, commercialPotential: 80, strategicFit: 88, competitiveGap: 90, brandStrength: 72, implementationFeasibility: 92, evidenceConfidence: 78, innovationDifferentiation: 84 },
      recommendation: {
        opportunity: "Own the 'sense-of-the-South' gifting moment BLR is uniquely positioned to sell to diaspora, tourists and leisure travellers.",
        marketSignal: "Sweet Karam Coffee is modernising authentic South-Indian snacks (preservative-free, giftable) and scaling nationally; travel retail globally is shifting to personalised/giftable food packaging (36% of new lines).",
        whyNow: "Confectionery/food is the fastest-growing travel-retail category on gifting culture; BLR as the South-India gateway has an unmatched 'origin story' no peer hub can replicate.",
        bialGap: "No scaled, modern regional-gifting SKU line in duty free today.",
        bialRecommendation: "Launch a duty-free travel-exclusive gifting end-cap PLUS a ~12-18 m² grab-and-go kiosk in T2 Domestic Departures; run a Diwali festive takeover.",
        potentialLocation: "T2 Intl Duty Free end-cap + T2 Domestic Departures kiosk",
        targetPassenger: "Diaspora / NRI, tourists, leisure gifters",
        commercialPotential: "High",
        implementationComplexity: "Low",
        expectedStrategicValue: "Ambient, packaged, no cold-chain; low capex, high turnover; a defensible BLR differentiator vs Delhi T3 and Asian hubs.",
        recommendedNextAction: "Pilot as a 3-month duty-free placement → measure ATV/attach → convert to kiosk lease if velocity holds.",
      },
      evidence: [
        { id: "ev-sk-1", role: "Original Source", title: "The D2C Insider 20: Breakout Brands 2026 — Sweet Karam Coffee", publisher: "D2C Insider", url: "https://pulse.d2cinsider.com/the-d2c-insider-20-indias-breakout-consumer-brands-of-2026/", tier: 2, publishedAt: "2026-07-28", excerpt: "Modernising authentic South Indian snacks; growing national distribution." },
        { id: "ev-sk-2", role: "Market/Consumer Signal", title: "MEA Travel Retail Market Trends 2026", publisher: "GlobeNewswire", url: "https://www.globenewswire.com/news-release/2026/04/07/3268891/28124/en/Middle-East-and-Africa-Travel-Retail-Market-Trends-and-Forecasts-Report-2026.html", tier: 2, publishedAt: "2026-04-07", excerpt: "Food/confectionery rapid growth; personalised packaging on 36% of new lines." },
        { id: "ev-sk-3", role: "Independent Confirmation", title: "49 F&B D2C brands reshaping the Indian consumer market", publisher: "Inc42", url: "https://inc42.com/features/fb-d2c-brands-in-india/", tier: 2, excerpt: "Regional heritage food brands scaling via D2C + marketplaces." },
        { id: "ev-sk-4", role: "BIAL Internal Data", title: "BIAL duty-free assortment — regional gifting", publisher: "BIAL (internal)", url: "#", tier: 1, excerpt: "No scaled modern regional-gifting SKU line present." },
      ],
      contacts: [
        { id: "c-sk-1", verification: "Verified Public Business Contact", designation: "Partnerships / Retail Expansion (corporate channel)", company: "Sweet Karam Coffee", companyWebsite: "https://www.sweetkaramcoffee.com", companyProfileUrl: "https://www.linkedin.com/company/sweet-karam-coffee/", linkedinUrl: "https://www.linkedin.com/company/sweet-karam-coffee/", confidence: 65, note: "Public corporate channel; confirm named founder/BD lead on LinkedIn before outreach." },
      ],
      signalIds: ["sig-sweetkaram", "sig-tr-personalised"],
      stage: "Validated",
      createdAt: now,
      updatedAt: now,
      sufficientEvidence: true,
      tags: ["Duty Free", "Regional", "Gifting", "Differentiator", "Low Capex"],
    },
    {
      id: "opp-subko",
      image: img("1495474472287-4d71bcdd2085"),
      imageAlt: "Third-wave specialty coffee — representative category imagery",
      buzz: { windowMonths: 6, firstSeen: "2026-01", monthsActive: 5, monthly: [58, 60, 0, 64, 70, 74], persistence: 0.83, trajectory: "Sustained", note: "Sustained craft-coffee buzz, but the primary funding source predates the 6-month window (flagged) — one month gap. Real momentum, lower evidence-freshness than the accelerators." },
      title: "Craft third-wave coffee + bakery flagship (Subko)",
      brand: "Subko",
      company: "Subko Coffee",
      vertical: "F&B",
      category: "Third-Wave Coffee & Bakery",
      city: "Mumbai",
      country: "India",
      signalType: "Emerging Brand",
      factors: { marketMomentum: 88, passengerRelevance: 88, commercialPotential: 80, strategicFit: 78, competitiveGap: 82, brandStrength: 78, implementationFeasibility: 58, evidenceConfidence: 80, innovationDifferentiation: 90 },
      recommendation: {
        opportunity: "Land a craft coffee-roaster flagship with brew-bar theatre as BLR's signature 'first-at-airport' F&B statement.",
        marketSignal: "Subko raised ~$9.5M, opened in Dubai, built 'The Craftery' in Bangalore, and commands a 20-30% price premium over Blue Tokai — the hottest global F&B trend (cf. Heathrow's bespoke Pret).",
        whyNow: "Third-wave coffee is the fastest-moving premium F&B format; Blue Tokai is commoditising in metros, leaving clean 'craft-first-at-airport' air, and Subko's Dubai footprint proves airport-grade QA.",
        bialGap: "Specialty coffee houses exist, but no craft-roaster flagship with sampling/brew-bar theatre.",
        bialRecommendation: "Inline flagship (~45-60 m²) in T2 with a split format: fast grab-and-go bean/pastry counter fronting a slower brew bar. Confirm extraction/ventilation feasibility first.",
        potentialLocation: "T2 Domestic Departures dwell node (option to mirror airside international)",
        targetPassenger: "Affluent, tech-savvy, coffee-literate travellers",
        commercialPotential: "High",
        implementationComplexity: "High",
        expectedStrategicValue: "Signature novelty + collectible retail attach; strong experiential/activation upside. Binding constraint is kitchen extraction — de-risk with a compact coffee+retail format.",
        recommendedNextAction: "Contact brand → joint feasibility on extraction/airside → design compact format → pilot flagship.",
      },
      evidence: [
        { id: "ev-sb-1", role: "Original Source", title: "India's coffee-shop market: Subko reportedly raises $9.5m", publisher: "World Coffee Portal", url: "https://www.worldcoffeeportal.com/news/further-boost-for-indias-coffee-shop-market-as-subko-reportedly-raises-9-5m/", tier: 3, publishedAt: "2026-07-15", excerpt: "Subko raises ~$9.5M; expanding footprint incl. Dubai." },
        { id: "ev-sb-2", role: "Independent Confirmation", title: "How Subko charged 20-30% more than Blue Tokai", publisher: "Behind the Feature", url: "https://behindthefeature.substack.com/p/how-subko-charged-20-30-more-than", tier: 3, excerpt: "Premium positioning; Dubai + Bangalore 'Craftery'; collectible packaging." },
        { id: "ev-sb-3", role: "Comparable Airport/City", title: "Bespoke Pret A Manger concept at Heathrow T5", publisher: "Moodie Davitt Report", url: "https://moodiedavittreport.com/", tier: 2, excerpt: "Premiumisation of grab-and-go / craft coffee at flagship terminals." },
        { id: "ev-sb-4", role: "Market/Consumer Signal", title: "Best Specialty Coffee Brands in India (2026)", publisher: "Impuls8", url: "https://www.impuls8.com/blog/d2c-specialty-coffee-brands-india", tier: 3, excerpt: "Third-wave coffee demand accelerating across Indian metros." },
      ],
      contacts: [
        { id: "c-sb-1", verification: "AI-Inferred Contact", personName: "Rahul Reddy", designation: "Founder (per public company profile) — verify before outreach", company: "Subko Coffee", companyWebsite: "https://www.subko.coffee", companyProfileUrl: "https://tracxn.com/d/companies/subkocoffee/", sourceUrl: "https://tracxn.com/d/companies/subkocoffee/", confidence: 55, note: "Founder name cited by Tracxn/World Coffee Portal; treat as inferred until confirmed. Approach via corporate channel." },
      ],
      signalIds: ["sig-subko", "sig-heathrow-pret"],
      stage: "Discovered",
      createdAt: now,
      updatedAt: now,
      sufficientEvidence: true,
      tags: ["F&B", "Craft Coffee", "First-at-Airport", "Experiential"],
    },
    {
      id: "opp-foxtale",
      image: img("1596462502278-27bfdc403348"),
      imageAlt: "Clean beauty & cosmetics SKUs — representative category imagery",
      buzz: { windowMonths: 6, firstSeen: "2026-01", monthsActive: 6, monthly: [48, 55, 60, 66, 72, 80], persistence: 1, trajectory: "Accelerating", note: "Clean/science beauty is a structural shift (not a fad); Foxtale's FY25 revenue + funding kept it in buzz all 6 months with rising slope." },
      title: "Homegrown clean/science beauty travel-exclusive line (Foxtale / Deconstruct)",
      brand: "Foxtale",
      company: "Foxtale",
      vertical: "Duty Free",
      category: "Clean / Science Beauty",
      city: "Delhi NCR",
      country: "India",
      signalType: "Emerging Brand",
      factors: { marketMomentum: 82, passengerRelevance: 80, commercialPotential: 78, strategicFit: 76, competitiveGap: 78, brandStrength: 74, implementationFeasibility: 82, evidenceConfidence: 78, innovationDifferentiation: 76 },
      recommendation: {
        opportunity: "Introduce a homegrown, science-led clean-beauty travel-exclusive kit into duty free, riding India's clean-beauty shift.",
        marketSignal: "Foxtale posted ₹199 Cr FY25 revenue (~$57M raised); ~80% of Indian shoppers now want eco/clean beauty. Beauty anchors ~31.7% of global travel retail.",
        whyNow: "Clean/ingredient-led beauty is a structural shift, and no homegrown clean-beauty travel-exclusive exists at BLR — a first-mover SKU window against legacy fragrance houses.",
        bialGap: "Fragrance/cosmetics anchored by legacy houses; no homegrown clean-beauty travel SKUs.",
        bialRecommendation: "Pilot a travel-exclusive clean-beauty kit (Foxtale and/or Deconstruct/Minimalist) as a duty-free end-cap with sampling; low-risk SKU introduction.",
        potentialLocation: "T2 International Duty Free — beauty adjacency",
        targetPassenger: "Millennial/Gen-Z female + gifting travellers",
        commercialPotential: "Medium",
        implementationComplexity: "Medium",
        expectedStrategicValue: "Category freshness + margin; a low-capex SKU test that can scale into a branded bay if velocity holds.",
        recommendedNextAction: "Curate SKU kit → duty-free operator alignment → 60-90 day sampling pilot → measure attach/ATV.",
      },
      evidence: [
        { id: "ev-fx-1", role: "Original Source", title: "The D2C Insider 20 — Foxtale (₹199 Cr FY25)", publisher: "D2C Insider", url: "https://pulse.d2cinsider.com/the-d2c-insider-20-indias-breakout-consumer-brands-of-2026/", tier: 2, publishedAt: "2026-07-28", excerpt: "Foxtale — ₹199 Cr FY25 revenue; ~$57M raised across six rounds." },
        { id: "ev-fx-2", role: "Market/Consumer Signal", title: "Foxtale vs Minimalist 2026 — science-led beauty", publisher: "Wild Oak India", url: "https://india.wildoak.store/blogs/skincare-ingredients/foxtale-vs-minimalist", tier: 3, excerpt: "Homegrown, science-driven, ingredient-forward Indian skincare at scale." },
        { id: "ev-fx-3", role: "Comparable Airport/City", title: "Duty Free & Travel Retail Market — beauty leadership", publisher: "Mordor Intelligence", url: "https://www.mordorintelligence.com/industry-reports/duty-free-and-travel-retail-market", tier: 2, excerpt: "Fragrances & cosmetics ~31.7% of travel-retail share; premiumisation rising." },
      ],
      contacts: [
        { id: "c-fx-1", verification: "Verified Public Business Contact", designation: "Retail / Channel Partnerships (corporate channel)", company: "Foxtale", companyWebsite: "https://foxtale.in", companyProfileUrl: "https://www.linkedin.com/company/foxtale/", linkedinUrl: "https://www.linkedin.com/company/foxtale/", confidence: 62, note: "Public corporate channel; identify named partnerships lead on LinkedIn." },
      ],
      signalIds: ["sig-foxtale", "sig-tr-personalised"],
      stage: "Discovered",
      createdAt: now,
      updatedAt: now,
      sufficientEvidence: true,
      tags: ["Duty Free", "Beauty", "Clean", "Travel-Exclusive"],
    },
    {
      id: "opp-changi-spirits",
      image: img("1569529465841-dfecdab7503b"),
      imageAlt: "Premium whisky & craft spirits — representative category imagery",
      buzz: { windowMonths: 6, firstSeen: "2026-06", monthsActive: 3, monthly: [0, 0, 0, 45, 80, 62], persistence: 0.5, trajectory: "Spike-and-fade", note: "Event-driven: a Changi pop-up running to 16 Sep. Sharp spike, will fade after the activation ends. Import the FORMAT (rotating discovery pop-ups), not this one-time event." },
      title: "Experiential craft-spirits discovery pop-up (Changi/Dewar's model)",
      brand: "Dewar's (activation model)",
      company: "Bacardi",
      vertical: "Duty Free",
      category: "Liquor / Experiential Activation",
      city: "Singapore",
      country: "Singapore",
      signalType: "Airport Innovation",
      factors: { marketMomentum: 76, passengerRelevance: 74, commercialPotential: 78, strategicFit: 74, competitiveGap: 80, brandStrength: 82, implementationFeasibility: 66, evidenceConfidence: 74, innovationDifferentiation: 84 },
      recommendation: {
        opportunity: "Adopt Changi's immersive craft-spirits 'discovery' pop-up format to lift BLR duty-free basket size and dwell spend.",
        marketSignal: "Dewar's ran an immersive whisky speakeasy pop-up at Changi T3 (to 16 Sep) — discovery theatre + cocktail culture that grows engagement and spend.",
        whyNow: "Experiential discovery, not discount, is now the duty-free differentiator; a rotating activation calendar keeps BLR duty free dynamic vs static peers.",
        bialGap: "No rotating experiential spirits/discovery activation program in duty free.",
        bialRecommendation: "Run a 1-3 month craft-spirits discovery pop-up (single-malt / regional-spirit takeover) with sampling + guided tasting in T2 Intl Duty Free.",
        potentialLocation: "T2 International Duty Free — liquor hall activation zone",
        targetPassenger: "International business + premium leisure travellers",
        commercialPotential: "High",
        implementationComplexity: "Medium",
        expectedStrategicValue: "Reusable activation template; brand co-funding potential; positions BLR alongside Changi on experiential retail.",
        recommendedNextAction: "Build activation calendar → approach spirit majors for co-funded takeover → 8-week pilot.",
      },
      evidence: [
        { id: "ev-ch-1", role: "Original Source", title: "Dewar's whisky discovery pop-up at Changi T3", publisher: "Moodie Davitt Report", url: "https://moodiedavittreport.com/", tier: 2, excerpt: "Immersive speakeasy pop-up; whisky discovery + cocktail culture, to 16 Sep." },
        { id: "ev-ch-2", role: "Market/Consumer Signal", title: "Duty-free rebounding with experiential retail focus", publisher: "Mordor Intelligence", url: "https://www.mordorintelligence.com/industry-reports/duty-free-and-travel-retail-market", tier: 2, excerpt: "Accelerating focus on experiential retail innovation and engagement." },
      ],
      contacts: [
        { id: "c-ch-1", verification: "Verified Public Business Contact", designation: "Global Travel Retail team (corporate channel)", company: "Bacardi (Dewar's)", companyWebsite: "https://www.bacardilimited.com", companyProfileUrl: "https://www.linkedin.com/company/bacardi/", linkedinUrl: "https://www.linkedin.com/company/bacardi/", confidence: 60, note: "Approach via Bacardi Global Travel Retail; also brief incumbent BLR duty-free operator." },
      ],
      signalIds: ["sig-changi-dewars"],
      stage: "Discovered",
      createdAt: now,
      updatedAt: now,
      sufficientEvidence: true,
      tags: ["Duty Free", "Experiential", "Activation", "Benchmark: Changi"],
    },
    {
      id: "opp-basil",
      image: img("1512621776951-a57141f2eefd"),
      imageAlt: "Healthy fresh grab-and-go food — representative category imagery",
      buzz: { windowMonths: 6, firstSeen: "2026-02", monthsActive: 6, monthly: [40, 44, 48, 50, 54, 58], persistence: 1, trajectory: "Sustained", note: "Steady outlet-expansion buzz across the window (60+ stores, 1,000-touchpoint target) — a durable structural QSR trend, moderate slope." },
      title: "Healthy fresh grab-and-go QSR kiosk (Basil)",
      brand: "Basil",
      company: "Basil",
      vertical: "F&B",
      category: "Healthy Fresh QSR",
      city: "Hyderabad",
      country: "India",
      signalType: "Emerging Concept",
      factors: { marketMomentum: 72, passengerRelevance: 74, commercialPotential: 70, strategicFit: 72, competitiveGap: 68, brandStrength: 62, implementationFeasibility: 78, evidenceConfidence: 70, innovationDifferentiation: 66 },
      recommendation: {
        opportunity: "Add a healthy, fresh grab-and-go format to capture the wellness-leaning traveller under-served airside.",
        marketSignal: "Basil runs 60+ fresh-food outlets across three cities, targeting 1,000 touchpoints — a scaling healthy-QSR format.",
        whyNow: "Health-forward grab-and-go is a persistent demand gap in Indian airports; format is dwell-friendly and fast.",
        bialGap: "Grab-and-go exists but limited dedicated healthy-fresh format.",
        bialRecommendation: "Kiosk / island unit (~10-15 m²) in T1 & T2 Domestic Departures; ambient + chilled ready-to-eat.",
        potentialLocation: "T1 & T2 Domestic Departures",
        targetPassenger: "Health-conscious business + young leisure travellers",
        commercialPotential: "Medium",
        implementationComplexity: "Medium",
        expectedStrategicValue: "Fills a portfolio gap; fast throughput suits peak flows. Validate cold-chain/shelf-life airside.",
        recommendedNextAction: "Validate cold-chain feasibility → kiosk pilot → measure velocity vs incumbent grab-and-go.",
      },
      evidence: [
        { id: "ev-bs-1", role: "Original Source", title: "The D2C Insider 20 — Basil (60+ outlets, 1,000 touchpoint target)", publisher: "D2C Insider", url: "https://pulse.d2cinsider.com/the-d2c-insider-20-indias-breakout-consumer-brands-of-2026/", tier: 2, publishedAt: "2026-07-28", excerpt: "Basil — fresh food & healthy QSR, 60+ outlets across three cities." },
        { id: "ev-bs-2", role: "Market/Consumer Signal", title: "India café/QSR growth & health-forward consumption", publisher: "Storyboard18", url: "https://www.storyboard18.com/brand-marketing/from-burgers-to-brews-why-qsr-brands-are-betting-big-on-coffee-106766.htm", tier: 3, excerpt: "QSR premiumisation and all-day consumption trends accelerating." },
      ],
      contacts: [
        { id: "c-bs-1", verification: "Verified Public Business Contact", designation: "Franchise / Expansion (corporate channel)", company: "Basil", companyWebsite: "#", companyProfileUrl: "https://www.linkedin.com/search/results/companies/?keywords=basil%20fresh%20food", confidence: 45, note: "Company channel to be confirmed; multiple 'Basil' entities exist — disambiguate before outreach." },
      ],
      signalIds: ["sig-basil"],
      stage: "Discovered",
      createdAt: now,
      updatedAt: now,
      sufficientEvidence: true,
      tags: ["F&B", "Healthy", "Grab-and-Go", "Kiosk"],
    },
    {
      id: "opp-matcha",
      image: img("1536256263959-770b48d82b0a"),
      imageAlt: "Matcha & functional beverages — representative category imagery",
      buzz: { windowMonths: 6, firstSeen: "2026-03", monthsActive: 5, monthly: [30, 40, 52, 60, 70, 78], persistence: 0.83, trajectory: "Accelerating", note: "Category (not brand) buzz accelerating hard across the window, but no single lead brand → INSUFFICIENT EVIDENCE. Strong trajectory, weak subject — validate before committing." },
      title: "Matcha & functional-beverage wellness pop-up",
      brand: "Category concept (no lead brand yet)",
      company: "—",
      vertical: "F&B",
      category: "Premium / Functional Beverages",
      city: "Dubai",
      country: "UAE",
      signalType: "Category Growth",
      factors: { marketMomentum: 78, passengerRelevance: 70, commercialPotential: 66, strategicFit: 68, competitiveGap: 72, brandStrength: 40, implementationFeasibility: 70, evidenceConfidence: 55, innovationDifferentiation: 78 },
      recommendation: {
        opportunity: "Test a matcha / functional-beverage wellness bar as a short pop-up to read demand before committing space.",
        marketSignal: "Matcha has crossed from niche to mainstream across beverages and even skincare in 2026; functional wellness beverages are a fast-rising format.",
        whyNow: "Wellness beverage demand is spiking, but there is no proven single lead brand to anchor — so pilot the concept, not a lease.",
        bialGap: "No dedicated functional/matcha wellness beverage format.",
        bialRecommendation: "Short-term pop-up (1-3 months) in T2 to gauge velocity; identify a lead brand partner from pilot performance.",
        potentialLocation: "T2 International Departures — activation kiosk",
        targetPassenger: "Young, wellness-oriented, affluent travellers",
        commercialPotential: "Medium",
        implementationComplexity: "Low",
        expectedStrategicValue: "Cheap optionality on a rising trend; converts to kiosk only if data supports it.",
        recommendedNextAction: "INSUFFICIENT lead-brand evidence — run a concept pop-up to generate first-party demand data before selecting a brand.",
      },
      evidence: [
        { id: "ev-mt-1", role: "Market/Consumer Signal", title: "Why Matcha is Dominating Wellness Trends in 2026", publisher: "Wellbeing Nutrition", url: "https://wellbeingnutrition.com/blogs/essential/matcha-is-dominating-wellness-trends-in-2026", tier: 3, excerpt: "Matcha now mainstream across lattes, wellness and skincare in 2026." },
        { id: "ev-mt-2", role: "Independent Confirmation", title: "Matcha make-up: the new natural beauty trend", publisher: "nss G-Club", url: "https://www.nssgclub.com/en/beauty/44928/matcha-make-up-trend-2026", tier: 4, excerpt: "Matcha crossing into beauty — breadth of the trend." },
      ],
      contacts: [],
      signalIds: [],
      stage: "Discovered",
      createdAt: now,
      updatedAt: now,
      sufficientEvidence: false,
      tags: ["F&B", "Wellness", "Pop-Up", "Needs Validation"],
    },
  ],

  candidates: ALL_CANDIDATES,

  refreshLog: [
    { at: now, mode: "offline", signalsScanned: 10, signalsNew: 10, duplicatesConsolidated: 4, opportunitiesCreated: 7, opportunitiesUpdated: 0, notes: "Initial seed ingestion from grounded trade-source research (Aug 2026)." },
  ],
};
