import { getDraws } from "@/lib/draws";

/**
 * Public JSON copy of the site's Express Entry draw data. With the static
 * export this renders once at build into out/api/ee-draws.json — it only
 * republishes IRCC's public statistics and contains no user data.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json(getDraws());
}
