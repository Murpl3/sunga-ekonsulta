import * as db from "@/lib/store";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(req) {
  const u = await db.current(req);
  if (!u) return db.json({ user: null });
  const { sid, ...rest } = u;
  return db.json({ user: db.publicUser(rest) });
}
