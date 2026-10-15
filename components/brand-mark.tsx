export function BrandMark({
  shopName,
  logoUrl,
  className = "size-9 text-base",
}: {
  shopName: string;
  logoUrl: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return (
      // User-uploaded shop logo, served from this app.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="" className={`rounded-[10px] object-cover ${className}`} />
    );
  }

  const letter = shopName.trim().charAt(0).toUpperCase() || "K";

  return (
    <div className={`flex items-center justify-center rounded-[10px] bg-copper font-bold text-on-copper ${className}`}>
      {letter}
    </div>
  );
}
