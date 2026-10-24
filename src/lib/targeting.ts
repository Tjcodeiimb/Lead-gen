/**
 * Targeting vocabulary for campaigns: niches, sub-niches, company sizes, roles and the
 * country/city lists used by the pickers. Add entries here; the UI reads this file.
 */
export const NICHES: { value: string; label: string; sub: { value: string; label: string; keywords: string[] }[] }[] = [
  {
    value: "d2c", label: "D2C and consumer brands",
    sub: [
      { value: "beauty", label: "Beauty and personal care", keywords: ["skincare", "cosmetics", "haircare", "fragrance", "personal care"] },
      { value: "fashion", label: "Fashion and apparel", keywords: ["apparel", "fashion", "footwear", "streetwear", "ethnic wear"] },
      { value: "fnb", label: "Food and beverage", keywords: ["packaged food", "snacks", "beverages", "tea", "coffee", "spices"] },
      { value: "home", label: "Home and living", keywords: ["home decor", "furniture", "kitchenware", "bedding"] },
      { value: "wellness", label: "Health and wellness", keywords: ["supplements", "nutrition", "ayurveda", "fitness"] },
      { value: "jewellery", label: "Jewellery and accessories", keywords: ["jewellery", "jewelry", "watches", "accessories"] },
      { value: "baby", label: "Baby and kids", keywords: ["baby care", "kids", "toys", "maternity"] },
    ],
  },
  {
    value: "saas", label: "SaaS and AI startups",
    sub: [
      { value: "b2b_saas", label: "B2B SaaS", keywords: ["SaaS", "software", "platform", "enterprise software"] },
      { value: "ai", label: "AI products", keywords: ["AI", "artificial intelligence", "machine learning", "LLM", "agents"] },
      { value: "fintech", label: "Fintech", keywords: ["fintech", "payments", "lending", "wealth", "insurtech"] },
      { value: "healthtech", label: "Healthtech", keywords: ["healthtech", "digital health", "telemedicine"] },
      { value: "devtools", label: "Developer tools", keywords: ["developer tools", "API", "infrastructure", "devops"] },
    ],
  },
  {
    value: "pe_vc", label: "PE and VC funds",
    sub: [
      { value: "pe", label: "Private equity", keywords: ["private equity", "buyout", "growth equity", "portfolio company"] },
      { value: "vc", label: "Venture capital", keywords: ["venture capital", "VC fund", "Series A", "portfolio"] },
      { value: "family_office", label: "Family offices", keywords: ["family office", "single family office", "multi-family office"] },
    ],
  },
  {
    value: "family", label: "Family businesses and manufacturers",
    sub: [
      { value: "manufacturing", label: "Manufacturing", keywords: ["manufacturer", "factory", "OEM", "industrial"] },
      { value: "trading", label: "Trading and distribution", keywords: ["trading", "distributor", "wholesale", "import export"] },
      { value: "retail", label: "Retail and franchise", keywords: ["retail chain", "franchise", "stores", "QSR"] },
      { value: "hospitality", label: "Hospitality and real estate", keywords: ["hotels", "restaurants", "real estate", "developer"] },
    ],
  },
];

export const COMPANY_SIZES = [
  { value: "1,10", label: "1 to 10" },
  { value: "11,50", label: "11 to 50" },
  { value: "51,200", label: "51 to 200" },
  { value: "201,500", label: "201 to 500" },
  { value: "501,1000", label: "501 to 1,000" },
  { value: "1001,5000", label: "1,001 to 5,000" },
  { value: "5001,", label: "5,000+" },
];

