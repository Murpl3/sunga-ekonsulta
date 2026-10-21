"use client";
import React, { useState, useContext, createContext, useEffect, useRef } from "react";
import {
  ChevronDown, Search, Trash2, CheckCircle2, AlertTriangle, X, Upload, Home, UserPlus,
  Stethoscope, ClipboardList, FlaskConical, Pill, FileText, ExternalLink, Plus, ChevronLeft, ChevronRight,
  Menu, Palette, Check as CheckIcon, Info, UploadCloud, ShieldCheck, Activity, Users, Clock, FileCheck,
  Wallet, Building2, FolderOpen, Server, HeartHandshake, Send, History, Share2,
} from "lucide-react";

/* ---------- constants ---------- */
const HOSPITAL = "SUNGA HOSPITAL";
const HOSPITAL_ADDR = "Digos City, Davao del Sur";
const USERNAME = "NVILLANUEVA";
const ROLE = "Data Encoder / Nurse";
const GAMOT_URL = "https://example.com/yakap-gamot"; // placeholder: replace with your GAMOT website
const VERSION = "01.09.00.202501";

/* ---------- helpers ---------- */
const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const isFuture = (iso) => !!iso && iso > todayISO();
const inQuarter = (iso) => {
  if (!iso) return false;
  const t = new Date(todayISO()), d = new Date(iso);
  return t.getFullYear() === d.getFullYear() && Math.floor(t.getMonth() / 3) === Math.floor(d.getMonth() / 3);
};
const calcAge = (iso) => {
  if (!iso) return null;
  const t = new Date(todayISO()), d = new Date(iso);
  let a = t.getFullYear() - d.getFullYear();
  if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
  return a;
};
const bmiOf = (h, w) => { const H = parseFloat(h), W = parseFloat(w); return H > 0 && W > 0 ? +(W / ((H / 100) ** 2)).toFixed(1) : null; };
const bmiLabel = (b) => b == null ? "—" : b < 18.5 ? "Underweight" : b < 25 ? "Normal" : b < 30 ? "Overweight" : "Obese";
const fullName = (c) => `${c.last}, ${c.first}${c.ext ? " " + c.ext : ""}${c.middle ? " " + c.middle : ""}`.toUpperCase();
const headerDate = () => new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }) + " - " + new Date().toLocaleDateString("en-US", { weekday: "long" });
const clone = (o) => JSON.parse(JSON.stringify(o));
const daysUntil = (iso) => Math.round((new Date(iso) - new Date(todayISO())) / 86400000);
const addDays = (n) => { const d = new Date(todayISO()); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
let uid = 100;
const nid = () => ++uid;

const GEO = {
  "DAVAO DEL SUR": { "DIGOS CITY": { zip: "8002", brgys: ["ZONE 1", "ZONE 2", "ZONE 3", "MATTI", "SAN JOSE"] }, "BANSALAN": { zip: "8005", brgys: ["POBLACION", "ALEGRE", "KINURI"] } },
  "DAVAO DEL NORTE": { "TAGUM CITY": { zip: "8100", brgys: ["APOKON", "MAGUGPO EAST", "VISAYAN VILLAGE"] }, "PANABO CITY": { zip: "8105", brgys: ["GREDU", "NEW VISAYAS", "SOUTHERN DAVAO"] } },
};
const TYPES = { MM: "Member", DD: "Dependent", NM: "Non-Member" };
const DISEASES = [["001", "Allergy"], ["002", "Asthma"], ["003", "Cancer"], ["004", "Cerebrovascular disease"], ["005", "Coronary artery disease"], ["006", "Diabetes mellitus"], ["007", "Emphysema"], ["008", "Epilepsy / seizure"], ["009", "Hepatitis"], ["010", "Hyperlipidemia"], ["011", "Hypertension"], ["012", "Peptic ulcer"], ["013", "Pneumonia"], ["014", "Thyroid disease"], ["015", "Tuberculosis"], ["016", "Urinary tract infection"]];
const PE = [["skin", "Skin"], ["heent", "HEENT"], ["chest", "Chest / Lungs"], ["heart", "Heart"], ["abdomen", "Abdomen"], ["extremities", "Extremities"], ["neuro", "Neurologic"], ["gu", "Genitourinary"]];
const LABS = {
  FBS: { name: "Fasting Blood Sugar", unit: "mg/dL", lo: 70, hi: 100, conv: 18.02, unit2: "mmol/L" },
  CHOL: { name: "Total Cholesterol", unit: "mg/dL", lo: 0, hi: 200 },
  CREA: { name: "Creatinine", unit: "mg/dL", lo: 0.6, hi: 1.3 },
  HGB: { name: "Hemoglobin", unit: "g/dL", lo: 12, hi: 17.5 },
  UA: { name: "Urinalysis", unit: "", text: true },
  CXR: { name: "Chest X-ray", unit: "", text: true },
};
const DRUGS = ["Amlodipine 5 mg tablet", "Losartan 50 mg tablet", "Metformin 500 mg tablet", "Paracetamol 500 mg tablet", "Simvastatin 20 mg tablet", "Salbutamol 2 mg tablet", "Amoxicillin 500 mg capsule"];
const MGMT = ["Lifestyle modification", "Dietary counseling", "Smoking cessation", "Exercise regimen", "Refer to specialist", "Follow-up in 1 month"];

const mk = (id, last, first, middle, dob, sex, type, extra = {}) => ({
  id, pin: type === "NM" ? "" : `12-0${String(50000000 + id * 7919).slice(0, 8)}-${id % 10}`, last, first, middle, ext: "", dob, sex, type, civil: "Married",
  mobile: "0917" + String(1000000 + id * 3571).slice(0, 7), prov: "DAVAO DEL SUR", mun: "DIGOS CITY", brgy: "ZONE 1", zip: "8002", consent: true, loa: true,
  regDate: todayISO(), hsa: null, consults: [], labs: [], meds: [], emp: null, sub: null, referrals: [], fpeStarted: false, ...extra,
});
const NORMAL_PE = Object.fromEntries(PE.map(([k]) => [k, ["NORMAL"]]));
const SEED_HSA = { date: todayISO(), hx: ["011"], fam: [], smoke: "N", alcohol: "N", v: { height: "168", weight: "70", sys: "130", dia: "84", hr: "76", rr: "18", temp: "36.7" }, pe: NORMAL_PE, ob: { g: "", p: "", lmp: "" }, risk: { diet: false, activity: false, bpHigh: false, polyuria: false }, labs: [], mgmt: [], notes: "" };
const SEED_RX = [{ drug: "Amlodipine 5 mg tablet", qty: 30, sig: "1 tab OD", dispensed: true }];
const SEED_CONSULT = { date: todayISO(), cc: "Follow-up hypertension", hpi: "Controlled on medication, no complaints.", v: { sys: "130", dia: "84", temp: "36.7" }, pe: NORMAL_PE, dx: "Essential hypertension", icd: "I10", meds: SEED_RX, advice: "Low-salt diet; follow-up in 1 month" };
const SEED = [
  mk(1, "Dela Cruz", "Juan", "Santos", "1968-03-14", "M", "MM", { hsa: SEED_HSA, fpeStarted: true, emp: { choice: "YES", agree: true, date: todayISO(), verified: true }, consults: [SEED_CONSULT], meds: SEED_RX }),
  mk(2, "Reyes", "Maria", "Garcia", "1975-07-22", "F", "MM", { hsa: { ...SEED_HSA, ob: { g: "2", p: "2", lmp: addDays(-20) } }, fpeStarted: true }),
  mk(3, "Bautista", "Pedro", "Lim", "1990-11-02", "M", "MM", { fpeStarted: true }),
  mk(4, "Aquino", "Liza", "Mendoza", "2016-05-30", "F", "DD"),
  mk(5, "Castillo", "Ramon", "Tan", "1959-01-09", "M", "MM"),
  mk(6, "Villanueva", "Ana", "Cruz", "1984-09-18", "F", "NM"),
];

/* ---------- Clinic accreditation data & rules ---------- */
const DOC_TYPES = ["PDR", "Performance Commitment", "SAT"];
const CHECKLIST = [
  ["permit", "Business / mayor's permit on file"], ["signage", "Clinic signage displayed"], ["room", "Consultation room with patient privacy"],
  ["equip", "Examination equipment (BP apparatus, scale, thermometer)"], ["dispense", "Medicine storage / dispensing area"], ["net", "Reliable internet connection"],
];
const INITIAL_CLINIC = {
  stage: "prep", decision: null,
  checklist: { permit: true, signage: true, room: true, equip: false, dispense: false, net: true },
  docs: [
    { id: 1, type: "PDR", ref: "PDR-2026-014", issued: addDays(-200), expires: addDays(165) },
    { id: 2, type: "Performance Commitment", ref: "PC-2026-007", issued: addDays(-330), expires: addDays(35) },
  ],
  physicians: [{ id: 1, name: "Dr. Maria L. Santos", prc: "0098231", specialty: "Family Medicine", expiry: addDays(400) }, { id: 2, name: "Dr. Antonio R. Luna", prc: "0087710", specialty: "Internal Medicine", expiry: addDays(20) }],
  emr: { vendor: "", certNo: "", certVerified: false, verifiedBy: "", providerId: "", endpoint: "", connected: false, lastTest: "" },
};
const docStatus = (d) => { const n = daysUntil(d.expires); return n < 0 ? "Expired" : n <= 60 ? "Expiring" : "Valid"; };
const physStatus = (p) => docStatus({ expires: p.expiry });
function clinicBlockers(c) {
  const b = [];
  CHECKLIST.forEach(([k, l]) => { if (!c.checklist[k]) b.push(`Checklist: ${l}`); });
  DOC_TYPES.forEach((t) => { const d = c.docs.filter((x) => x.type === t); if (!d.length) b.push(`Missing document: ${t}`); else if (!d.some((x) => docStatus(x) !== "Expired")) b.push(`Expired document: ${t}`); });
  if (!c.physicians.some((p) => physStatus(p) !== "Expired")) b.push("No physician with a valid PRC license");
  if (!c.emr.certVerified) b.push("EMR certification not verified");
  if (!c.emr.connected) b.push("EMR connectivity not tested");
  return b;
}
const readiness = (c) => { const total = CHECKLIST.length + DOC_TYPES.length + 3; return Math.round(((total - clinicBlockers(c).length) / total) * 100); };
function clinicStatus(c) {
  if (c.stage === "approved") return clinicBlockers(c).some((x) => x.startsWith("Expired") || x.startsWith("Missing") || x.startsWith("No physician")) ? "Action Required" : "Approval Verified";
  if (c.stage === "returned") return "Action Required";
  return c.stage === "submitted" ? "Application Submitted" : "In Preparation";
}
const gateReason = (c) => clinicStatus(c) !== "Approval Verified" ? "Clinic approval is not verified" : !c.emr.connected ? "EMR connectivity has not been tested" : "";

/* ---------- Patient status & EMR validation ---------- */
function patientStatus(c) {
  if (c.consults.length) return "Consultation Completed";
  if (c.emp && c.emp.choice === "YES" && c.emp.verified) return "Ready for Care";
  if (c.hsa) return "Awaiting Empanelment";
  return c.fpeStarted ? "FPE In Progress" : "Registered";
}
function validateRecord(c) {
  const e = [];
  if (c.type !== "NM" && !/^\d{2}-\d{9}-\d$/.test(c.pin)) e.push("Invalid or missing PhilHealth PIN");
  if (!c.hsa) e.push("First patient encounter not completed");
  if (!(c.emp && c.emp.choice === "YES" && c.emp.verified)) e.push("Empanelment (YES) not verified");
  const k = c.consults[c.consults.length - 1];
  if (k) { if (!/^[A-Z]\d{2}(\.\d{1,2})?$/.test(k.icd)) e.push("Consultation ICD-10 code invalid"); if (!k.v.sys || !k.v.dia) e.push("Consultation vitals incomplete"); }
  return e;
}
function subStatus(c) {
  if (!c.consults.length) return "Draft";
  if (c.sub && c.sub.ack) return "Acknowledged";
  if (c.sub && c.sub.rejected) return "Validation Failed";
  if (c.sub && c.sub.submittedAt) return "Pending Acknowledgment";
  return validateRecord(c).length ? "Validation Failed" : "Ready to Submit";
}

const AppCtx = createContext({ toast: () => {}, log: () => {} });
const useToast = () => useContext(AppCtx).toast;
const useLog = () => useContext(AppCtx).log;

/* ---------- UI primitives ---------- */
const BTN = {
  green: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm", white: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200",
  info: "bg-slate-800 hover:bg-slate-900 text-white shadow-sm", primary: "bg-[var(--accent)] hover:bg-[var(--accent-h)] text-white shadow-sm",
  warning: "bg-amber-500 hover:bg-amber-600 text-white", danger: "bg-rose-600 hover:bg-rose-700 text-white",
};
function Btn({ v = "primary", className = "", ...p }) {
  return <button type="button" {...p} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${BTN[v]} ${className}`} />;
}
const inp = (err) => `w-full border rounded-lg px-3 py-2 text-sm bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent)] disabled:bg-slate-50 disabled:text-slate-500 ${err ? "border-rose-400" : "border-slate-200"}`;
function F({ label, req, err, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-slate-500 mb-1.5">{label}{req && <span className="text-red-500"> *</span>}</span>
      {children}
      {err && <span className="block text-xs text-red-600 mt-0.5">{err}</span>}
    </label>
  );
}
function Notice({ kind = "error", children }) {
  const c = kind === "error" ? "bg-rose-50 border-rose-200 text-rose-700" : kind === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-600";
  const I = kind === "ok" ? CheckCircle2 : AlertTriangle;
  return <div className={`flex gap-2 items-start border rounded-lg px-3 py-2.5 text-sm ${c}`}><I size={16} className="mt-0.5 shrink-0" /><div>{children}</div></div>;
}
function Panel({ title, right, children }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 mb-5">
      <header className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between"><h2 className="font-semibold text-sm text-slate-800 flex items-center gap-2"><span className="w-1 h-4 rounded bg-[var(--accent)]" />{title}</h2><div className="text-xs text-slate-500">{right}</div></header>
      <div className="p-5">{children}</div>
    </section>
  );
}
function ConfirmModal({ title, text, onYes, onNo, yes = "Yes" }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5">
        <h3 className="font-semibold mb-2">{title}</h3><p className="text-sm text-gray-600 mb-4">{text}</p>
        <div className="flex justify-end gap-2"><Btn v="white" onClick={onNo}>Cancel</Btn><Btn v="green" onClick={onYes}>{yes}</Btn></div>
      </div>
    </div>
  );
}
function Check({ checked, onChange, label, disabled }) {
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={disabled} checked={!!checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}
function Radios({ value, onChange, options }) {
  return <div className="flex gap-4 flex-wrap">{options.map(([v, l]) => <label key={v} className="flex items-center gap-1.5 text-sm"><input type="radio" checked={value === v} onChange={() => onChange(v)} />{l}</label>)}</div>;
}
function ClientPicker({ clients, value, onChange, filter = () => true }) {
  const [q, setQ] = useState("");
  const list = clients.filter(filter).filter((c) => (fullName(c) + c.pin).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mb-4">
      <div className="flex gap-2 mb-2"><div className="relative flex-1"><Search size={14} className="absolute left-2 top-2.5 text-gray-400" /><input className={inp() + " pl-7"} placeholder="Search name or PIN" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
      <div className="max-h-44 overflow-auto border rounded divide-y">
        {list.length === 0 && <div className="p-3 text-sm text-gray-500">No client found.</div>}
        {list.map((c) => (
          <button key={c.id} type="button" onClick={() => onChange(c.id)} className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--accent-soft)] ${value === c.id ? "bg-[var(--accent-soft)]" : ""}`}>
            <span className="font-medium">{fullName(c)}</span> <span className="text-gray-500">· {c.pin || "No PIN"} · {calcAge(c.dob)} y/o · {c.sex}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
