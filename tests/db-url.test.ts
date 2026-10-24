import { describe, expect, it } from "vitest";
import { pickDatabaseUrl, sanitizeDatabaseUrl } from "@/lib/db-url";

describe("database url", () => {
  it("prefers DATABASE_URL, then POSTGRES_URL", () => {
    expect(pickDatabaseUrl({ DATABASE_URL: "postgresql://a", POSTGRES_URL: "postgresql://b" })).toBe("postgresql://a");
    expect(pickDatabaseUrl({ POSTGRES_URL: "postgresql://b" })).toBe("postgresql://b");
    expect(pickDatabaseUrl({})).toBe("");
  });
  it("strips the integration's extra pooler params but keeps sslmode", () => {
    const raw = "postgres://postgres.x:pw@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x&pgbouncer=true";
    expect(sanitizeDatabaseUrl(raw)).toBe("postgres://postgres.x:pw@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require");
    expect(sanitizeDatabaseUrl("postgres://u:p@h:6543/postgres?supa=x")).toBe("postgres://u:p@h:6543/postgres");
  });
});
