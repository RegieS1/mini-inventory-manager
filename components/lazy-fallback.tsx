function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-line ${className}`} />;
}

export function MetricsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-3 lg:grid-cols-4 xl:grid-cols-4">
      <p className="sr-only">Loading inventory totals...</p>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-xl border border-line bg-surface p-4" aria-hidden="true">
          <Bone className="h-4 w-24" />
          <Bone className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="rounded-xl border border-line bg-surface p-4 lg:h-full">
      <p className="sr-only">{label}</p>
      <div aria-hidden="true">
        <Bone className="h-5 w-32" />
        <Bone className="mt-4 h-10 w-full" />
        <Bone className="mt-3 h-10 w-full" />
        <Bone className="mt-3 h-10 w-4/5" />
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div role="status" aria-live="polite" className="mt-6">
      <p className="sr-only">Loading products...</p>
      <div aria-hidden="true" className="rounded-xl border border-line bg-surface p-4">
        <Bone className="h-11 w-full max-w-sm" />
        {Array.from({ length: 5 }, (_, index) => (
          <Bone key={index} className="mt-3 h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div role="status" aria-live="polite" className="mt-6 max-w-3xl rounded-xl border border-line bg-surface p-5">
      <p className="sr-only">Loading form...</p>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
        <Bone className="h-16" />
        <Bone className="h-16" />
        <Bone className="h-16 sm:col-span-2" />
        <Bone className="h-16" />
        <Bone className="h-16" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div role="status" aria-live="polite" className="mt-6 max-w-xl rounded-xl border border-line bg-surface p-5">
      <p className="sr-only">Loading product...</p>
      <div aria-hidden="true">
        <Bone className="h-8 w-48" />
        <Bone className="mt-4 h-4 w-24" />
        <div className="mt-5 grid grid-cols-2 gap-4">
          <Bone className="h-12" />
          <Bone className="h-12" />
          <Bone className="h-12" />
          <Bone className="h-12" />
        </div>
      </div>
    </div>
  );
}