function Table({ cols, rows, empty = "No records." }) {
  return (
    <div className="overflow-auto border border-slate-200 rounded-lg">
      <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr>{cols.map((c) => <th key={c} className="text-left px-3 py-2.5 font-medium">{c}</th>)}</tr></thead>
        <tbody>{rows.length === 0 ? <tr><td colSpan={cols.length} className="p-4 text-center text-gray-500">{empty}</td></tr> :
          rows.map((r, i) => <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">{r.map((x, j) => <td key={j} className="px-3 py-2">{x}</td>)}</tr>)}</tbody></table>
    </div>
  );
}
function Steps({ labels, idx, onGo }) {
  return <div className="flex flex-wrap gap-1 mb-5 border-b border-slate-200">{labels.map((l, i) => (
    <button key={l} type="button" onClick={() => onGo(i)} className={`px-3 py-2 text-sm border-b-2 ${i === idx ? "border-[var(--accent)] text-[var(--accent)] font-semibold" : "border-transparent text-gray-500 hover:text-gray-800"}`}>{i + 1}. {l}</button>
  ))}</div>;
}

/* ---------- shared forms ---------- */
function Vitals({ v, set, age }) {
  const bmi = bmiOf(v.height, v.weight);
  const num = (k, label, ph) => <F label={label} key={k}><input className={inp()} inputMode="decimal" placeholder={ph} value={v[k] || ""} onChange={(e) => set(k, e.target.value.replace(/[^0-9.]/g, ""))} /></F>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {num("height", "Height (cm)", "165")}{num("weight", "Weight (kg)", "62")}
      <F label="BMI"><div className="px-2 py-1.5 text-sm bg-slate-50 rounded-lg border border-slate-200">{bmi ?? "—"} <span className="text-gray-500">({bmiLabel(bmi)})</span></div></F>
      {num("sys", "Systolic BP", "120")}{num("dia", "Diastolic BP", "80")}{num("hr", "Heart rate (/min)", "76")}{num("rr", "Resp. rate (/min)", "18")}{num("temp", "Temp (°C)", "36.8")}
      {age != null && age < 5 && <>{num("head", "Head circumference (cm)", "")}{num("muac", "MUAC (cm)", "")}</>}
    </div>
  );
}
function togglePE(pe, key, opt, on) {
  const cur = new Set(pe[key] || []);
  if (on) { if (opt === "NORMAL" || opt === "NA") { cur.clear(); } else { cur.delete("NORMAL"); cur.delete("NA"); } cur.add(opt); } else cur.delete(opt);
  return { ...pe, [key]: [...cur] };
}
function PEForm({ pe, setPe }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {PE.map(([k, l]) => (
        <div key={k} className="border rounded p-3"><div className="font-semibold text-sm mb-2">{l}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[["NORMAL", "Essentially normal"], ["ABN", "With abnormality"], ["NA", "Not applicable"]].map(([o, ol]) => <Check key={o} checked={(pe[k] || []).includes(o)} onChange={(on) => setPe(togglePE(pe, k, o, on))} label={ol} />)}
          </div></div>
      ))}
    </div>
  );
}
function MedsEditor({ meds, setMeds }) {
  const [d, setD] = useState({ drug: "", qty: "", sig: "" });
  const [err, setErr] = useState("");
  const add = () => {
    if (!d.drug) return setErr("Please select a medicine.");
    if (!d.qty || +d.qty <= 0) return setErr("Please enter a valid quantity.");
    if (!d.sig.trim()) return setErr("Please enter dosage / instructions.");
    if (meds.some((m) => m.drug === d.drug)) return setErr("Medicine already added.");
    setMeds([...meds, { ...d, qty: +d.qty, dispensed: false }]); setD({ drug: "", qty: "", sig: "" }); setErr("");
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-2"><span className="text-sm font-semibold">Prescription</span>
        <a href={GAMOT_URL} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent)] flex items-center gap-1 hover:underline">Check YAKAP GAMOT list <ExternalLink size={12} /></a></div>
      <div className="grid md:grid-cols-4 gap-2 items-end">
        <F label="Medicine"><select className={inp()} value={d.drug} onChange={(e) => setD({ ...d, drug: e.target.value })}><option value="">-- Select --</option>{DRUGS.map((x) => <option key={x}>{x}</option>)}</select></F>
        <F label="Qty"><input className={inp()} inputMode="numeric" value={d.qty} onChange={(e) => setD({ ...d, qty: e.target.value.replace(/\D/g, "") })} /></F>
        <F label="Instructions"><input className={inp()} placeholder="1 tab OD" value={d.sig} onChange={(e) => setD({ ...d, sig: e.target.value })} /></F>
        <Btn v="green" onClick={add}><Plus size={14} />Add</Btn>
      </div>
      {err && <div className="mt-2"><Notice>{err}</Notice></div>}
      <div className="mt-3"><Table cols={["Medicine", "Qty", "Instructions", ""]} rows={meds.map((m, i) => [m.drug, m.qty, m.sig, <button key={i} type="button" onClick={() => setMeds(meds.filter((_, j) => j !== i))} className="text-red-600"><Trash2 size={14} /></button>])} empty="No medicines added." /></div>
    </div>
  );
}

/* ---------- Home ---------- */
function Stat({ icon: I, label, n, hint, tone }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
      <div className={`p-2 rounded-xl ${tone === "bad" ? "bg-rose-100 text-rose-600" : "bg-[var(--accent-soft)] text-[var(--accent)]"}`}><I size={18} /></div>
      <div><div className="text-2xl font-semibold leading-none">{n}</div><div className="text-xs text-slate-500 mt-1">{label}</div>{hint && <div className="text-[11px] text-slate-400">{hint}</div>}</div>
    </div>
  );
}
function HomeModule({ clients, go, clinic, onSync }) {
  const st = clinicStatus(clinic);
  const rows = clients.filter((c) => c.hsa || c.consults.length || c.fpeStarted);
  const cnt = (f) => clients.filter(f).length;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: "var(--banner)" }}>
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/20 mb-2">PhilHealth YAKAP Clinic · eKonsulta</span>
          <h2 className="text-xl font-bold tracking-tight">{HOSPITAL}</h2>
          <p className="text-sm opacity-80 mt-1 max-w-xl">Clinic accreditation status: <b>{st}</b> · Readiness {readiness(clinic)}%. Accreditation and patient workflows are tracked separately.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => go("reg")} className="inline-flex items-center gap-2 bg-white text-slate-800 font-medium px-4 py-2 rounded-xl text-sm hover:bg-slate-100"><Plus size={14} />New client</button>
          <button type="button" onClick={() => go("clinic")} className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 font-medium px-4 py-2 rounded-xl text-sm"><Building2 size={14} />Accreditation</button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Building2} label="Clinic readiness" n={readiness(clinic) + "%"} hint={st} tone={st === "Action Required" ? "bad" : ""} />
        <Stat icon={Users} label="Registered clients" n={clients.length} />
        <Stat icon={ClipboardList} label="Pending FPEs" n={cnt((c) => !c.hsa)} hint={`${cnt((c) => patientStatus(c) === "Awaiting Empanelment")} awaiting empanelment`} />
        <Stat icon={AlertTriangle} label="Submission errors" n={cnt((c) => subStatus(c) === "Validation Failed")} hint={`${cnt((c) => subStatus(c) === "Pending Acknowledgment")} pending acknowledgment`} tone={cnt((c) => subStatus(c) === "Validation Failed") ? "bad" : ""} />
      </div>
      <Panel title="PATIENT ENCOUNTERS" right={<button type="button" onClick={onSync} className="underline">Submit all ready records</button>}>
        <Table cols={["Client", "Type", "Encounter status", "EMR status"]} rows={rows.map((c) => [fullName(c), TYPES[c.type], <Badge key={c.id} s={patientStatus(c)} />, <Badge key={"s" + c.id} s={subStatus(c)} />])} empty="No encounters yet." />
      </Panel>
    </div>
  );
}

