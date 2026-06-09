import { NextResponse } from "next/server";
import { getDraws } from "@/lib/draws";

/**
 * Public JSON endpoint for Express Entry draw data: live from IRCC when
 * reachable (cached ~6h), otherwise the bundled snapshot. Contains no user
 * data — it only proxies published government statistics.
 */
export async function GET() {
  const draws = await getDraws();
  return NextResponse.json(draws, {
    headers: {
      "cache-control": "public, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
}
