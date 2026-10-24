import { count, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db/client";
import { reviews } from "@/db/schema";
import { Shell } from "@/components/app/shell";
import { ensureMigrated } from "@/db/migrate";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  // Creates or updates the database tables on first use, so no terminal command is ever needed.
  const m = await ensureMigrated();
  if (!m.ok) throw new Error(`Database setup failed: ${m.error}`);
  let pending = 0;
  try {
    const [row] = await db.select({ n: count() }).from(reviews).where(eq(reviews.status, "pending"));
    pending = row?.n ?? 0;
  } catch {
    pending = 0;
  }
  return <Shell email={user.email} pendingReviews={pending}>{children}</Shell>;
}
