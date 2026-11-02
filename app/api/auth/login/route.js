import * as db from "@/lib/store";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(req) {
  let b; try { b = await req.json(); } catch { return db.json({ error: "Invalid request." }, 400); }
  const name = String(b.username || "").trim().toLowerCase(), pw = String(b.password || "");
  if (!name || !pw) return db.json({ error: "Enter your username and password." }, 400);
  const mins = db.lockedFor(name);
  if (mins) return db.json({ error: `Too many wrong attempts. Try again in ${mins} minute(s).` }, 429);
  const list = await db.users();
  const u = list.find((x) => x.username.toLowerCase() === name);
  if (!u || !db.checkPw(pw, u.pw)) { db.failed(name); await db.audit({ username: name }, "Failed sign-in", ""); return db.json({ error: "Incorrect username or password." }, 401); }
  if (!u.active) return db.json({ error: "This account is deactivated. Contact your administrator." }, 403);
  db.cleared(name);
  u.lastLogin = new Date().toLocaleString("en-PH", { timeZone: process.env.TZ || "Asia/Manila" });
  await db.put("users", list);
  const sid = db.newSession(u.id);
  await db.audit(u, "Signed in", "");
  return db.json({ user: db.publicUser(u) }, 200, { "Set-Cookie": db.cookie(sid) });
}
