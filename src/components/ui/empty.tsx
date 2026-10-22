import type { LucideIcon } from "lucide-react";

export function Empty({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-12 w-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-4">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="h-section">{title}</h3>
      {description && <p className="t-caption mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