/* ---------- Registration ---------- */
function validateReg(f) {
  const e = {};
  if (!f.type) e.type = "Select patient type.";
  if (!f.last.trim()) e.last = "Last name is required.";
  if (!f.first.trim()) e.first = "First name is required.";
  if (!f.dob) e.dob = "Date of birth is required."; else if (isFuture(f.dob)) e.dob = "Date of birth cannot be in the future.";
  if (!f.sex) e.sex = "Select sex.";
  if (!f.civil) e.civil = "Select civil status.";
  if (f.type !== "NM" && !/^\d{2}-\d{9}-\d$/.test(f.pin)) e.pin = "PIN format: 12-345678901-2.";
  if (!/^09\d{9}$/.test(f.mobile)) e.mobile = "Mobile must be 11 digits starting with 09.";
  if (!f.prov) e.prov = "Select province."; else if (!f.mun) e.mun = "Select municipality."; else if (!f.brgy) e.brgy = "Select barangay.";
  if (!f.regDate) e.regDate = "Required."; else if (!inQuarter(f.regDate) || isFuture(f.regDate)) e.regDate = "Registration date must fall within the current quarter and not be in the future.";
  if (!f.consent) e.consent = "Patient consent is required.";
  if (!f.loa) e.loa = "Letter of Authorization is required.";
  return e;
}
const BLANK = { type: "", pin: "", last: "", first: "", middle: "", ext: "", dob: "", sex: "", civil: "", mobile: "", prov: "", mun: "", brgy: "", zip: "", consent: false, loa: false, regDate: todayISO() };
function RegistrationModule({ clients, setClients, go }) {
  const toast = useToast(); const log = useLog();
  const [f, setF] = useState(BLANK);
  const [err, setErr] = useState({});
  const [msg, setMsg] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const muns = f.prov ? Object.keys(GEO[f.prov]) : [];
  const brgys = f.prov && f.mun ? GEO[f.prov][f.mun].brgys : [];
  const save = () => {
    const e = validateReg(f); setErr(e);
    if (Object.keys(e).length) return setMsg("");
    if (f.pin && clients.some((c) => c.pin === f.pin)) { setErr({ pin: "PIN already registered." }); return; }
    setClients((p) => [...p, { ...mk(nid(), f.last, f.first, f.middle, f.dob, f.sex, f.type), ...f }]);
    setMsg(`${f.last.toUpperCase()}, ${f.first.toUpperCase()} registered successfully.`); toast(`${f.last.toUpperCase()}, ${f.first.toUpperCase()} registered.`); log("Client registered", `${f.last.toUpperCase()}, ${f.first.toUpperCase()}`); setF(BLANK);
  };
  const t = (k, label, req, extra = {}) => <F label={label} req={req} err={err[k]}><input className={inp(err[k])} value={f[k]} onChange={(e) => set(k, extra.up ? e.target.value.toUpperCase() : e.target.value)} {...extra.p} /></F>;
  return (
    <div>
      {msg && <div className="mb-3"><Notice kind="ok">{msg}</Notice></div>}
      <Panel title="CLIENT REGISTRATION" right={<span className="text-xs">{headerDate()}</span>}>
        <div className="grid md:grid-cols-4 gap-3">
          <F label="Patient type" req err={err.type}><select className={inp(err.type)} value={f.type} onChange={(e) => set("type", e.target.value)}><option value="">-- Select --</option>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{k} - {v}</option>)}</select></F>
          {f.type !== "NM" && t("pin", "PhilHealth PIN", true, { p: { placeholder: "12-345678901-2" } })}
          <F label="Date registered" req err={err.regDate}><input type="date" className={inp(err.regDate)} value={f.regDate} onChange={(e) => set("regDate", e.target.value)} /></F>
          <div />
          {t("last", "Last name", true, { up: 1 })}{t("first", "First name", true, { up: 1 })}{t("middle", "Middle name", false, { up: 1 })}{t("ext", "Extension", false, { up: 1, p: { placeholder: "JR, SR, III" } })}
          <F label="Date of birth" req err={err.dob}><input type="date" className={inp(err.dob)} value={f.dob} onChange={(e) => set("dob", e.target.value)} /></F>
          <F label="Age"><div className="px-2 py-1.5 text-sm bg-slate-50 rounded-lg border border-slate-200">{f.dob && !isFuture(f.dob) ? calcAge(f.dob) : "—"}</div></F>
          <F label="Sex" req err={err.sex}><select className={inp(err.sex)} value={f.sex} onChange={(e) => set("sex", e.target.value)}><option value="">-- Select --</option><option value="M">Male</option><option value="F">Female</option></select></F>
          <F label="Civil status" req err={err.civil}><select className={inp(err.civil)} value={f.civil} onChange={(e) => set("civil", e.target.value)}><option value="">-- Select --</option>{["Single", "Married", "Widowed", "Separated", "Annulled"].map((x) => <option key={x}>{x}</option>)}</select></F>
          {t("mobile", "Mobile no.", true, { p: { inputMode: "numeric", maxLength: 11, placeholder: "09XXXXXXXXX" } })}
          <F label="Province" req err={err.prov}><select className={inp(err.prov)} value={f.prov} onChange={(e) => setF((p) => ({ ...p, prov: e.target.value, mun: "", brgy: "", zip: "" }))}><option value="">-- Select --</option>{Object.keys(GEO).map((x) => <option key={x}>{x}</option>)}</select></F>
          <F label="Municipality" req err={err.mun}><select className={inp(err.mun)} value={f.mun} disabled={!f.prov} onChange={(e) => setF((p) => ({ ...p, mun: e.target.value, brgy: "", zip: e.target.value ? GEO[p.prov][e.target.value].zip : "" }))}><option value="">-- Select --</option>{muns.map((x) => <option key={x}>{x}</option>)}</select></F>
          <F label="Barangay" req err={err.brgy}><select className={inp(err.brgy)} value={f.brgy} disabled={!f.mun} onChange={(e) => set("brgy", e.target.value)}><option value="">-- Select --</option>{brgys.map((x) => <option key={x}>{x}</option>)}</select></F>
          <F label="Zip code"><div className="px-2 py-1.5 text-sm bg-slate-50 rounded-lg border border-slate-200">{f.zip || "—"}</div></F>
        </div>
        <div className="mt-4 space-y-1">
          <Check checked={f.consent} onChange={(v) => set("consent", v)} label="Patient consent obtained (Data Privacy)" />{err.consent && <div className="text-xs text-red-600">{err.consent}</div>}
          <Check checked={f.loa} onChange={(v) => set("loa", v)} label="Letter of Authorization (LOA) on file" />{err.loa && <div className="text-xs text-red-600">{err.loa}</div>}
        </div>
        <div className="mt-4 flex gap-2"><Btn v="green" onClick={save}>Save</Btn><Btn v="white" onClick={() => { setF(BLANK); setErr({}); }}>Clear</Btn><Btn v="info" onClick={() => go("hsa")}>Go to Health Screening</Btn></div>
      </Panel>
      <Panel title="REGISTERED CLIENTS"><Table cols={["PIN", "Name", "Type", "Age/Sex", "Address", "HSA"]} rows={clients.map((c) => [c.pin || "—", fullName(c), TYPES[c.type], `${calcAge(c.dob)} / ${c.sex}`, `${c.brgy}, ${c.mun}`, c.hsa ? "Done" : "Pending"])} /></Panel>
    </div>
  );
}

/* ---------- HSA ---------- */
const HSA_TABS = ["Medical History", "Vitals", "Physical Exam", "OB History", "Risk Screening", "Diagnostics", "Management", "Review"];
const blankHsa = () => ({ date: todayISO(), hx: [], fam: [], smoke: "", alcohol: "", v: {}, pe: {}, ob: { g: "", p: "", lmp: "" }, risk: { diet: false, activity: false, bpHigh: false, polyuria: false }, labs: [], mgmt: [], notes: "" });
function hsaTabErr(h, i, c) {
  const age = calcAge(c.dob);
  if (i === 0) { if (!h.smoke) return "Select smoking status."; if (!h.alcohol) return "Select alcohol intake."; }
  if (i === 1) { const v = h.v; if (!v.height || !v.weight) return "Height and weight are required."; if (!v.sys || !v.dia) return "Blood pressure is required."; if (+v.sys <= +v.dia) return "Systolic must be higher than diastolic."; if (!v.hr || !v.rr || !v.temp) return "Heart rate, respiratory rate and temperature are required."; }
  if (i === 2) { const miss = PE.find(([k]) => !(h.pe[k] || []).length); if (miss) return `Physical exam: select an option for ${miss[1]}.`; }
  if (i === 3) { if (!h.ob.g || !h.ob.p) return "Enter gravidity and parity."; if (+h.ob.p > +h.ob.g) return "Parity cannot exceed gravidity."; if (!h.ob.lmp) return "Last menstrual period is required."; if (isFuture(h.ob.lmp)) return "LMP cannot be in the future."; }
  return "";
}
const obApplies = (c) => c.sex === "F" && calcAge(c.dob) >= 10;
function HSAModule({ clients, setClients }) {
  const [sel, setSel] = useState(null);
  const c = clients.find((x) => x.id === sel);
  return (
    <div>
      {!c ? <Panel title="HEALTH SCREENING & ASSESSMENT (FIRST PATIENT ENCOUNTER)"><ClientPicker clients={clients} value={sel} onChange={setSel} /></Panel>
        : <HSAWizard key={c.id} c={c} back={() => setSel(null)} started={() => setClients((p) => p.map((x) => x.id === c.id && !x.fpeStarted ? { ...x, fpeStarted: true } : x))} save={(h) => setClients((p) => p.map((x) => x.id === c.id ? { ...x, hsa: h, labs: [...x.labs, ...h.labs.map((l) => ({ ...l, id: nid(), date: h.date, result: "", flag: "" }))] } : x))} />}
    </div>
  );
}
function HSAWizard({ c, back, save, started }) {
  const toast = useToast(); const log = useLog();
  const [h, setH] = useState(c.hsa ? clone(c.hsa) : blankHsa());
  const [i, setI] = useState(0);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [ask, setAsk] = useState(false);
  const locked = !!c.hsa || done;
  const age = calcAge(c.dob);
  const visible = HSA_TABS.map((t, k) => k).filter((k) => k !== 3 || obApplies(c));
  const pos = visible.indexOf(i);
  const upd = (k, v) => setH((p) => ({ ...p, [k]: v }));
  const go = (dir) => {
    if (dir > 0) { const e = hsaTabErr(h, i, c); if (e && !locked) return setErr(e); }
    setErr(""); if (dir > 0 && started) started(); const n = visible[pos + dir]; if (n != null) setI(n);
  };
  const final = () => { for (const k of visible) { if (k > 4) break; const e = hsaTabErr(h, k, c); if (e) { setI(k); return setErr(e); } } setErr(""); setAsk(true); };
  const toggleList = (key, code, on) => upd(key, on ? [...h[key], code] : h[key].filter((x) => x !== code));
  return (
    <Panel title={`HSA — ${fullName(c)} (${age} y/o, ${c.sex})`} right={<button type="button" onClick={back} className="text-xs underline">Change client</button>}>
      {locked && <div className="mb-3"><Notice kind="info">Health screening already saved for this client (read-only).</Notice></div>}
      <Steps labels={HSA_TABS.filter((_, k) => visible.includes(k))} idx={pos} onGo={(p) => setI(visible[p])} />
      <fieldset disabled={locked} className="space-y-4">
        {i === 0 && <>
          <div><div className="text-sm font-semibold mb-1">Past medical history</div><div className="grid grid-cols-2 md:grid-cols-4 gap-1">{DISEASES.map(([k, l]) => <Check key={k} checked={h.hx.includes(k)} onChange={(on) => toggleList("hx", k, on)} label={l} />)}</div></div>
          <div><div className="text-sm font-semibold mb-1">Family history</div><div className="grid grid-cols-2 md:grid-cols-4 gap-1">{DISEASES.map(([k, l]) => <Check key={k} checked={h.fam.includes(k)} onChange={(on) => toggleList("fam", k, on)} label={l} />)}</div></div>
          <div className="grid md:grid-cols-2 gap-3">
            <F label="Smoking" req><Radios value={h.smoke} onChange={(v) => upd("smoke", v)} options={[["Y", "Current"], ["F", "Former"], ["N", "Never"]]} /></F>
            <F label="Alcohol intake" req><Radios value={h.alcohol} onChange={(v) => upd("alcohol", v)} options={[["Y", "Yes"], ["N", "No"]]} /></F>
          </div></>}
        {i === 1 && <Vitals v={h.v} set={(k, v) => upd("v", { ...h.v, [k]: v })} age={age} />}
        {i === 2 && <PEForm pe={h.pe} setPe={(pe) => upd("pe", pe)} />}
        {i === 3 && <div className="grid md:grid-cols-3 gap-3">
          <F label="Gravidity" req><input className={inp()} inputMode="numeric" value={h.ob.g} onChange={(e) => upd("ob", { ...h.ob, g: e.target.value.replace(/\D/g, "") })} /></F>
          <F label="Parity" req><input className={inp()} inputMode="numeric" value={h.ob.p} onChange={(e) => upd("ob", { ...h.ob, p: e.target.value.replace(/\D/g, "") })} /></F>
          <F label="LMP" req><input type="date" className={inp()} value={h.ob.lmp} onChange={(e) => upd("ob", { ...h.ob, lmp: e.target.value })} /></F></div>}
        {i === 4 && <div className="space-y-1"><Check checked={h.risk.diet} onChange={(v) => upd("risk", { ...h.risk, diet: v })} label="High-fat / high-salt diet" /><Check checked={h.risk.activity} onChange={(v) => upd("risk", { ...h.risk, activity: v })} label="Sedentary (less than 150 min activity/week)" /><Check checked={h.risk.bpHigh} onChange={(v) => upd("risk", { ...h.risk, bpHigh: v })} label="Known elevated BP" /><Check checked={h.risk.polyuria} onChange={(v) => upd("risk", { ...h.risk, polyuria: v })} label="Polyuria / polydipsia / polyphagia" />
          {age >= 18 && <div className="text-xs text-gray-500 pt-2">Adults (18+) are eligible for NCD risk laboratory tests in the next tab.</div>}</div>}
        {i === 5 && <div><div className="text-sm font-semibold mb-1">Order diagnostic examinations</div><div className="grid grid-cols-2 md:grid-cols-3 gap-1">{Object.entries(LABS).map(([k, l]) => <Check key={k} checked={h.labs.some((x) => x.test === k)} onChange={(on) => upd("labs", on ? [...h.labs, { test: k }] : h.labs.filter((x) => x.test !== k))} label={l.name} />)}</div></div>}
        {i === 6 && <div className="space-y-3"><div className="grid grid-cols-2 md:grid-cols-3 gap-1">{MGMT.map((m) => <Check key={m} checked={h.mgmt.includes(m)} onChange={(on) => toggleList("mgmt", m, on)} label={m} />)}</div><F label="Notes"><textarea rows={3} className={inp()} value={h.notes} onChange={(e) => upd("notes", e.target.value)} /></F></div>}
        {i === 7 && <div className="text-sm space-y-1"><div><b>Client:</b> {fullName(c)}</div><div><b>BMI:</b> {bmiOf(h.v.height, h.v.weight) ?? "—"} ({bmiLabel(bmiOf(h.v.height, h.v.weight))})</div><div><b>BP:</b> {h.v.sys}/{h.v.dia}</div><div><b>History:</b> {h.hx.length} condition(s)</div><div><b>Labs ordered:</b> {h.labs.map((l) => LABS[l.test].name).join(", ") || "None"}</div><div><b>Management:</b> {h.mgmt.join(", ") || "None"}</div></div>}
      </fieldset>
      {err && <div className="mt-3"><Notice>{err}</Notice></div>}
      {done && <div className="mt-3"><Notice kind="ok">Health screening saved.</Notice></div>}
      <div className="mt-4 flex justify-between">
        <Btn v="white" disabled={pos === 0} onClick={() => go(-1)}><ChevronLeft size={14} />Previous</Btn>
        {pos < visible.length - 1 ? <Btn v="info" onClick={() => go(1)}>Next<ChevronRight size={14} /></Btn> : !locked && <Btn v="green" onClick={final}>Save HSA</Btn>}
      </div>
      {ask && <ConfirmModal title="Save health screening?" text="After saving this record can no longer be edited." onNo={() => setAsk(false)} onYes={() => { save(h); setDone(true); setAsk(false); toast("Health screening saved."); log("FPE saved", fullName(c)); }} />}
    </Panel>
  );
}

