import { readLogo } from "@/lib/branding";

export async function GET() {
  const logo = await readLogo();

  if (!logo) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(logo.bytes), {
    headers: {
      "Content-Type": logo.contentType,
      "Cache-Control": "no-store",
    },
  });
}
