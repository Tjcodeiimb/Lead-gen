"use client";
import { useRouter } from "next/navigation";

/** A table row that navigates when clicked anywhere, not just on the name. */
export function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr className="cursor-pointer" onClick={() => router.push(href)} onMouseEnter={() => router.prefetch(href)}>
      {children}
    </tr>
  );
}