/* ---------- Consultation ---------- */
const C_TABS = ["Subjective", "Objective (Vitals)", "Objective (PE)", "Assessment", "Plan / Rx", "Review"];
const blankC = () => ({ date: todayISO(), cc: "", hpi: "", v: {}, pe: {}, dx: "", icd: "", meds: [], advice: "" });
function cErr(f, i) {
  if (i === 0) { if (!f.cc.trim()) return "Chief complaint is required."; if (f.hpi.trim().length < 10) return "History of present illness must be at least 10 characters."; }
  if (i === 1) { if (!f.v.sys || !f.v.dia) return "Blood pressure is required."; if (+f.v.sys <= +f.v.dia) return "Systolic must be higher than diastolic."; if (!f.v.temp) return "Temperature is required."; }
  if (i === 2) { const m = PE.find(([k]) => !(f.pe[k] || []).length); if (m) return `Select an exam option for ${m[1]}.`; }
  if (i === 3) { if (!f.dx.trim()) return "Diagnosis is required."; if (!/^[A-Z]\d{2}(\.\d{1,2})?$/.test(f.icd.trim())) return "Enter a valid ICD-10 code (e.g. I10)."; }
  if (i === 4) { if (!f.advice.trim()) return "Enter advice / plan."; }
  return "";
}
function ConsultModule({ clients, setClients }) {
  const [sel, setSel] = useState(null);
  const c = clients.find((x) => x.id === sel);
  return !c ? <Panel title="CONSULTATION"><Notice kind="info">Only clients with a completed Health Screening and a verified YES empanelment can be consulted (status: Ready for Care).</Notice><div className="mt-3"><ClientPicker clients={clients} filter={(x) => x.hsa && x.emp && x.emp.choice === "YES" && x.emp.verified} value={sel} onChange={setSel} /></div></Panel>
    : <ConsultWizard key={c.id} c={c} back={() => setSel(null)} save={(f) => setClients((p) => p.map((x) => x.id === c.id ? { ...x, consults: [...x.consults, f], meds: [...x.meds, ...f.meds] } : x))} />;
}
function ConsultWizard({ c, back, save }) {
  const toast = useToast(); const log = useLog();
  const [f, setF] = useState(blankC());
  const [i, setI] = useState(0);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const upd = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const next = () => { const e = cErr(f, i); if (e) return setErr(e); setErr(""); setI(i + 1); };
  const finish = () => { for (let k = 0; k < 5; k++) { const e = cErr(f, k); if (e) { setI(k); return setErr(e); } } setErr(""); save(f); setDone(true); toast("Consultation saved."); log("Consultation saved", fullName(c)); };
  return (
    <Panel title={`CONSULTATION — ${fullName(c)}`} right={<button type="button" onClick={back} className="text-xs underline">Change client</button>}>
      <Steps labels={C_TABS} idx={i} onGo={setI} />
      <fieldset disabled={done} className="space-y-3">
        {i === 0 && <><F label="Chief complaint" req><input className={inp()} value={f.cc} onChange={(e) => upd("cc", e.target.value)} /></F><F label="History of present illness" req><textarea rows={4} className={inp()} value={f.hpi} onChange={(e) => upd("hpi", e.target.value)} /></F></>}
        {i === 1 && <Vitals v={f.v} set={(k, v) => upd("v", { ...f.v, [k]: v })} age={calcAge(c.dob)} />}
        {i === 2 && <PEForm pe={f.pe} setPe={(pe) => upd("pe", pe)} />}
        {i === 3 && <div className="grid md:grid-cols-3 gap-3"><F label="Diagnosis" req className="md:col-span-2"><input className={inp()} value={f.dx} onChange={(e) => upd("dx", e.target.value)} /></F><F label="ICD-10" req><input className={inp()} placeholder="I10" value={f.icd} onChange={(e) => upd("icd", e.target.value.toUpperCase())} /></F></div>}
        {i === 4 && <><F label="Advice / plan" req><textarea rows={3} className={inp()} value={f.advice} onChange={(e) => upd("advice", e.target.value)} /></F><MedsEditor meds={f.meds} setMeds={(m) => upd("meds", m)} /></>}
        {i === 5 && <div className="text-sm space-y-1"><div><b>CC:</b> {f.cc}</div><div><b>BP:</b> {f.v.sys}/{f.v.dia}</div><div><b>Dx:</b> {f.dx} ({f.icd})</div><div><b>Rx:</b> {f.meds.map((m) => m.drug).join(", ") || "None"}</div></div>}
      </fieldset>
      {err && <div className="mt-3"><Notice>{err}</Notice></div>}
      {done && <div className="mt-3"><Notice kind="ok">Consultation saved. Prescriptions sent to Medicine module.</Notice></div>}
      <div className="mt-4 flex justify-between"><Btn v="white" disabled={i === 0} onClick={() => { setErr(""); setI(i - 1); }}><ChevronLeft size={14} />Previous</Btn>
        {i < 5 ? <Btn v="info" onClick={next}>Next<ChevronRight size={14} /></Btn> : !done && <Btn v="green" onClick={finish}>Save consultation</Btn>}</div>
    </Panel>
  );
}

