import { count, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db/client";
import { reviews } from "@/db/schema";
import { Shell } from "@/components/app/shell";
import { ensureMigrated } from "@/db/migrate";
import { requestMeta } from "@/lib/request-meta";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { coldStart, serverStartedAt } = requestMeta();
  // Sign-in check and schema check in parallel: both are needed, neither depends on the other.
  const [user, m] = await Promise.all([requireUser(), ensureMigrated()]);
  if (!m.ok) throw new Error(`Database setup failed: ${m.error}`);
  let pending = 0;
  try {
    const [row] = await db.select({ n: count() }).from(reviews).where(eq(reviews.status, "pending"));
    pending = row?.n ?? 0;
  } catch {
    pending = 0;
  }
  return <Shell email={user.email} pendingReviews={pending} serverStartedAt={serverStartedAt} coldStart={coldStart}>{children}</Shell>;
}
