export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="t-caption">{label}</div>
      <div className="text-[28px] font-semibold tracking-[-0.03em] mt-1 leading-none">{value}</div>
      {hint && <div className="t-caption mt-2">{hint}</div>}
    </div>
  );
}