/* ---------- Laboratory ---------- */
function LabRow({ l, onSave }) {
  const cfg = LABS[l.test];
  const [val, setVal] = useState(l.result);
  const [mm, setMm] = useState(false);
  const [err, setErr] = useState("");
  const flagOf = (x) => { if (cfg.text) return x ? "Reported" : ""; let n = parseFloat(x); if (isNaN(n)) return ""; if (mm && cfg.conv) n = n * cfg.conv; return n < cfg.lo ? "LOW" : n > cfg.hi ? "HIGH" : "NORMAL"; };
  const fl = flagOf(val);
  const conv = cfg.conv && val && !isNaN(parseFloat(val)) ? (mm ? `${(parseFloat(val) * cfg.conv).toFixed(1)} mg/dL` : `${(parseFloat(val) / cfg.conv).toFixed(1)} mmol/L`) : "";
  const save = () => { if (!val.trim()) return setErr("Enter a result."); if (!cfg.text && isNaN(parseFloat(val))) return setErr("Result must be numeric."); setErr(""); onSave(val, fl); };
  return (
    <tr className="border-t align-top">
      <td className="px-3 py-2">{cfg.name}</td>
      <td className="px-3 py-2"><div className="flex gap-2 items-center"><input className={inp(err) + " max-w-[140px]"} value={val} onChange={(e) => setVal(e.target.value)} />
        {cfg.conv && <select className="border rounded text-xs p-1" value={mm ? "m" : "g"} onChange={(e) => setMm(e.target.value === "m")}><option value="g">{cfg.unit}</option><option value="m">{cfg.unit2}</option></select>}</div>{err && <div className="text-xs text-red-600">{err}</div>}{conv && <div className="text-xs text-gray-500">≈ {conv}</div>}</td>
      <td className="px-3 py-2">{fl && <span className={`px-2 py-0.5 rounded text-xs ${fl === "NORMAL" || fl === "Reported" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{fl}</span>}</td>
      <td className="px-3 py-2"><Btn v="green" onClick={save}>Save</Btn></td>
    </tr>
  );
}
function LabModule({ clients, setClients }) {
  const toast = useToast();
  const [sel, setSel] = useState(null);
  const c = clients.find((x) => x.id === sel);
  const setLab = (id, result, flag) => { toast("Lab result saved."); setClients((p) => p.map((x) => x.id === sel ? { ...x, labs: x.labs.map((l) => l.id === id ? { ...l, result, flag } : l) } : x)); };
  return (
    <Panel title="LABORATORY / IMAGING RESULTS">
      <ClientPicker clients={clients} filter={(x) => x.labs.length} value={sel} onChange={setSel} />
      {c && <div className="overflow-auto border rounded"><table className="w-full text-sm"><thead className="bg-gray-100"><tr>{["Test", "Result", "Flag", ""].map((t) => <th key={t} className="text-left px-3 py-2">{t}</th>)}</tr></thead><tbody>{c.labs.map((l) => <LabRow key={l.id} l={l} onSave={(r, f) => setLab(l.id, r, f)} />)}</tbody></table></div>}
    </Panel>
  );
}

/* ---------- Medicine ---------- */
function MedicineModule({ clients, setClients }) {
  const toast = useToast(); const log = useLog();
  const rows = clients.flatMap((c) => c.meds.map((m, k) => ({ c, m, k })));
  const disp = (cid, k) => { toast("Medicine dispensed."); log("Medicine dispensed", ""); setClients((p) => p.map((x) => x.id === cid ? { ...x, meds: x.meds.map((m, j) => j === k ? { ...m, dispensed: true } : m) } : x)); };
  return (
    <Panel title="MEDICINE DISPENSING">
      <div className="mb-3"><a href={GAMOT_URL} target="_blank" rel="noreferrer" className="text-sm text-[var(--accent)] inline-flex items-center gap-1 hover:underline">YAKAP GAMOT formulary <ExternalLink size={12} /></a></div>
      <Table cols={["Client", "Medicine", "Qty", "Instructions", "Status"]} rows={rows.map(({ c, m, k }) => [fullName(c), m.drug, m.qty, m.sig, m.dispensed ? <span className="text-green-700">Dispensed</span> : <Btn key={k} v="green" onClick={() => disp(c.id, k)}>Dispense</Btn>])} empty="No prescriptions yet." />
    </Panel>
  );
}

/* ---------- Reports & Uploader ---------- */
function ReportsModule({ clients, kind }) {
  const [group, setGroup] = useState("all");
  const [msg, setMsg] = useState("");
  const rows = clients.filter((c) => group === "all" || c.type === group);
  return (
    <Panel title={`REPORTS — ${kind}`}>
      <div className="flex gap-2 items-end mb-3"><F label="Group"><select className={inp()} value={group} onChange={(e) => setGroup(e.target.value)}><option value="all">All</option>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></F>
        <Btn v="green" onClick={() => setMsg(`${kind} report generated for ${rows.length} client(s). (Mock — no file is created.)`)}>Generate</Btn></div>
      {msg && <div className="mb-3"><Notice kind="ok">{msg}</Notice></div>}
      <Table cols={["Name", "Type", "HSA", "Consultations"]} rows={rows.map((c) => [fullName(c), TYPES[c.type], c.hsa ? "Yes" : "No", c.consults.length])} />
    </Panel>
  );
}
function UploaderModule() {
  const [name, setName] = useState(""); const [msg, setMsg] = useState("");
  return (
    <Panel title="MASTERLIST UPLOADER">
      <F label="Select masterlist file (.xlsx / .csv)"><input type="file" accept=".xlsx,.csv" className={inp()} onChange={(e) => { setName(e.target.files?.[0]?.name || ""); setMsg(""); }} /></F>
      <div className="mt-3"><Btn v="green" onClick={() => setMsg(name ? `"${name}" accepted. (Mock — nothing was uploaded.)` : "")} disabled={!name}><Upload size={14} />Upload</Btn></div>
      {msg && <div className="mt-3"><Notice kind="ok">{msg}</Notice></div>}
    </Panel>
  );
}

/* ---------- Clinic accreditation ---------- */
const BADGE2 = { "In Preparation": "bg-slate-100 text-slate-600", "Application Submitted": "bg-sky-100 text-sky-700", "Approval Verified": "bg-emerald-100 text-emerald-700", "Action Required": "bg-rose-100 text-rose-700", Valid: "bg-emerald-100 text-emerald-700", Expiring: "bg-amber-100 text-amber-700", Expired: "bg-rose-100 text-rose-700", Missing: "bg-rose-100 text-rose-700", Registered: "bg-slate-100 text-slate-600", "FPE In Progress": "bg-sky-100 text-sky-700", "Awaiting Empanelment": "bg-amber-100 text-amber-700", "Ready for Care": "bg-teal-100 text-teal-700", "Consultation Completed": "bg-emerald-100 text-emerald-700", Draft: "bg-slate-100 text-slate-600", "Validation Failed": "bg-rose-100 text-rose-700", "Ready to Submit": "bg-sky-100 text-sky-700", "Pending Acknowledgment": "bg-amber-100 text-amber-700", Acknowledged: "bg-emerald-100 text-emerald-700" };
function Badge({ s }) { return <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${BADGE2[s] || "bg-slate-100 text-slate-600"}`}>{s}</span>; }

function ClinicModule({ clinic, setClinic }) {
  const toast = useToast(), log = useLog();
  const [d, setD] = useState({ result: "", ref: "", date: todayISO(), remarks: "" });
  const [err, setErr] = useState("");
  const st = clinicStatus(clinic), blockers = clinicBlockers(clinic), pct = readiness(clinic);
  const tick = (k, v) => { setClinic((p) => ({ ...p, checklist: { ...p.checklist, [k]: v } })); log("Clinic checklist", `${k} → ${v ? "done" : "open"}`); };
  const submit = () => { if (blockers.length) return setErr("Resolve all blockers before submitting."); setErr(""); setClinic((p) => ({ ...p, stage: "submitted" })); log("Accreditation", "Application submitted to PhilHealth (recorded)"); toast("Application marked as submitted."); };
  const decide = () => {
    if (clinic.stage === "prep") return setErr("Submit the application first.");
    if (!d.result) return setErr("Select the PhilHealth decision.");
    if (!d.date || isFuture(d.date)) return setErr("Decision date is required and cannot be in the future.");
    if (d.result === "approved" && !d.ref.trim()) return setErr("Enter the official approval reference number from PhilHealth.");
    if (d.result === "returned" && !d.remarks.trim()) return setErr("Enter the pending items or corrections requested.");
    setErr(""); setClinic((p) => ({ ...p, stage: d.result, decision: { ...d } })); log("Accreditation", `PhilHealth decision recorded: ${d.result}`); toast("Decision recorded.");
  };
  return (
    <div>
      <Panel title="CLINIC ACCREDITATION" right={<Badge s={st} />}>
        <Notice kind="info">Internal readiness checklist only. Passing it does not mean PhilHealth has approved the clinic; approval is recorded below only from PhilHealth's official decision.</Notice>
        <div className="mt-4 flex items-center gap-3"><div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-[var(--accent)]" style={{ width: pct + "%" }} /></div><span className="text-sm font-semibold">{pct}% ready</span></div>
        <div className="mt-4 grid md:grid-cols-2 gap-2">{CHECKLIST.map(([k, l]) => <Check key={k} checked={clinic.checklist[k]} onChange={(v) => tick(k, v)} label={l} />)}</div>
        <div className="mt-4"><div className="text-xs font-medium text-slate-500 mb-1">Open items ({blockers.length})</div>{blockers.length ? <ul className="text-sm text-rose-700 list-disc pl-5 space-y-0.5">{blockers.map((b) => <li key={b}>{b}</li>)}</ul> : <div className="text-sm text-emerald-700">All internal requirements met.</div>}</div>
        <div className="mt-4"><Btn v="green" disabled={clinic.stage !== "prep" && clinic.stage !== "returned"} onClick={submit}><Send size={14} />Submit accreditation application</Btn></div>
      </Panel>
      <Panel title="OFFICIAL PHILHEALTH DECISION">
        {clinic.decision && <div className="mb-3 text-sm text-slate-600">Last recorded: <b>{clinic.decision.result}</b> on {clinic.decision.date}{clinic.decision.ref && ` · Ref ${clinic.decision.ref}`}{clinic.decision.remarks && ` · ${clinic.decision.remarks}`}</div>}
        <div className="grid md:grid-cols-4 gap-3">
          <F label="Decision"><select className={inp()} value={d.result} onChange={(e) => setD({ ...d, result: e.target.value })}><option value="">-- Select --</option><option value="approved">Approved</option><option value="returned">Returned for corrections</option></select></F>
          <F label="Reference no."><input className={inp()} value={d.ref} onChange={(e) => setD({ ...d, ref: e.target.value })} /></F>
          <F label="Decision date"><input type="date" className={inp()} value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} /></F>
          <F label="Remarks / pending items"><input className={inp()} value={d.remarks} onChange={(e) => setD({ ...d, remarks: e.target.value })} /></F>
        </div>
        {err && <div className="mt-3"><Notice>{err}</Notice></div>}
        <div className="mt-3"><Btn onClick={decide}>Record decision</Btn></div>
      </Panel>
    </div>
  );
}

function DocsModule({ clinic, setClinic }) {
  const toast = useToast(), log = useLog();
  const [d, setD] = useState({ type: "", ref: "", issued: "", expires: "" });
  const [ph, setPh] = useState({ name: "", prc: "", specialty: "", expiry: "" });
  const [e1, setE1] = useState(""), [e2, setE2] = useState("");
  const addDoc = () => {
    if (!d.type) return setE1("Select document type."); if (!d.ref.trim()) return setE1("Reference number is required.");
    if (!d.issued || isFuture(d.issued)) return setE1("Issue date is required and cannot be in the future.");
    if (!d.expires || d.expires <= d.issued) return setE1("Expiry must be after the issue date.");
    setClinic((p) => ({ ...p, docs: [...p.docs, { ...d, id: nid() }] })); log("Document added", `${d.type} ${d.ref}`); toast("Document recorded."); setD({ type: "", ref: "", issued: "", expires: "" }); setE1("");
  };
  const addPh = () => {
    if (!ph.name.trim()) return setE2("Physician name is required."); if (!/^\d{6,8}$/.test(ph.prc)) return setE2("PRC license must be 6–8 digits.");
    if (clinic.physicians.some((x) => x.prc === ph.prc)) return setE2("PRC number already on the roster.");
    if (!ph.expiry) return setE2("License expiry is required.");
    setClinic((p) => ({ ...p, physicians: [...p.physicians, { ...ph, id: nid() }] })); log("Physician added", ph.name); toast("Physician added."); setPh({ name: "", prc: "", specialty: "", expiry: "" }); setE2("");
  };
  const missing = DOC_TYPES.filter((t) => !clinic.docs.some((x) => x.type === t));
  return (
    <div>
      <Panel title="ACCREDITATION DOCUMENTS">
        {missing.map((m) => <div key={m} className="mb-2"><Notice>Missing required document: {m}</Notice></div>)}
        <div className="grid md:grid-cols-5 gap-2 items-end mb-3">
          <F label="Type"><select className={inp()} value={d.type} onChange={(e) => setD({ ...d, type: e.target.value })}><option value="">-- Select --</option>{DOC_TYPES.map((t) => <option key={t}>{t}</option>)}</select></F>
          <F label="Reference no."><input className={inp()} value={d.ref} onChange={(e) => setD({ ...d, ref: e.target.value })} /></F>
          <F label="Issued"><input type="date" className={inp()} value={d.issued} onChange={(e) => setD({ ...d, issued: e.target.value })} /></F>
          <F label="Expires"><input type="date" className={inp()} value={d.expires} onChange={(e) => setD({ ...d, expires: e.target.value })} /></F>
          <Btn v="green" onClick={addDoc}><Plus size={14} />Add</Btn>
        </div>
        {e1 && <div className="mb-3"><Notice>{e1}</Notice></div>}
        <Table cols={["Type", "Reference", "Issued", "Expires", "Status", ""]} rows={clinic.docs.map((x) => [x.type, x.ref, x.issued, x.expires, <Badge key={x.id} s={docStatus(x)} />, <button key={"d" + x.id} type="button" onClick={() => { setClinic((p) => ({ ...p, docs: p.docs.filter((y) => y.id !== x.id) })); log("Document removed", x.ref); }} className="text-rose-600"><Trash2 size={14} /></button>])} empty="No documents." />
      </Panel>
      <Panel title="PHYSICIAN ROSTER">
        <div className="grid md:grid-cols-5 gap-2 items-end mb-3">
          <F label="Name"><input className={inp()} value={ph.name} onChange={(e) => setPh({ ...ph, name: e.target.value })} /></F>
          <F label="PRC no."><input className={inp()} inputMode="numeric" value={ph.prc} onChange={(e) => setPh({ ...ph, prc: e.target.value.replace(/\D/g, "") })} /></F>
          <F label="Specialty"><input className={inp()} value={ph.specialty} onChange={(e) => setPh({ ...ph, specialty: e.target.value })} /></F>
          <F label="License expiry"><input type="date" className={inp()} value={ph.expiry} onChange={(e) => setPh({ ...ph, expiry: e.target.value })} /></F>
          <Btn v="green" onClick={addPh}><Plus size={14} />Add</Btn>
        </div>
        {e2 && <div className="mb-3"><Notice>{e2}</Notice></div>}
        <Table cols={["Physician", "PRC", "Specialty", "Expiry", "Status", ""]} rows={clinic.physicians.map((x) => [x.name, x.prc, x.specialty || "—", x.expiry, <Badge key={x.id} s={physStatus(x)} />, <button key={"p" + x.id} type="button" onClick={() => { setClinic((p) => ({ ...p, physicians: p.physicians.filter((y) => y.id !== x.id) })); log("Physician removed", x.name); }} className="text-rose-600"><Trash2 size={14} /></button>])} />
      </Panel>
    </div>
  );
}

function EmrConfigModule({ clinic, setClinic }) {
  const toast = useToast(), log = useLog();
  const e = clinic.emr;
  const [err, setErr] = useState("");
  const [testing, setTesting] = useState(false);
  const set = (k, v) => setClinic((p) => ({ ...p, emr: { ...p.emr, [k]: v, ...(k === "certNo" || k === "endpoint" ? { certVerified: false, connected: false } : {}) } }));
  const verify = () => { if (!e.vendor.trim() || !e.certNo.trim()) return setErr("Enter the EMR vendor and certification number first."); if (!e.verifiedBy.trim()) return setErr("Enter who verified the certification."); setErr(""); setClinic((p) => ({ ...p, emr: { ...p.emr, certVerified: true } })); log("EMR", "Certification marked verified"); toast("Certification marked verified."); };
  const test = () => {
    if (!e.certVerified) return setErr("Verify the EMR certification before testing connectivity.");
    if (!/^https?:\/\//.test(e.endpoint)) return setErr("Endpoint must start with http:// or https://");
    if (!e.providerId.trim()) return setErr("Provider / facility ID is required.");
    setErr(""); setTesting(true);
    setTimeout(() => { setClinic((p) => ({ ...p, emr: { ...p.emr, connected: true, lastTest: new Date().toLocaleString() } })); setTesting(false); log("EMR", "Connectivity test passed (simulated)"); toast("Connectivity test passed (simulated)."); }, 900);
  };
  return (
    <Panel title="EMR CONFIGURATION" right={<span>{e.connected ? "Connected (simulated)" : "Not connected"}</span>}>
      <Notice kind="info">Simulation only. A real deployment must use the certified EMR / PhilHealth interface; this screen never contacts PhilHealth.</Notice>
      <div className="mt-4 grid md:grid-cols-3 gap-3">
        <F label="EMR vendor / system"><input className={inp()} value={e.vendor} onChange={(x) => set("vendor", x.target.value)} /></F>
        <F label="Certification no."><input className={inp()} value={e.certNo} onChange={(x) => set("certNo", x.target.value)} /></F>
        <F label="Verified by"><input className={inp()} value={e.verifiedBy} onChange={(x) => set("verifiedBy", x.target.value)} /></F>
        <F label="Provider / facility ID"><input className={inp()} value={e.providerId} onChange={(x) => set("providerId", x.target.value)} /></F>
        <F label="Integration endpoint" className="md:col-span-2"><input className={inp()} placeholder="https://" value={e.endpoint} onChange={(x) => set("endpoint", x.target.value)} /></F>
      </div>
      {err && <div className="mt-3"><Notice>{err}</Notice></div>}
      <div className="mt-4 flex gap-2 items-center flex-wrap"><Btn v="info" onClick={verify}><ShieldCheck size={14} />{e.certVerified ? "Certification verified" : "Mark certification verified"}</Btn><Btn v="green" disabled={testing} onClick={test}><Server size={14} />{testing ? "Testing…" : "Test connectivity"}</Btn>{e.lastTest && <span className="text-xs text-slate-500">Last test: {e.lastTest}</span>}</div>
    </Panel>
  );
}

/* ---------- Empanelment ---------- */
function EmpForm({ c, save }) {
  const toast = useToast();
  const [f, setF] = useState(c.emp ? { choice: c.emp.choice, agree: c.emp.agree, date: c.emp.date } : { choice: "", agree: false, date: todayISO() });
  const [err, setErr] = useState(""); const [msg, setMsg] = useState("");
  const rec = () => {
    if (!f.choice) return setErr("Record the patient's choice (YES or NO).");
    if (!f.date || isFuture(f.date)) return setErr("Date is required and cannot be in the future.");
    if (f.choice === "YES" && !f.agree) return setErr("The signed YES / empanelment agreement must be confirmed.");
    setErr(""); save({ ...f, verified: false }, "Empanelment recorded"); toast("Patient choice recorded.");
  };
  const verify = () => {
    if (!c.emp) return setErr("Record the patient's choice first.");
    if (c.emp.choice !== "YES") return setMsg("Patient chose NO: not empanelled. Resolve eligibility or refer appropriately.");
    if (c.type === "NM") return setMsg("Non-member: eligibility must be resolved (confirm membership) before empanelment can be verified.");
    if (!/^\d{2}-\d{9}-\d$/.test(c.pin)) return setMsg("PhilHealth PIN is invalid; correct the registration record.");
    setErr(""); setMsg(""); save({ ...c.emp, verified: true }, "Empanelment status verified (simulated)"); toast("Empanelment status verified (simulated).");
  };
  return (
    <Panel title={`YES & EMPANELMENT — ${fullName(c)}`} right={<Badge s={patientStatus(c)} />}>
      <div className="grid md:grid-cols-3 gap-3">
        <F label="Patient choice" req><Radios value={f.choice} onChange={(v) => setF({ ...f, choice: v })} options={[["YES", "YES — empanel with this clinic"], ["NO", "NO"]]} /></F>
        <F label="Date recorded" req><input type="date" className={inp()} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></F>
        <div className="pt-5"><Check checked={f.agree} onChange={(v) => setF({ ...f, agree: v })} label="Signed agreement on file" /></div>
      </div>
      {err && <div className="mt-3"><Notice>{err}</Notice></div>}
      {msg && <div className="mt-3"><Notice kind="info">{msg}</Notice></div>}
      {c.emp && c.emp.verified && <div className="mt-3"><Notice kind="ok">Empanelment verified. Patient is ready for consultation.</Notice></div>}
      <div className="mt-4 flex gap-2"><Btn v="green" onClick={rec}>Record choice</Btn><Btn v="info" onClick={verify}>Verify status</Btn></div>
    </Panel>
  );
}
function EmpModule({ clients, setClients }) {
  const [sel, setSel] = useState(null); const log = useLog();
  const c = clients.find((x) => x.id === sel);
  const save = (emp, what) => { setClients((p) => p.map((x) => x.id === sel ? { ...x, emp } : x)); log(what, fullName(c)); };
  return (
    <div>
      <Panel title="SELECT CLIENT"><Notice kind="info">Only clients with a completed first patient encounter can be empanelled.</Notice><div className="mt-3"><ClientPicker clients={clients} filter={(x) => x.hsa} value={sel} onChange={setSel} /></div></Panel>
      {c && <EmpForm key={c.id + JSON.stringify(c.emp)} c={c} save={save} />}
    </div>
  );
}

/* ---------- Diagnostics & referral ---------- */
const REFERRAL_DEST = ["Provincial Hospital — Internal Medicine", "Provincial Hospital — Ophthalmology", "Provincial Hospital — OB-Gyne", "Provincial Hospital — Pediatrics", "Higher-level facility (specify in reason)"];
function DiagnosticsModule({ clients, setClients }) {
  const [tab, setTab] = useState("orders"); const toast = useToast(), log = useLog();
  const [sel, setSel] = useState(null); const [pick, setPick] = useState([]); const [err, setErr] = useState("");
  const [r, setR] = useState({ dest: "", reason: "", urgency: "Routine", follow: "" });
  const c = clients.find((x) => x.id === sel);
  const orderLabs = () => {
    if (!pick.length) return setErr("Select at least one test.");
    setErr(""); setClients((p) => p.map((x) => x.id === sel ? { ...x, labs: [...x.labs, ...pick.map((t) => ({ id: nid(), test: t, date: todayISO(), result: "", flag: "" }))] } : x));
    log("Diagnostics ordered", `${fullName(c)}: ${pick.join(", ")}`); toast("Orders added."); setPick([]);
  };
  const addRef = () => {
    if (!r.dest) return setErr("Select a referral destination."); if (r.reason.trim().length < 5) return setErr("Enter the reason for referral.");
    if (!r.follow || r.follow < todayISO()) return setErr("Follow-up date is required and cannot be in the past.");
    setErr(""); setClients((p) => p.map((x) => x.id === sel ? { ...x, referrals: [...x.referrals, { id: nid(), ...r, status: "Pending" }] } : x));
    log("Referral created", `${fullName(c)} → ${r.dest}`); toast("Referral saved."); setR({ dest: "", reason: "", urgency: "Routine", follow: "" });
  };
  const allRefs = clients.flatMap((x) => x.referrals.map((y) => ({ x, y })));
  const setRefStatus = (cid, rid, status) => { setClients((p) => p.map((x) => x.id === cid ? { ...x, referrals: x.referrals.map((y) => y.id === rid ? { ...y, status } : y) } : x)); log("Referral status", status); };
  return (
    <div>
      <div className="flex gap-1 mb-4 border-b border-slate-200">{[["orders", "Orders"], ["results", "Results"], ["refer", "Referrals & follow-up"]].map(([k, l]) => <button key={k} type="button" onClick={() => { setTab(k); setErr(""); }} className={`px-3 py-2 text-sm border-b-2 ${tab === k ? "border-[var(--accent)] text-[var(--accent)] font-semibold" : "border-transparent text-slate-500"}`}>{l}</button>)}</div>
      {tab === "results" && <LabModule clients={clients} setClients={setClients} />}
      {tab !== "results" && <Panel title="SELECT CLIENT"><ClientPicker clients={clients} filter={(x) => x.hsa} value={sel} onChange={setSel} /></Panel>}
      {tab === "orders" && c && <Panel title={`ORDER DIAGNOSTICS — ${fullName(c)}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">{Object.entries(LABS).map(([k, l]) => <Check key={k} checked={pick.includes(k)} onChange={(on) => setPick(on ? [...pick, k] : pick.filter((x) => x !== k))} label={l.name} />)}</div>
        {err && <div className="mt-3"><Notice>{err}</Notice></div>}
        <div className="mt-3"><Btn v="green" onClick={orderLabs}>Add orders</Btn></div>
        <div className="mt-4"><Table cols={["Test", "Ordered", "Result", "Flag"]} rows={c.labs.map((l) => [LABS[l.test].name, l.date, l.result || "Pending", l.flag || "—"])} empty="No orders yet." /></div></Panel>}
      {tab === "refer" && <>
        {c && <Panel title={`NEW REFERRAL — ${fullName(c)}`}>
          <div className="grid md:grid-cols-4 gap-3">
            <F label="Destination" req><select className={inp()} value={r.dest} onChange={(e) => setR({ ...r, dest: e.target.value })}><option value="">-- Select --</option>{REFERRAL_DEST.map((x) => <option key={x}>{x}</option>)}</select></F>
            <F label="Urgency"><select className={inp()} value={r.urgency} onChange={(e) => setR({ ...r, urgency: e.target.value })}><option>Routine</option><option>Urgent</option></select></F>
            <F label="Follow-up date" req><input type="date" className={inp()} value={r.follow} onChange={(e) => setR({ ...r, follow: e.target.value })} /></F>
            <F label="Reason" req><input className={inp()} value={r.reason} onChange={(e) => setR({ ...r, reason: e.target.value })} /></F>
          </div>
          {err && <div className="mt-3"><Notice>{err}</Notice></div>}
          <div className="mt-3"><Btn v="green" onClick={addRef}>Save referral</Btn></div></Panel>}
        <Panel title="ALL REFERRALS"><Table cols={["Client", "Destination", "Urgency", "Follow-up", "Status"]} rows={allRefs.map(({ x, y }) => [fullName(x), y.dest, y.urgency, y.follow, <select key={y.id} className="border rounded-lg text-xs p-1 bg-white" value={y.status} onChange={(e) => setRefStatus(x.id, y.id, e.target.value)}><option>Pending</option><option>Seen</option><option>Closed</option></select>])} empty="No referrals." /></Panel></>}
    </div>
  );
}

/* ---------- EMR submission ---------- */
function SubmissionModule({ clients, setClients, clinic }) {
  const toast = useToast(), log = useLog();
  const rows = clients.filter((c) => c.hsa || c.consults.length);
  const gate = gateReason(clinic);
  const upd = (id, fn, what) => { setClients((p) => p.map((x) => x.id === id ? { ...x, sub: fn(x.sub || {}) } : x)); log(what, clients.find((x) => x.id === id) ? fullName(clients.find((x) => x.id === id)) : ""); };
  const submit = (c) => { if (gate) return toast(`Blocked: ${gate}.`, "error"); upd(c.id, () => ({ submittedAt: todayISO(), ref: "SUB-" + nid() }), "EMR record submitted"); toast("Submitted. Awaiting acknowledgment."); };
  return (
    <Panel title="EMR VALIDATION & SUBMISSION">
      {gate && <div className="mb-3"><Notice>Submission blocked: {gate}. Complete Clinic Accreditation and EMR Configuration first.</Notice></div>}
      <Notice kind="info">Statuses shown are internal application statuses, not official PhilHealth codes. A real integration must map them to statuses returned by the certified EMR / PhilHealth interface. Acknowledgment and rejection buttons are simulations.</Notice>
      <div className="mt-4 overflow-auto border border-slate-200 rounded-lg"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr>{["Client", "Encounter", "EMR status", "Validation / notes", "Actions"].map((h) => <th key={h} className="text-left px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
        <tbody>{rows.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-500">No encounters to submit.</td></tr>}
          {rows.map((c) => { const st = subStatus(c), errs = validateRecord(c); return (
            <tr key={c.id} className="border-t border-slate-100 align-top">
              <td className="px-3 py-2">{fullName(c)}</td><td className="px-3 py-2"><Badge s={patientStatus(c)} /></td><td className="px-3 py-2"><Badge s={st} /></td>
              <td className="px-3 py-2 text-xs">{c.sub && c.sub.rejected ? <span className="text-rose-700">{c.sub.rejected}</span> : c.sub && c.sub.ack ? <span className="text-emerald-700">Receipt {c.sub.receipt}</span> : c.consults.length && errs.length ? <ul className="text-rose-700 list-disc pl-4">{errs.map((e) => <li key={e}>{e}</li>)}</ul> : c.consults.length ? "No validation errors." : "Awaiting consultation."}</td>
              <td className="px-3 py-2"><div className="flex gap-1 flex-wrap">
                {st === "Ready to Submit" && <Btn v="green" onClick={() => submit(c)}>Submit</Btn>}
                {st === "Pending Acknowledgment" && <><Btn v="info" onClick={() => { upd(c.id, (s) => ({ ...s, ack: true, receipt: "ACK-" + nid() }), "Acknowledgment received (simulated)"); toast("Acknowledged (simulated)."); }}>Simulate ack</Btn><Btn v="white" onClick={() => upd(c.id, (s) => ({ ...s, rejected: "Rejected by interface (simulated): payload failed schema check." }), "Rejection received (simulated)")}>Simulate error</Btn></>}
                {c.sub && c.sub.rejected && <Btn v="warning" onClick={() => upd(c.id, () => null, "Errors corrected, revalidating")}>Correct & revalidate</Btn>}
              </div></td></tr>); })}</tbody></table></div>
    </Panel>
  );
}

/* ---------- Audit & reports ---------- */
function AuditModule({ clients, clinic, audit }) {
  const [tab, setTab] = useState("activity");
  const expiring = [...clinic.docs.map((d) => ({ n: d.type + " " + d.ref, exp: d.expires })), ...clinic.physicians.map((p) => ({ n: "PRC " + p.name, exp: p.expiry }))].sort((a, b) => a.exp.localeCompare(b.exp));
  const count = (f) => clients.filter(f).length;
  const tabs = [["activity", "Activity"], ["expiry", "Document expiry"], ["summary", "Summary"], ["eKAS", "eKAS"], ["ePresS", "ePresS"], ["xml", "XML"]];
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-4 border-b border-slate-200">{tabs.map(([k, l]) => <button key={k} type="button" onClick={() => setTab(k)} className={`px-3 py-2 text-sm border-b-2 ${tab === k ? "border-[var(--accent)] text-[var(--accent)] font-semibold" : "border-transparent text-slate-500"}`}>{l}</button>)}</div>
      {tab === "activity" && <Panel title="ACTIVITY HISTORY"><Table cols={["When", "User", "Action", "Detail"]} rows={audit.map((a) => [a.ts, a.user, a.action, a.detail])} empty="No activity recorded in this session." /></Panel>}
      {tab === "expiry" && <Panel title="DOCUMENT & LICENSE EXPIRY"><Table cols={["Item", "Expires", "Days left", "Status"]} rows={expiring.map((x) => [x.n, x.exp, daysUntil(x.exp), <Badge key={x.n} s={docStatus({ expires: x.exp })} />])} /></Panel>}
      {tab === "summary" && <Panel title="OPERATIONAL SUMMARY"><Table cols={["Measure", "Count"]} rows={[["Registered clients", clients.length], ["FPE in progress", count((c) => patientStatus(c) === "FPE In Progress")], ["Awaiting empanelment", count((c) => patientStatus(c) === "Awaiting Empanelment")], ["Ready for care", count((c) => patientStatus(c) === "Ready for Care")], ["Consultations completed", count((c) => c.consults.length)], ["Validation failed", count((c) => subStatus(c) === "Validation Failed")], ["Pending acknowledgment", count((c) => subStatus(c) === "Pending Acknowledgment")], ["Acknowledged", count((c) => subStatus(c) === "Acknowledged")], ["Open referrals", clients.reduce((a, c) => a + c.referrals.filter((r) => r.status !== "Closed").length, 0)]]} /></Panel>}
      {["eKAS", "ePresS", "xml"].includes(tab) && <ReportsModule key={tab} clients={clients} kind={tab} />}
    </div>
  );
}

/* ---------- PhilHealth payments ---------- */
const peso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthOffset = (n) => { const d = new Date(todayISO()); d.setDate(1); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 7); };
const PAY_STATUS = ["Awaiting Payment", "Under Review", "Cheque Issued", "Payment Received"];
const PAY_BADGE = { "Awaiting Payment": "bg-slate-100 text-slate-600", "Under Review": "bg-sky-100 text-sky-700", "Cheque Issued": "bg-amber-100 text-amber-700", "Payment Received": "bg-emerald-100 text-emerald-700", "Short-paid": "bg-rose-100 text-rose-700" };
const SEED_PAYMENTS = [
  { id: 1, ref: "BATCH-2026-05", period: monthOffset(-5), type: "Capitation", expected: 48500, received: 48500, status: "Payment Received", method: "Bank transfer", payRef: "ADA-77120", paidOn: addDays(-130) },
  { id: 2, ref: "BATCH-2026-06", period: monthOffset(-4), type: "Capitation", expected: 52000, received: 52000, status: "Payment Received", method: "Cheque deposited", payRef: "OR-10421", paidOn: addDays(-100), chequeNo: "004518", chequeDate: addDays(-112), bank: "Land Bank" },
  { id: 3, ref: "BATCH-2026-07", period: monthOffset(-3), type: "Capitation", expected: 50750, received: 47250, status: "Payment Received", method: "Bank transfer", payRef: "ADA-80433", paidOn: addDays(-70), note: "Short-paid, 3,500 deducted: awaiting explanation" },
  { id: 4, ref: "BATCH-2026-08", period: monthOffset(-2), type: "Capitation", expected: 55200, received: 0, status: "Cheque Issued", chequeNo: "004977", chequeDate: addDays(-41), bank: "Land Bank" },
  { id: 5, ref: "BATCH-2026-09", period: monthOffset(-1), type: "Capitation", expected: 57800, received: 0, status: "Under Review" },
  { id: 6, ref: "BATCH-2026-10", period: monthOffset(0), type: "Capitation", expected: 59300, received: 0, status: "Awaiting Payment" },
];
const payStates = (p) => (p.status === "Payment Received" && p.received < p.expected ? ["Payment Received", "Short-paid"] : [p.status]);

function PayModal({ p, mode, onClose, onSave }) {
  const [f, setF] = useState(mode === "cheque" ? { chequeNo: "", chequeDate: todayISO(), bank: "" } : { amount: String(p.expected), paidOn: todayISO(), method: p.chequeNo ? "Cheque deposited" : "Bank transfer", payRef: "" });
  const [err, setErr] = useState("");
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    if (mode === "cheque") {
      if (!/^\d{5,12}$/.test(f.chequeNo)) return setErr("Cheque number must be 5–12 digits.");
      if (!f.chequeDate || isFuture(f.chequeDate)) return setErr("Cheque date is required and cannot be in the future.");
      if (!f.bank.trim()) return setErr("Enter the issuing bank.");
      return onSave({ ...f, status: "Cheque Issued" });
    }
    if (!(parseFloat(f.amount) > 0)) return setErr("Enter the amount actually received.");
    if (!f.paidOn || isFuture(f.paidOn)) return setErr("Date received is required and cannot be in the future.");
    if (p.chequeDate && f.paidOn < p.chequeDate) return setErr("Date received cannot be earlier than the cheque date.");
    if (!f.payRef.trim()) return setErr("Enter the official receipt / bank reference number.");
    onSave({ ...f, received: parseFloat(f.amount), status: "Payment Received" });
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5">
        <h3 className="font-semibold mb-1">{mode === "cheque" ? "Record cheque issued" : "Record payment received"}</h3>
        <p className="text-xs text-slate-500 mb-4">{p.ref} · expected {peso(p.expected)}</p>
        <div className="grid grid-cols-2 gap-3">
          {mode === "cheque" ? <>
            <F label="Cheque no." req><input className={inp()} inputMode="numeric" value={f.chequeNo} onChange={(e) => set("chequeNo", e.target.value.replace(/\D/g, ""))} /></F>
            <F label="Cheque date" req><input type="date" className={inp()} value={f.chequeDate} onChange={(e) => set("chequeDate", e.target.value)} /></F>
            <F label="Issuing bank" req className="col-span-2"><input className={inp()} value={f.bank} onChange={(e) => set("bank", e.target.value)} /></F>
          </> : <>
            <F label="Amount received (₱)" req><input className={inp()} inputMode="decimal" value={f.amount} onChange={(e) => set("amount", e.target.value.replace(/[^0-9.]/g, ""))} /></F>
            <F label="Date received" req><input type="date" className={inp()} value={f.paidOn} onChange={(e) => set("paidOn", e.target.value)} /></F>
            <F label="Method"><select className={inp()} value={f.method} onChange={(e) => set("method", e.target.value)}><option>Cheque deposited</option><option>Bank transfer</option></select></F>
            <F label="OR / bank ref." req><input className={inp()} value={f.payRef} onChange={(e) => set("payRef", e.target.value)} /></F>
          </>}
        </div>
        {err && <div className="mt-3"><Notice>{err}</Notice></div>}
        <div className="flex justify-end gap-2 mt-4"><Btn v="white" onClick={onClose}>Cancel</Btn><Btn v="green" onClick={save}>Save</Btn></div>
      </div>
    </div>
  );
}

function PaymentsModule({ payments, setPayments }) {
  const toast = useToast(), log = useLog();
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [nf, setNf] = useState({ ref: "", period: monthOffset(0), type: "Capitation", expected: "", note: "" });
  const [err, setErr] = useState("");
  const sum = (arr, k) => arr.reduce((a, p) => a + (+p[k] || 0), 0);
  const recd = payments.filter((p) => p.status === "Payment Received");
  const cheque = payments.filter((p) => p.status === "Cheque Issued");
  const waiting = payments.filter((p) => p.status === "Awaiting Payment" || p.status === "Under Review");
  const shortPaid = recd.filter((p) => p.received < p.expected);
  const variance = shortPaid.reduce((a, p) => a + (p.expected - p.received), 0);
  const periods = [...new Set(payments.map((p) => p.period))].sort();
  const max = Math.max(1, ...payments.map((p) => p.expected));
  const rows = payments.filter((p) => (filter === "All" || payStates(p).includes(filter)) && (p.ref + (p.chequeNo || "") + (p.payRef || "")).toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.period.localeCompare(a.period));
  const patch = (id, data, what) => { setPayments((l) => l.map((p) => (p.id === id ? { ...p, ...data } : p))); log(what, payments.find((p) => p.id === id).ref); };
  const add = () => {
    if (!nf.ref.trim()) return setErr("Batch / claim reference is required.");
    if (payments.some((p) => p.ref.toLowerCase() === nf.ref.trim().toLowerCase())) return setErr("That reference already exists.");
    if (!nf.period) return setErr("Select the period covered.");
    if (!(parseFloat(nf.expected) > 0)) return setErr("Enter the expected amount.");
    setErr(""); setPayments((l) => [...l, { id: nid(), ref: nf.ref.trim(), period: nf.period, type: nf.type, expected: parseFloat(nf.expected), received: 0, status: "Awaiting Payment", note: nf.note }]);
    log("Payment expected added", nf.ref); toast("Expected payment added."); setNf({ ref: "", period: monthOffset(0), type: "Capitation", expected: "", note: "" });
  };
  const card = (label, value, hint, tone) => <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><div className="text-xs text-slate-500">{label}</div><div className={`text-xl font-semibold mt-1 ${tone || ""}`}>{value}</div><div className="text-[11px] text-slate-400 mt-0.5">{hint}</div></div>;
  return (
    <div className="space-y-5">
      <Notice kind="info">Internal payment tracker with dummy data. Record the amounts, cheques and receipts from PhilHealth's actual advice or remittance; nothing here is pulled from PhilHealth.</Notice>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {card("Payment received", peso(sum(recd, "received")), `${recd.length} payment(s)`, "text-emerald-600")}
        {card("On cheque", peso(sum(cheque, "expected")), `${cheque.length} cheque(s) to claim/deposit`, "text-amber-600")}
        {card("Awaiting / under review", peso(sum(waiting, "expected")), `${waiting.length} batch(es)`)}
        {card("Short-paid variance", peso(variance), `${shortPaid.length} payment(s) to reconcile`, variance ? "text-rose-600" : "")}
        {card("Total expected", peso(sum(payments, "expected")), `${payments.length} batch(es)`)}
      </div>
      <Panel title="EXPECTED VS RECEIVED BY PERIOD">
        <div className="flex items-end gap-4 h-40">{periods.map((per) => { const items = payments.filter((p) => p.period === per); const e = sum(items, "expected"), r = sum(items.filter((p) => p.status === "Payment Received"), "received"); return (
          <div key={per} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="flex items-end gap-1 h-32 w-full justify-center"><div title={`Expected ${peso(e)}`} className="w-1/3 rounded-t bg-slate-300" style={{ height: (e / max) * 100 + "%" }} /><div title={`Received ${peso(r)}`} className="w-1/3 rounded-t bg-[var(--accent)]" style={{ height: (r / max) * 100 + "%" }} /></div>
            <div className="text-[10px] text-slate-500">{per}</div></div>); })}</div>
        <div className="flex gap-4 text-xs text-slate-500 mt-2"><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-300" />Expected</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--accent)]" />Received</span></div>
      </Panel>
      <Panel title="CHEQUE TRACKER">
        <Table cols={["Batch", "Cheque no.", "Bank", "Cheque date", "Days out", "Amount", ""]} rows={cheque.map((p) => { const d = -daysUntil(p.chequeDate); return [p.ref, p.chequeNo, p.bank, p.chequeDate, <span key={p.id} className={d >= 30 ? "text-rose-600 font-medium" : ""}>{d}{d >= 30 ? " · follow up" : ""}</span>, peso(p.expected), <Btn key={"b" + p.id} v="green" onClick={() => setModal({ p, mode: "receive" })}>Mark received</Btn>]; })} empty="No cheques outstanding." />
      </Panel>
      <Panel title="PAYMENT LEDGER" right={<span>{rows.length} shown</span>}>
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="relative flex-1 min-w-[200px]"><Search size={14} className="absolute left-2 top-3 text-slate-400" /><input className={inp() + " pl-7"} placeholder="Search batch, cheque or receipt no." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className={inp() + " max-w-[200px]"} value={filter} onChange={(e) => setFilter(e.target.value)}><option>All</option>{[...PAY_STATUS, "Short-paid"].map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <Table cols={["Batch", "Period", "Type", "Expected", "Received", "Status", "Details", ""]} rows={rows.map((p) => [p.ref, p.period, p.type, peso(p.expected), p.status === "Payment Received" ? peso(p.received) : "—",
          <div key={p.id} className="flex gap-1 flex-wrap">{payStates(p).map((s) => <span key={s} className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${PAY_BADGE[s]}`}>{s}</span>)}</div>,
          <span key={"d" + p.id} className="text-xs text-slate-500">{p.status === "Payment Received" ? `${p.method} · ${p.payRef} · ${p.paidOn}` : p.chequeNo ? `Cheque ${p.chequeNo} (${p.bank})` : p.note || "—"}{p.note && p.status === "Payment Received" ? ` · ${p.note}` : ""}</span>,
          <div key={"a" + p.id} className="flex gap-1">{(p.status === "Awaiting Payment" || p.status === "Under Review") && <>{p.status === "Awaiting Payment" && <Btn v="white" onClick={() => { patch(p.id, { status: "Under Review" }, "Payment under review"); toast("Marked under review."); }}>Review</Btn>}<Btn v="info" onClick={() => setModal({ p, mode: "cheque" })}>Cheque</Btn><Btn v="green" onClick={() => setModal({ p, mode: "receive" })}>Received</Btn></>}{p.status === "Cheque Issued" && <Btn v="green" onClick={() => setModal({ p, mode: "receive" })}>Received</Btn>}</div>])} empty="No payments match." />
      </Panel>
      <Panel title="ADD EXPECTED PAYMENT">
        <div className="grid md:grid-cols-5 gap-3 items-end">
          <F label="Batch / claim ref." req><input className={inp()} value={nf.ref} onChange={(e) => setNf({ ...nf, ref: e.target.value })} /></F>
          <F label="Period" req><input type="month" className={inp()} value={nf.period} onChange={(e) => setNf({ ...nf, period: e.target.value })} /></F>
          <F label="Type"><select className={inp()} value={nf.type} onChange={(e) => setNf({ ...nf, type: e.target.value })}><option>Capitation</option><option>Claims</option><option>Other</option></select></F>
          <F label="Expected (₱)" req><input className={inp()} inputMode="decimal" value={nf.expected} onChange={(e) => setNf({ ...nf, expected: e.target.value.replace(/[^0-9.]/g, "") })} /></F>
          <Btn v="green" onClick={add}><Plus size={14} />Add</Btn>
        </div>
        {err && <div className="mt-3"><Notice>{err}</Notice></div>}
      </Panel>
      {modal && <PayModal key={modal.p.id + modal.mode} p={modal.p} mode={modal.mode} onClose={() => setModal(null)} onSave={(d) => { patch(modal.p.id, d, modal.mode === "cheque" ? "Cheque recorded" : "Payment received"); toast(modal.mode === "cheque" ? "Cheque recorded." : "Payment recorded."); setModal(null); }} />}
    </div>
  );
}

