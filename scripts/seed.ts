/**
 * Seeds the default settings. Add --demo to also create a demo campaign and three fictional
 * leads (removable later from Settings → Delete demo data).
 * Run: pnpm db:seed   or   pnpm db:seed --demo
 */
import "dotenv/config";
import { db } from "../src/db/client";
import { campaigns, companies, people, settings } from "../src/db/schema";

async function main() {
  await db.insert(settings).values([{ key: "pause_llm", value: false }, { key: "monthly_budget_usd", value: 150 }]).onConflictDoNothing();
  if (!process.argv.includes("--demo")) { console.log("Settings seeded. Run with --demo to add sample data."); process.exit(0); }
  const [c] = await db.insert(campaigns).values({ name: "Indian D2C brands → UAE (demo)", persona: "A", corridor: "IN->AE", offer: "OFF-3", goal: "Book 8 discovery calls", notes: "Demo campaign. Non-diaspora shoppers are the angle." }).returning();
  const demo = [
    { company: "Meera Botanicals (fictional)", domain: "meerabotanicals.example", name: "Asha Rao", title: "Founder & CEO", email: "asha@meerabotanicals.example", country: "IN" },
    { company: "Kalpa Home (fictional)", domain: "kalpahome.example", name: "Rohan Mehta", title: "Head of International", email: "rohan@kalpahome.example", country: "IN" },
    { company: "Northline Snacks (fictional)", domain: "northlinesnacks.example", name: "Priya Nair", title: "CFO", email: "priya@northlinesnacks.example", country: "IN" },
  ];
  for (const d of demo) {
    const [co] = await db.insert(companies).values({ name: d.company, domain: d.domain, hqCountry: "IN", industry: "Consumer goods", employeeRange: "51-200" }).returning();
    await db.insert(people).values({ companyId: co.id, campaignId: c.id, fullName: d.name, firstName: d.name.split(" ")[0], title: d.title, email: d.email, country: d.country, source: "seed", sourceDescription: "Demo data", lawfulBasis: "legitimate_interest" });
  }
  console.log("Seeded 1 campaign and 3 leads.");
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
