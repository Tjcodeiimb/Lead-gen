export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8 fade-up">
      <div>
        <h1 className="h-display">{title}</h1>
        {description && <p className="t-body text-ink-2 mt-2 max-w-2xl">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
