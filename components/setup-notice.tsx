export function SetupNotice({ configured }: { configured: boolean }) {
  if (configured) {
    return null;
  }

  return (
    <p role="status" className="border-b border-line bg-copper-soft px-4 py-3 text-sm leading-6 text-ink md:px-7">
      Add <code>SUPABASE_SERVICE_ROLE_KEY</code> to <code>.env.local</code>, run{" "}
      <code>supabase/lock-public-key.sql</code> in the Supabase SQL editor, then restart the dev server. The service
      role key stays on the server. Do not prefix that name with NEXT_PUBLIC_.
    </p>
  );
}
