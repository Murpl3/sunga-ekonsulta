import * as db from "@/lib/store";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(req) {
  const me = await db.current(req); if (!me) return db.deny();
  let b; try { b = await req.json(); } catch { return db.json({ error: "Invalid request." }, 400); }
  if (!db.checkPw(String(b.current || ""), me.pw)) return db.json({ error: "Current password is incorrect." }, 400);
  if (!db.pwOk(b.next)) return db.json({ error: "New password must be at least 8 characters with letters and numbers." }, 400);
  if (b.next === b.current) return db.json({ error: "New password must be different from the current one." }, 400);
  const list = await db.users(); const u = list.find((x) => x.id === me.id);
  u.pw = db.hashPw(b.next); u.defaultPw = false; u.pwChanged = new Date().toLocaleString("en-PH", { timeZone: process.env.TZ || "Asia/Manila" });
  await db.put("users", list); await db.audit(me, "Password changed", me.username);
  return db.json({ user: db.publicUser(u) });
}
