import * as db from "@/lib/store";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(req) {
  const u = await db.current(req);
  if (u) { await db.audit(u, "Signed out", ""); db.endSession(u.sid); }
  return db.json({ ok: true }, 200, { "Set-Cookie": db.cookie("", 0) });
}
