import * as db from "@/lib/store";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const FIELDS = ["name", "title", "email", "mobile", "prc", "ptr", "s2", "color", "theme"];
export async function PATCH(req) {
  const me = await db.current(req); if (!me) return db.deny();
  let b; try { b = await req.json(); } catch { return db.json({ error: "Invalid request." }, 400); }
  if ("name" in b && !String(b.name).trim()) return db.json({ error: "Full name is required." }, 400);
  if (b.mobile && !/^09\d{9}$/.test(b.mobile)) return db.json({ error: "Mobile number must be 11 digits starting with 09." }, 400);
  const list = await db.users(); const u = list.find((x) => x.id === me.id);
  for (const k of FIELDS) if (k in b) u[k] = String(b[k] ?? "").slice(0, 120);
  await db.put("users", list);
  if ("theme" in b) await db.audit(me, "Preference changed", `theme → ${u.theme}`);
  return db.json({ user: db.publicUser(u) });
}
