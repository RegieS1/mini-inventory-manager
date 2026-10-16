import Link from "next/link";

const pageSize = 10;

export function pageWindow(page: string | undefined) {
  const current = Math.max(1, Number(page) || 1);

  return {
    limit: pageSize,
    page: current,
    offset: (current - 1) * pageSize,
  };
}

export function PageFooter({
  page,
  total,
  hrefForPage,
}: {
  page: number;
  total: number;
  hrefForPage: (page: number) => string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const hasPrevious = page > 1;
  const hasNext = page < pageCount;
  const button = "inline-flex h-10 w-28 items-center justify-center rounded-lg border border-line bg-surface text-sm font-semibold";

  return (
    <div className="inline-grid shrink-0 grid-cols-[7rem_9rem_7rem] items-center gap-2">
      {hasPrevious ? (
        <Link href={hrefForPage(page - 1)} className={button}>
          Previous
        </Link>
      ) : (
        <span className={`${button} text-muted`}>Previous</span>
      )}
      <p className="text-center text-sm tabular-nums text-muted">
        Page {Math.min(page, pageCount)} of {pageCount}
      </p>
      {hasNext ? (
        <Link href={hrefForPage(page + 1)} className={button}>
          Next
        </Link>
      ) : (
        <span className={`${button} text-muted`}>Next</span>
      )}
    </div>
  );
}