/* ---------- App shell ---------- */
const SYNC_STEPS = ["Validating records", "Building batch", "Encrypting payload", "Transmitting via EMR interface (mock)"];
const THEMES = [
  { id: "sunga", name: "Sunga Teal" }, { id: "warm", name: "Warm Community" },
  { id: "midnight", name: "Midnight" }, { id: "contrast", name: "High Contrast" },
];
const NAV = [
  ["Clinic", [["clinic", "Clinic Accreditation", Building2], ["docs", "Documents & Physicians", FolderOpen], ["emrcfg", "EMR Configuration", Server]]],
  ["Patient", [["reg", "Patient Registration", UserPlus], ["hsa", "FPE & Health Profile", ClipboardList], ["emp", "YES & Empanelment", HeartHandshake], ["consult", "Consultation", Stethoscope], ["diag", "Diagnostics & Referral", FlaskConical], ["med", "Medicine", Pill]]],
  ["Finance", [["pay", "PhilHealth Payments", Wallet]]],
  ["Submission", [["sub", "EMR Submission", Send], ["audit", "Audit & Reports", History], ["upl", "Masterlist Uploader", Upload]]],
];
const PATIENT_PAGES = ["reg", "hsa", "emp", "consult", "diag", "med"];
export default function EKonsultaApp() {
  const [clients, setClients] = useState(SEED);
  const [clinic, setClinic] = useState(INITIAL_CLINIC);
  const [audit, setAudit] = useState([]);
  const [payments, setPayments] = useState(SEED_PAYMENTS);
  const [page, setPage] = useState("home");
  const [open, setOpen] = useState(true);
  const [theme, setTheme] = useState("sunga");
  const [themeMenu, setThemeMenu] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [sync, setSync] = useState(null);
  const timer = useRef(null);
  const toast = (message, type = "ok") => { setToastMsg({ message, type }); clearTimeout(timer.current); timer.current = setTimeout(() => setToastMsg(null), 3000); };
  const log = (action, detail = "") => setAudit((p) => [{ ts: new Date().toLocaleString(), user: USERNAME, action, detail }, ...p].slice(0, 200));
  useEffect(() => () => clearTimeout(timer.current), []);
  const go = (p) => { setPage(p); setThemeMenu(false); };
  const runSync = () => {
    const gate = gateReason(clinic);
    if (gate) return toast(`Submission blocked: ${gate}.`, "error");
    const ready = clients.filter((c) => subStatus(c) === "Ready to Submit");
    if (!ready.length) return toast("No records are ready to submit.", "info");
    const ids = ready.map((c) => c.id);
    setSync({ step: 0, pct: 0 });
    let k = 0;
    const tick = () => {
      k++;
      if (k > SYNC_STEPS.length) { setClients((p) => p.map((c) => (ids.includes(c.id) ? { ...c, sub: { submittedAt: todayISO(), ref: "SUB-" + nid() } } : c))); setSync(null); log("Batch submission", `${ids.length} record(s) submitted (simulated)`); toast(`${ids.length} record(s) submitted. Awaiting acknowledgment.`); return; }
      setSync({ step: k - 1, pct: Math.round((k / SYNC_STEPS.length) * 100) }); setTimeout(tick, 600);
    };
    setTimeout(tick, 300);
  };
  const cst = clinicStatus(clinic);
  return (
    <AppCtx.Provider value={{ toast, log }}>
      <div className={`theme-${theme} min-h-screen flex flex-col bg-slate-50 text-slate-800`}>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 py-2.5 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" aria-label="Toggle sidebar" onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-slate-100"><Menu size={18} /></button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Sunga Hospital logo" className="h-10 w-auto logo-img" />
              <div className="hidden sm:block border-l border-slate-200 pl-3 min-w-0"><div className="font-semibold leading-tight truncate">{HOSPITAL}</div><div className="text-xs text-slate-500 truncate">{HOSPITAL_ADDR} · YAKAP / eKonsulta</div></div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <span className="hidden md:inline"><Badge s={cst} /></span>
              <div className="relative">
                <button type="button" onClick={() => setThemeMenu(!themeMenu)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium hover:bg-slate-50"><Palette size={14} className="text-[var(--accent)]" /><span className="hidden md:inline">{THEMES.find((t) => t.id === theme).name}</span><ChevronDown size={12} /></button>
                {themeMenu && <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-40">{THEMES.map((t) => <button key={t.id} type="button" onClick={() => { setTheme(t.id); setThemeMenu(false); }} className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50">{t.name}{theme === t.id && <CheckIcon size={14} className="text-[var(--accent)]" />}</button>)}</div>}
              </div>
              <button type="button" onClick={runSync} className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-h)]"><UploadCloud size={14} />Submit ready records</button>
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold">NV</div><div className="hidden lg:block leading-tight"><div className="text-xs font-semibold">{USERNAME}</div><div className="text-[10px] text-slate-500">{ROLE}</div></div></div>
            </div>
          </div>
        </header>
        <div className="flex flex-1">
          <aside className={`${open ? "w-64" : "w-[68px]"} shrink-0 bg-white border-r border-slate-200 transition-all duration-200 flex flex-col justify-between`}>
            <nav className="p-3 space-y-1">
              <button type="button" title="Dashboard" onClick={() => go("home")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${page === "home" ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold" : "text-slate-600 hover:bg-slate-100"}`}><Home size={16} className="shrink-0" />{open && <span>Dashboard</span>}</button>
              {NAV.map(([group, items]) => (
                <div key={group}>
                  {open ? <div className="px-3.5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group}</div> : <div className="my-2 border-t border-slate-100" />}
                  {items.map(([id, label, Icon]) => (
                    <button key={id} type="button" title={label} onClick={() => go(id)} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${page === id ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold" : "text-slate-600 hover:bg-slate-100"}`}>
                      <Icon size={16} className="shrink-0" />{open && <span className="truncate">{label}</span>}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            {open && <div className="m-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs"><div className="flex items-center justify-between font-semibold mb-1"><span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-[var(--accent)]" />Gateway</span><span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-mono">MOCK</span></div><p className="text-[11px] text-slate-500">Not connected to PhilHealth. Dummy data only.</p></div>}
          </aside>
          <main className="flex-1 min-w-0 px-4 md:px-8 py-6">
            <div className="max-w-6xl mx-auto">
              {PATIENT_PAGES.includes(page) && cst !== "Approval Verified" && <div className="mb-4"><Notice kind="info">Clinic approval is not verified ({cst}). Patient records can be encoded as drafts, but EMR submission stays blocked until PhilHealth approval is recorded under Clinic Accreditation.</Notice></div>}
              {page === "home" && <HomeModule clients={clients} go={go} clinic={clinic} onSync={runSync} />}
              {page === "clinic" && <ClinicModule clinic={clinic} setClinic={setClinic} />}
              {page === "docs" && <DocsModule clinic={clinic} setClinic={setClinic} />}
              {page === "emrcfg" && <EmrConfigModule clinic={clinic} setClinic={setClinic} />}
              {page === "reg" && <RegistrationModule clients={clients} setClients={setClients} go={go} />}
              {page === "hsa" && <HSAModule clients={clients} setClients={setClients} />}
              {page === "emp" && <EmpModule clients={clients} setClients={setClients} />}
              {page === "consult" && <ConsultModule clients={clients} setClients={setClients} />}
              {page === "diag" && <DiagnosticsModule clients={clients} setClients={setClients} />}
              {page === "med" && <MedicineModule clients={clients} setClients={setClients} />}
              {page === "pay" && <PaymentsModule payments={payments} setPayments={setPayments} />}
              {page === "sub" && <SubmissionModule clients={clients} setClients={setClients} clinic={clinic} />}
              {page === "audit" && <AuditModule clients={clients} clinic={clinic} audit={audit} />}
              {page === "upl" && <UploaderModule />}
              <footer className="text-center text-xs text-slate-400 pt-6">{headerDate()} · UI mock, dummy data only</footer>
            </div>
          </main>
        </div>
        {toastMsg && <div role="status" className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm text-white ${toastMsg.type === "info" ? "bg-slate-800" : toastMsg.type === "error" ? "bg-rose-600" : "bg-emerald-600"}`}>{toastMsg.type === "info" ? <Info size={16} /> : toastMsg.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}{toastMsg.message}</div>}
        {sync && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"><h3 className="font-semibold mb-1">EMR batch submission</h3><p className="text-sm text-slate-500 mb-4">{SYNC_STEPS[sync.step]}…</p><div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${sync.pct}%` }} /></div><div className="text-xs text-slate-400 mt-2">{sync.pct}% · simulation only</div></div></div>}
      </div>
    </AppCtx.Provider>
  );
}
