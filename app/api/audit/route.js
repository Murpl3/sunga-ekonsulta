import * as db from "@/lib/store";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// The browser reports what happened; the server stamps who and when.
export async function POST(req) {
  const me = await db.current(req); if (!me) return db.deny();
  let b; try { b = await req.json(); } catch { return db.json({ error: "Invalid request." }, 400); }
  if (!b.action) return db.json({ error: "Missing action." }, 400);
  return db.json({ row: await db.audit(me, b.action, b.detail) });
}
