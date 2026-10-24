"use client";
import { useRouter } from "next/navigation";
import { markNavClick } from "./nav-timer";

/** A table row that navigates when clicked anywhere, not just on the name. */
export function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr className="cursor-pointer" onClick={() => { markNavClick(); router.push(href); }} onMouseEnter={() => router.prefetch(href)}>
      {children}
    </tr>
  );
}
