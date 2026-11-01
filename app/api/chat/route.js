// Optional AI answers for the in-app assistant.
// Enable by creating .env.local next to package.json with:
//   ANTHROPIC_API_KEY=your-key
//   ANTHROPIC_MODEL=claude-sonnet-5-5   (optional)
// then rebuild. The key stays on the server; the browser never sees it.
export const dynamic = "force-dynamic";

const SYSTEM = `You are the YAKAP Assistant inside Sunga Hospital's PhilHealth YAKAP / eKonsulta clinic web app (a mock system with dummy data).
Help staff use the app: modules are Dashboard, Clinic Accreditation, Documents & Physicians, EMR Configuration, Patient Registration, FPE & Health Profile, YES & Empanelment, Consultation, Diagnostics & Referral, Medicine, PhilHealth Payments, EMR Submission, Audit & Reports, Masterlist Uploader, User Accounts.
Use the JSON "context" for current counts and statuses; never invent numbers that are not in it. Respect the user's role and modules they can access.
Statuses in this app are internal, not official PhilHealth codes. Do not state PhilHealth rules as fact unless general and well known; suggest confirming with PhilHealth.
Do not diagnose or give treatment decisions; clinical decisions belong to the attending physician. Keep answers short and practical (under 120 words).
The context may include "memoryNotes": facts this user previously asked you to remember. Use them when relevant and treat them as the user's own notes. The conversation history is restored from earlier sessions.
"sharedKnowledge" holds answers the clinic taught the assistant (learned from all accounts); prefer them when they fit the question.`;

export async function GET() {
  return Response.json({ enabled: Boolean(process.env.ANTHROPIC_API_KEY) });
}

export async function POST(req) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "AI answers are not enabled on this server." }, { status: 503 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  const msgs = Array.isArray(body.messages) ? body.messages : [];
  const clean = msgs
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length || clean[clean.length - 1].role !== "user") return Response.json({ error: "No question received." }, { status: 400 });
  const context = JSON.stringify(body.context ?? {}).slice(0, 4000);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: 500, system: SYSTEM + "\n\ncontext: " + context, messages: clean }),
    });
    const d = await r.json();
    if (!r.ok) return Response.json({ error: "AI service error: " + (d?.error?.message || r.status) }, { status: 502 });
    const text = (d.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
    return Response.json({ text: text || "(no answer)" });
  } catch {
    return Response.json({ error: "Could not reach the AI service." }, { status: 502 });
  }
}
