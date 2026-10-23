"use client";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Friendly fallback when a page fails to load, instead of a raw error screen. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  const db = /Failed query|ECONNRESET|timeout|CONNECT/i.test(error.message);
  return (
    <div className="card p-10 max-w-xl mx-auto mt-16 text-center fade-up">
      <h2 className="h-title mb-2">{db ? "The database didn't answer in time" : "Something went wrong"}</h2>
      <p className="t-body text-ink-2 mb-6">
        {db
          ? "This is usually a dropped connection and fixes itself on retry. If it keeps happening, the PowerShell window shows the reason on the line starting with [cause]."
          : "The details are in the PowerShell window running the app."}
      </p>
      <Button onClick={reset}><RefreshCw className="h-4 w-4" /> Try again</Button>
    </div>
  );
}
