"use client";
import { useEffect } from "react";
import { toast } from "sonner";

export function Notice({ connected, error }: { connected?: string; error?: string }) {
  useEffect(() => {
    if (connected) toast.success(`Google connected${connected ? ` as ${connected}` : ""}`);
    if (error) toast.error(error);
  }, [connected, error]);
  return null;
}
