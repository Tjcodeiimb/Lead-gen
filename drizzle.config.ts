import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read .env.local by itself, so load it here.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use the DIRECT (session) connection string from Supabase for migrations.
    url: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