export const ROLE_GROUPS: { value: string; label: string; titles: string[]; apolloSeniorities: string[] }[] = [
  { value: "founder_ceo", label: "Founder / CEO / MD", titles: ["Founder", "Co-Founder", "CEO", "Chief Executive Officer", "Managing Director"], apolloSeniorities: ["founder", "owner", "c_suite"] },
  { value: "international", label: "Head of International / Expansion", titles: ["Head of International", "VP International", "Head of Expansion", "Country Manager", "GM International", "Head of New Markets"], apolloSeniorities: ["vp", "head", "director"] },
  { value: "growth", label: "Growth / Marketing lead", titles: ["Chief Growth Officer", "VP Growth", "Head of Growth", "CMO", "Head of Marketing"], apolloSeniorities: ["c_suite", "vp", "head"] },
  { value: "finance", label: "CFO / Finance", titles: ["CFO", "Chief Financial Officer", "VP Finance", "Head of Finance", "FP&A"], apolloSeniorities: ["c_suite", "vp", "head"] },
  { value: "strategy", label: "Strategy / Corp Dev", titles: ["Chief Strategy Officer", "Head of Strategy", "VP Strategy", "Head of Corporate Development"], apolloSeniorities: ["c_suite", "vp", "head"] },
  { value: "operating_partner", label: "Operating Partner / Portfolio", titles: ["Operating Partner", "Portfolio Operations", "Value Creation", "Partner"], apolloSeniorities: ["partner", "vp", "head"] },
  { value: "coo", label: "COO / Operations", titles: ["COO", "Chief Operating Officer", "VP Operations", "Head of Operations"], apolloSeniorities: ["c_suite", "vp", "head"] },
];

export const COUNTRIES: { code: string; name: string; cities: string[] }[] = [
  { code: "IN", name: "India", cities: ["Mumbai", "Delhi NCR", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Ahmedabad", "Kolkata", "Jaipur", "Surat"] },
  { code: "AE", name: "United Arab Emirates", cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
  { code: "SA", name: "Saudi Arabia", cities: ["Riyadh", "Jeddah", "Dammam"] },
  { code: "QA", name: "Qatar", cities: ["Doha"] },
  { code: "GB", name: "United Kingdom", cities: ["London", "Manchester", "Birmingham", "Leeds", "Edinburgh"] },
  { code: "US", name: "United States", cities: ["New York", "San Francisco Bay Area", "Los Angeles", "Austin", "Chicago", "Miami", "Seattle", "Boston"] },
  { code: "SG", name: "Singapore", cities: ["Singapore"] },
  { code: "AU", name: "Australia", cities: ["Sydney", "Melbourne", "Brisbane"] },
  { code: "DE", name: "Germany", cities: ["Berlin", "Munich", "Hamburg", "Frankfurt"] },
  { code: "FR", name: "France", cities: ["Paris", "Lyon"] },
  { code: "NL", name: "Netherlands", cities: ["Amsterdam", "Rotterdam"] },
  { code: "IE", name: "Ireland", cities: ["Dublin"] },
  { code: "CA", name: "Canada", cities: ["Toronto", "Vancouver", "Montreal"] },
];

export function nicheLabel(niche: string, sub?: string | null) {
  const n = NICHES.find((x) => x.value === niche);
  const s = n?.sub.find((x) => x.value === sub);
  return [n?.label ?? niche, s?.label].filter(Boolean).join(" · ");
}

export function nicheKeywords(niche: string, sub?: string | null): string[] {
  const n = NICHES.find((x) => x.value === niche);
  if (!n) return [niche];
  const s = n.sub.find((x) => x.value === sub);
  return s ? s.keywords : n.sub.flatMap((x) => x.keywords.slice(0, 2));
}

export function countryName(code?: string | null) {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code ?? "";
}

export function roleTitles(roles: string[]): string[] {
  return ROLE_GROUPS.filter((r) => roles.includes(r.value)).flatMap((r) => r.titles);
}

export function roleSeniorities(roles: string[]): string[] {
  return Array.from(new Set(ROLE_GROUPS.filter((r) => roles.includes(r.value)).flatMap((r) => r.apolloSeniorities)));
}

/** Email cold-outreach rule per country (docs/research/01 §5). */
export function emailRule(country?: string | null): "ok" | "evidence_required" | "linkedin_only" | "caution" {
  switch (country) {
    case "DE": case "AT": return "linkedin_only";
    case "CA": case "AU": return "evidence_required";
    case "AE": case "SA": case "QA": case "IN": return "caution";
    default: return "ok";
  }
}
