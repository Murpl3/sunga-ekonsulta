import * as db from "@/lib/store";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const ROLES = ["superadmin", "admin", "encoder", "nurse", "doctor"];
async function guard(req) { const me = await db.current(req); if (!me) return [null, db.deny()]; if (!db.WRITE.users.includes(me.role)) return [null, db.deny("Not allowed.", 403)]; return [me, null]; }
export async function GET(req) {
  const [me, err] = await guard(req); if (err) return err;
  return db.json({ users: (await db.users()).map(db.publicUser) });
}
export async function POST(req) {
  const [me, err] = await guard(req); if (err) return err;
  let b; try { b = await req.json(); } catch { return db.json({ error: "Invalid request." }, 400); }
  const list = await db.users();
  if (!String(b.name || "").trim()) return db.json({ error: "Full name is required." }, 400);
  if (!/^[a-z0-9._]{4,20}$/i.test(b.username || "")) return db.json({ error: "Username: 4–20 letters, numbers, dot or underscore." }, 400);
  if (list.some((x) => x.username.toLowerCase() === b.username.toLowerCase())) return db.json({ error: "Username already exists." }, 400);
  if (!ROLES.includes(b.role) || !db.canManage(me.role, b.role)) return db.json({ error: "You cannot create an account with that role." }, 403);
  if (!db.pwOk(b.password)) return db.json({ error: "Password must be at least 8 characters with letters and numbers." }, 400);
  const u = { id: Math.max(0, ...list.map((x) => x.id)) + 1, username: b.username, name: b.name.trim(), role: b.role, active: true, pw: db.hashPw(b.password), defaultPw: true };
  list.push(u); await db.put("users", list); await db.audit(me, "User created", `${u.username} (${u.role})`);
  return db.json({ user: db.publicUser(u) });
}
export async function PATCH(req) {
  const [me, err] = await guard(req); if (err) return err;
  let b; try { b = await req.json(); } catch { return db.json({ error: "Invalid request." }, 400); }
  const list = await db.users(); const u = list.find((x) => x.id === b.id);
  if (!u) return db.json({ error: "Account not found." }, 404);
  if (!db.canManage(me.role, u.role)) return db.json({ error: "You cannot manage this account." }, 403);
  const supers = list.filter((x) => x.role === "superadmin" && x.active).length;
  if ("active" in b) {
    if (u.id === me.id) return db.json({ error: "You cannot deactivate your own account." }, 400);
    if (!b.active && u.role === "superadmin" && supers === 1) return db.json({ error: "At least one active Super Admin is required." }, 400);
    u.active = !!b.active; if (!u.active) db.endUserSessions(u.id);
    await db.audit(me, u.active ? "User activated" : "User deactivated", u.username);
  }
  if ("role" in b) {
    if (u.id === me.id) return db.json({ error: "You cannot change your own role." }, 400);
    if (!ROLES.includes(b.role) || !db.canManage(me.role, b.role)) return db.json({ error: "You cannot assign that role." }, 403);
    if (u.role === "superadmin" && b.role !== "superadmin" && supers === 1) return db.json({ error: "At least one active Super Admin is required." }, 400);
    u.role = b.role; db.endUserSessions(u.id); await db.audit(me, "Role changed", `${u.username} → ${b.role}`);
  }
  if ("password" in b) {
    if (!db.pwOk(b.password)) return db.json({ error: "Password must be at least 8 characters with letters and numbers." }, 400);
    u.pw = db.hashPw(b.password); u.defaultPw = true; db.endUserSessions(u.id); await db.audit(me, "Password reset", u.username);
  }
  await db.put("users", list);
  return db.json({ user: db.publicUser(u) });
}
