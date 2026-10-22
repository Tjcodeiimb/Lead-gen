import { count, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db } from "@/db/client";
import { reviews } from "@/db/schema";
import { Sidebar } from "@/components/app/sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  let pending = 0;
  try {
    const [row] = await db.select({ n: count() }).from(reviews).where(eq(reviews.status, "pending"));
    pending = row?.n ?? 0;
  } catch {
    pending = 0;
  }
  return (
    <div className="min-h-screen">
      <Sidebar email={user.email} pendingReviews={pending} />
      <main className="pl-[248px]">
        <div className="max-w-[1180px] mx-auto px-10 py-10">{children}</div>
      </main>
    </div>
  );
}
