// Server-side data store for the eKonsulta app.
// File database: one JSON file per collection in data/db (DB_DIR to change), written atomically
// (write temp file, then rename), plus a daily snapshot kept for 30 days.
// All route handlers share one in-memory copy through globalThis.
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const DIR = process.env.DB_DIR || path.join(process.cwd(), "data", "db");
const G = globalThis.__ekdb || (globalThis.__ekdb = { cache: {}, queue: Promise.resolve(), sessions: new Map(), fails: new Map(), snapDay: "" });
const COLL = { users: [], clients: [], clinic: null, payments: [], audit: [], meta: {} };

async function readJson(name) {
  try { return JSON.parse(await fs.readFile(path.join(DIR, name + ".json"), "utf8")); }
  catch (e) { if (e.code === "ENOENT") return undefined; throw new Error(`Database file ${name}.json is damaged: ${e.message}`); }
}
export async function get(name) {
  if (!(name in G.cache)) { const v = await readJson(name); G.cache[name] = v === undefined ? structuredClone(COLL[name]) : v; }
  return G.cache[name];
}
// Serialised writes so two requests never interleave on the same file.
export function put(name, value) {
  G.cache[name] = value;
  G.queue = G.queue.then(async () => {
    await fs.mkdir(DIR, { recursive: true });
    const f = path.join(DIR, name + ".json"), tmp = f + "." + process.pid + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(value), "utf8");
    await fs.rename(tmp, f);
    await snapshot();
  }).catch((e) => console.error("[db] write failed", name, e));
  return G.queue;
}
async function snapshot() {
  const day = new Date().toISOString().slice(0, 10);
  if (G.snapDay === day) return;
  G.snapDay = day;
  const dir = path.join(DIR, "snapshots", day);
  try { await fs.access(dir); return; } catch {}
  await fs.mkdir(dir, { recursive: true });
  for (const f of await fs.readdir(DIR)) if (f.endsWith(".json")) await fs.copyFile(path.join(DIR, f), path.join(dir, f));
  const all = (await fs.readdir(path.join(DIR, "snapshots"))).sort();
  for (const old of all.slice(0, Math.max(0, all.length - 30))) await fs.rm(path.join(DIR, "snapshots", old), { recursive: true, force: true });
}

/* ---------- passwords & sessions ---------- */
export function hashPw(pw, salt = crypto.randomBytes(16).toString("hex")) {
  return `scrypt$${salt}$${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}
export function checkPw(pw, stored) {
  const [, salt, hex] = String(stored || "").split("$"); if (!salt || !hex) return false;
  const a = Buffer.from(hex, "hex"), b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export const pwOk = (s) => typeof s === "string" && s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s);
const IDLE_MS = (+process.env.SESSION_IDLE_MIN || 30) * 60000, MAX_MS = 12 * 3600000;
export const COOKIE = "ek_sid";

const DEFAULT_USERS = [
  ["superadmin", "Super@123", "System Super Admin", "superadmin", {}],
  ["admin", "Admin@123", "Rosa M. Dizon", "admin", {}],
  ["encoder", "Encoder@123", "Noel Villanueva", "encoder", {}],
  ["nurse", "Nurse@123", "Elena Reyes, RN", "nurse", { title: "Primary Care Nurse", prc: "0456123" }],
  ["doctor", "Doctor@123", "Dr. Maria L. Santos", "doctor", { title: "Family Medicine Physician", prc: "0098231" }],
];
export async function users() {
  let u = await get("users");
  if (!u.length) {
    u = DEFAULT_USERS.map(([username, pw, name, role, extra], i) => ({ id: i + 1, username, pw: hashPw(pw), defaultPw: true, name, role, active: true, ...extra }));
    await put("users", u);
  }
  return u;
}
// What the browser may see about a user (never the password hash).
export const publicUser = (u) => { const { pw, ...rest } = u; return rest; };

export function newSession(userId) {
  const sid = crypto.randomBytes(32).toString("hex");
  G.sessions.set(sid, { userId, start: Date.now(), last: Date.now() });
  return sid;
}
export function endSession(sid) { G.sessions.delete(sid); }
export function endUserSessions(userId) { for (const [k, s] of G.sessions) if (s.userId === userId) G.sessions.delete(k); }
const sidOf = (req) => (req.headers.get("cookie") || "").split(/;\s*/).map((x) => x.split("=")).find(([k]) => k === COOKIE)?.[1];

// Returns the signed-in, active user or null. Refreshes the idle timer.
export async function current(req) {
  const sid = sidOf(req); if (!sid) return null;
  const s = G.sessions.get(sid); if (!s) return null;
  const now = Date.now();
  if (now - s.last > IDLE_MS || now - s.start > MAX_MS) { G.sessions.delete(sid); return null; }
  s.last = now;
  const u = (await users()).find((x) => x.id === s.userId);
  if (!u || !u.active) { G.sessions.delete(sid); return null; }
  return { ...u, sid };
}
export const cookie = (sid, maxAge) => `${COOKIE}=${sid}; Path=/; HttpOnly; SameSite=Lax${maxAge === 0 ? "; Max-Age=0" : ""}`;

// Login throttling: 5 wrong passwords → that username is locked for 5 minutes.
export function lockedFor(name) { const f = G.fails.get(name); if (!f || f.n < 5) return 0; const left = f.until - Date.now(); if (left <= 0) { G.fails.delete(name); return 0; } return Math.ceil(left / 60000); }
export function failed(name) { const f = G.fails.get(name) || { n: 0 }; f.n++; if (f.n >= 5) f.until = Date.now() + 5 * 60000; G.fails.set(name, f); }
export function cleared(name) { G.fails.delete(name); }

/* ---------- audit ---------- */
export async function audit(user, action, detail = "") {
  const a = await get("audit");
  const row = { ts: new Date().toLocaleString("en-PH", { timeZone: process.env.TZ || "Asia/Manila" }), user: user ? user.username : "-", action: String(action).slice(0, 120), detail: String(detail || "").slice(0, 300) };
  const next = [row, ...a].slice(0, 5000);
  await put("audit", next);
  return row;
}

export const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers });
export const deny = (msg = "Please sign in.", status = 401) => json({ error: msg }, status);
// Server-side permissions (mirror of the app's PERMS for writes).
export const WRITE = {
  clients: ["superadmin", "admin", "encoder", "nurse", "doctor"],
  clinic: ["superadmin", "admin", "encoder"],
  payments: ["superadmin", "admin"],
  users: ["superadmin", "admin"],
  auditRead: ["superadmin", "admin"],
};
export const canManage = (actor, target) => actor === "superadmin" || (actor === "admin" && !["superadmin", "admin"].includes(target));
