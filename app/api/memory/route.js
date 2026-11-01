// Long-term memory for the YAKAP Assistant.
// Saved per user as JSON files in <project>/data/memory (or MEMORY_DIR if set).
// Mock app: the username comes from the browser and is not verified server-side.
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
const DIR = process.env.MEMORY_DIR || path.join(process.cwd(), "data", "memory");
const MAX_HISTORY = 60, MAX_NOTES = 100;
const okUser = (u) => typeof u === "string" && /^[a-z0-9._]{2,30}$/i.test(u);
const file = (u) => path.join(DIR, u.toLowerCase() + ".json");

async function load(u) {
  try { const d = JSON.parse(await fs.readFile(file(u), "utf8")); return { history: Array.isArray(d.history) ? d.history : [], notes: Array.isArray(d.notes) ? d.notes : [], updated: d.updated || null }; }
  catch { return { history: [], notes: [], updated: null }; }
}

export async function GET(req) {
  const u = new URL(req.url).searchParams.get("user");
  if (!okUser(u)) return Response.json({ error: "Invalid user." }, { status: 400 });
  return Response.json(await load(u));
}

export async function POST(req) {
  let b; try { b = await req.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (!okUser(b.user)) return Response.json({ error: "Invalid user." }, { status: 400 });
  const cur = await load(b.user);
  const history = Array.isArray(b.history)
    ? b.history.filter((m) => m && (m.from === "me" || m.from === "bot") && typeof m.text === "string").slice(-MAX_HISTORY)
        .map((m) => ({ from: m.from, text: m.text.slice(0, 2000), ...(typeof m.go === "string" ? { go: m.go } : {}), ...(m.ai ? { ai: true } : {}), at: typeof m.at === "string" ? m.at : null }))
    : cur.history;
  const notes = Array.isArray(b.notes)
    ? b.notes.filter((n) => n && typeof n.text === "string" && n.text.trim()).slice(-MAX_NOTES).map((n) => ({ text: n.text.slice(0, 300), at: typeof n.at === "string" ? n.at : new Date().toISOString() }))
    : cur.notes;
  const data = { history, notes, updated: new Date().toISOString() };
  await fs.mkdir(DIR, { recursive: true });
  const tmp = file(b.user) + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file(b.user));
  return Response.json({ ok: true, notes: notes.length, history: history.length });
}
