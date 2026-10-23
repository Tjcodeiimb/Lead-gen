/**
 * Applies the SQL migrations in /drizzle to the database in .env.local.
 * Run: pnpm db:migrate
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL_DIRECT / DATABASE_URL is missing in .env.local");
  const host = url.split("@")[1]?.split("/")[0] ?? "(could not read host)";
  console.log(`Connecting to ${host} ...`);
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  await sql`select 1`;
  console.log("Connected. Applying migrations ...");
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully. Your tables are ready.");
  await sql.end();
}

main().catch((e) => {
  console.error("\nMIGRATION FAILED:");
  console.error(e?.message ?? e);
  if (e?.code) console.error("code:", e.code);
  process.exit(1);
});
