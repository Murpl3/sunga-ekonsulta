// Shared, clinic-wide knowledge for the YAKAP Assistant, learned from all accounts.
// Stored in <project>/data/knowledge.json (or KNOWLEDGE_FILE if set).
// Mock app: user and role come from the browser and are not verified server-side.
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
const FILE = process.env.KNOWLEDGE_FILE || path.join(process.cwd(), "data", "knowledge.json");
const ADMINS = ["superadmin", "admin"];
const clip = (s, n) => String(s || "").trim().slice(0, n);
const key = (q) => clip(q, 300).toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
let lock = Promise.resolve();
const STOP = new Set("the a an is are was were my me i you your to of and or in on at for with what who when where how do does did it this that be can will about please".split(" "));
const words = (x) => String(x).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, ""));
const similar = (a, b) => { const x = words(a), y = words(b); if (!x.length || !y.length) return false; const hit = x.filter((w) => y.includes(w)).length; return hit >= Math.min(2, x.length) && hit / Math.max(x.length, y.length) >= 0.5; };
// When an answer becomes shared, clear unanswered questions that it now covers.
const resolveSimilar = (d, q) => Object.values(d.questions).forEach((x) => { if (similar(x.q, q)) x.resolved = true; });

async function load() {
  try { const d = JSON.parse(await fs.readFile(FILE, "utf8")); return { facts: d.facts || [], pending: d.pending || [], questions: d.questions || {} }; }
  catch { return { facts: [], pending: [], questions: {} }; }
}
async function store(d) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE + ".tmp", JSON.stringify(d, null, 2), "utf8");
  await fs.rename(FILE + ".tmp", FILE);
}
const view = (d) => {
  const qs = Object.values(d.questions);
  return {
    facts: d.facts, pending: d.pending,
    unanswered: qs.filter((q) => q.unanswered > 0 && !q.resolved).sort((a, b) => b.unanswered - a.unanswered).slice(0, 50),
    popular: qs.filter((q) => q.answered > 0).sort((a, b) => b.count - a.count).slice(0, 12),
    stats: { questions: qs.reduce((a, q) => a + q.count, 0), distinct: qs.length, users: new Set(qs.flatMap((q) => q.users)).size },
  };
};

export async function GET() { return Response.json(view(await load())); }

export async function POST(req) {
  let b; try { b = await req.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  const user = clip(b.user, 30), role = clip(b.role, 20), isAdmin = ADMINS.includes(role);
  if (!/^[a-z0-9._]{2,30}$/i.test(user)) return Response.json({ error: "Invalid user." }, { status: 400 });
  const run = async () => {
    const d = await load(); const now = new Date().toISOString(); let msg = "ok";
    switch (b.action) {
      case "log": { // every question asked by any account
        const k = key(b.q); if (!k) break;
        const q = d.questions[k] || (d.questions[k] = { q: clip(b.q, 300), count: 0, answered: 0, unanswered: 0, users: [], last: now });
        q.count++; q.last = now; b.answered ? q.answered++ : q.unanswered++;
        if (!q.users.includes(user)) q.users.push(user);
        if (Object.keys(d.questions).length > 2000) { // keep the file small
          const old = Object.entries(d.questions).sort((a, c) => a[1].last.localeCompare(c[1].last)).slice(0, 200); old.forEach(([kk]) => delete d.questions[kk]);
        }
        break;
      }
      case "teach": {
        const q = clip(b.q, 300), a = clip(b.a, 1000);
        if (q.length < 3 || a.length < 2) return { status: 400, body: { error: "Question and answer are required." } };
        const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), q, a, by: user, at: now, uses: 0, helpful: 0, unhelpful: 0 };
        if (isAdmin) { d.facts = d.facts.filter((f) => key(f.q) !== key(q)); d.facts.push(item); msg = "learned"; }
        else { d.pending.push(item); msg = "pending"; }
        if (isAdmin) resolveSimilar(d, q);
        break;
      }
      case "approve": case "reject": {
        if (!isAdmin) return { status: 403, body: { error: "Only Admin or Super Admin can review." } };
        const it = d.pending.find((p) => p.id === b.id); if (!it) return { status: 404, body: { error: "Not found." } };
        d.pending = d.pending.filter((p) => p.id !== b.id);
        if (b.action === "approve") { d.facts = d.facts.filter((f) => key(f.q) !== key(it.q)); d.facts.push({ ...it, approvedBy: user, at: now }); resolveSimilar(d, it.q); }
        break;
      }
      case "delete": {
        if (!isAdmin) return { status: 403, body: { error: "Only Admin or Super Admin can delete." } };
        d.facts = d.facts.filter((f) => f.id !== b.id); break;
      }
      case "dismiss": { // remove an unanswered question from the list
        if (!isAdmin) return { status: 403, body: { error: "Only Admin or Super Admin can dismiss." } };
        const k = key(b.q); if (d.questions[k]) d.questions[k].resolved = true; break;
      }
      case "used": case "feedback": {
        const f = d.facts.find((x) => x.id === b.id); if (!f) break;
        if (b.action === "used") f.uses++; else b.good ? f.helpful++ : f.unhelpful++;
        break;
      }
      default: return { status: 400, body: { error: "Unknown action." } };
    }
    await store(d);
    return { status: 200, body: { ok: true, result: msg, ...view(d) } };
  };
  const p = lock.then(run); lock = p.catch(() => {});   // serialize writes
  const out = await p;
  return Response.json(out.body, { status: out.status });
}
