import { HistoryBack } from "@/components/back-button";

export function PageHeader({
  title,
  description,
  compact = false,
}: {
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <header className="max-w-3xl shrink-0">
      <HistoryBack className={compact ? "mb-3 lg:mb-1" : "mb-3"} />
      <h1 className={`text-base font-semibold tracking-tight md:text-[28px] ${compact ? "lg:text-xl lg:leading-6" : ""}`}>
        {title}
      </h1>
      <p className={`mt-1 text-xs leading-5 text-muted md:text-sm md:leading-6 ${compact ? "lg:mt-0.5 lg:leading-5" : ""}`}>
        {description}
      </p>
    </header>
  );
}
