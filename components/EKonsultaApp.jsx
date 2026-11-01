"use client";
import React, { useState, useContext, createContext, useEffect, useRef } from "react";
import {
  ChevronDown, Search, Trash2, CheckCircle2, AlertTriangle, X, Upload, Home, UserPlus,
  Stethoscope, ClipboardList, FlaskConical, Pill, FileText, ExternalLink, Plus, ChevronLeft, ChevronRight,
  Menu, Palette, Check as CheckIcon, Info, UploadCloud, ShieldCheck, Activity, Users, Clock, FileCheck,
  Wallet, KeyRound, LogOut, Lock, Bot, MessageCircle, BookOpen, ThumbsUp, ThumbsDown, Building2, FolderOpen, Server, HeartHandshake, Send, History, Share2,
} from "lucide-react";

/* ---------- constants ---------- */
const HOSPITAL = "SUNGA HOSPITAL";
const HOSPITAL_ADDR = "Digos City, Davao del Sur";
// Official source: PhilHealth Circular "Clinical and Pharmaceutical Standards for PhilHealth YAKAP" (Annex A GAMOT drugs, Annex B dispensing limits).
const GAMOT_URL = "https://www.philhealth.gov.ph/circulars/2025/PC2025-0013.pdf";
const GAMOT_LIMITS_URL = "https://www.philhealth.gov.ph/circulars/2026/PC2026-0007.pdf";
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
// Selected laboratory tests (Annex B / Annex D, PhilHealth Circular No. 2024-0013).
// Age bands: 0-12 months, 1-4, 5-9, 10-19, 20-39, 40-49, 50-59, 60-69, 70+ years.
// R = recommended for that age (other tests can still be picked), A = as applicable, X = not applicable.
const AGE_BANDS = ["0–12 mos", "1–4", "5–9", "10–19", "20–39", "40–49", "50–59", "60–69", "70+"];
const LABS = {
  CBC: { name: "Complete Blood Count (CBC) with platelet count", short: "CBC with platelet", text: true, guide: "AAAAAAAAA" },
  LIPID: { name: "Lipid Profile (Total Cholesterol, HDL, LDL, Triglycerides)", short: "Lipid Profile", guide: "AAAAARRRR",
    parts: [["TC", "Total cholesterol", "mg/dL", 0, 200], ["HDL", "HDL", "mg/dL", 40, 999], ["LDL", "LDL", "mg/dL", 0, 130], ["TG", "Triglycerides", "mg/dL", 0, 150]] },
  FBS: { name: "Fasting Blood Sugar (FBS)", short: "FBS", unit: "mg/dL", lo: 70, hi: 100, conv: 18.02, unit2: "mmol/L", guide: "AAAAARRRR" },
  OGTT: { name: "Oral Glucose Tolerance Test (OGTT)", short: "OGTT (2-hr)", unit: "mg/dL", lo: 0, hi: 140, conv: 18.02, unit2: "mmol/L", guide: "AAAAARRRR" },
  HBA1C: { name: "Glycosylated Hemoglobin (HbA1c)", short: "HbA1c", unit: "%", lo: 4, hi: 5.6, guide: "AAAAAAAAA" },
  CREA: { name: "Creatinine", short: "Creatinine", unit: "mg/dL", lo: 0.6, hi: 1.3, guide: "AAAAAAAAA" },
  CXR: { name: "Chest X-Ray", short: "Chest X-Ray", text: true, guide: "AAARRRRRR" },
  SPUTUM: { name: "Sputum Microscopy", short: "Sputum Microscopy", text: true, guide: "AAAAAAAAA" },
  ECG: { name: "Electrocardiogram (ECG)", short: "ECG", text: true, guide: "AAAAAAARR" },
  UA: { name: "Urinalysis", short: "Urinalysis", text: true, guide: "AAAAAAAAA" },
  PAP: { name: "Pap Smear (for women)", short: "Pap Smear", text: true, guide: "XXXARRRRR", women: true, waivable: true },
  FECA: { name: "Fecalysis", short: "Fecalysis", text: true, guide: "AAAAAAAAA" },
  FOBT: { name: "Fecal Occult Blood Test (FOBT)", short: "FOBT", text: true, choices: ["Negative", "Positive"], guide: "AAAAAAAAA" },
};
const ageBand = (dob) => { const m = ageMonths(dob); if (m <= 12) return 0; const y = calcAge(dob); return y <= 4 ? 1 : y <= 9 ? 2 : y <= 19 ? 3 : y <= 39 ? 4 : y <= 49 ? 5 : y <= 59 ? 6 : y <= 69 ? 7 : 8; };
// "R" recommended, "A" as applicable, "X" not applicable (also X for Pap Smear in male clients)
const labStatus = (code, c) => { const t = LABS[code]; if (t.women && c.sex !== "F") return "X"; return t.guide[ageBand(c.dob)]; };
// PhilHealth GAMOT list: 75 molecules (Annex A.1, PhilHealth Circular PC2025-0013).
// y21 = one of the 21 eKonsulta (Konsulta) medicines; the other 54 were added under YAKAP.
// Dispensing limits from Annex B of the YAKAP clinical and pharmaceutical standards circular.
// limit: max days per prescription; spec: special-preparation limits (Annex B Table 2).
const G = (name, cat, ind, limit, extra = {}) => ({ name, cat, ind, limit, ...extra });
const GAMOT = [
  G("Amoxicillin", "Antibiotic", "Respiratory, ear, sinus and dental infections; typhoid; H. pylori", 14, { y21: 1 }),
  G("Azithromycin", "Antibiotic", "Typhoid (second line), salmonella, gonorrhea", 14),
  G("Cefixime", "Antibiotic", "See circular", 14),
  G("Cefuroxime", "Antibiotic", "Upper/lower respiratory and ear infections", 14),
  G("Ciprofloxacin", "Antibiotic", "Restricted: severe GI infection, MDR typhoid, shigellosis, cystitis", 14, { y21: 1 }),
  G("Clarithromycin", "Antibiotic", "Low-risk community-acquired pneumonia; H. pylori; penicillin allergy", 14, { y21: 1 }),
  G("Clindamycin", "Antibiotic", "CA-MRSA skin infection; anaerobic infections", 14),
  G("Cloxacillin", "Antibiotic", "Penicillinase-producing staphylococcal infections", 14),
  G("Co-amoxiclav", "Antibiotic", "Respiratory, sinus and ear infections; pneumonia", 14, { y21: 1 }),
  G("Cotrimoxazole (Sulfamethoxazole + Trimethoprim)", "Antibiotic", "Typhoid, pneumocystis and other specific infections", 14, { y21: 1 }),
  G("Doxycycline", "Antibiotic", "Leptospirosis, chlamydia/mycoplasma, periodontal infection", 14),
  G("Erythromycin", "Antibiotic", "Penicillin alternative; conjunctivitis, pertussis, chlamydia", 14, { spec: "Ophthalmic ointment: 1 tube / 14 days" }),
  G("Metronidazole", "Antibiotic", "Amebiasis, H. pylori, anaerobic infections", 14),
  G("Nitrofurantoin", "Antibiotic", "Uncomplicated cystitis; recurrent UTI (non-pregnant)", 14, { y21: 1 }),
  G("Albendazole", "Antiparasitic", "Filariasis; intestinal helminths", 14),
  G("Mebendazole", "Antiparasitic", "Roundworm infections", 14),
  G("Clotrimazole", "Antifungal", "Otitis externa; vaginal candidiasis; tinea", null, { spec: "Cream: 1 tube / 7 days" }),
  G("Fluconazole", "Antifungal", "Candidiasis; cryptococcal meningitis", 14),
  G("Ketoconazole", "Antifungal", "Tinea, cutaneous candidiasis, seborrheic dermatitis", null, { spec: "Cream: 1 tube / 14 days · Shampoo: 1 bottle / 14 days or 1 sachet / 3 days" }),
  G("Oseltamivir", "Antiviral", "Influenza A and B", 14),
  G("Tobramycin", "Eye", "External eye infections", null, { spec: "Ophthalmic ointment or solution: 1 / 14 days" }),
  G("Aspirin", "Cardiovascular", "Prevention of MI, stroke and thrombosis", 30, { y21: 1 }),
  G("Clopidogrel", "Cardiovascular", "Prevention of atherothrombotic events", 30),
  G("Amlodipine", "Cardiovascular", "Hypertension", 30, { y21: 1 }),
  G("Atenolol", "Cardiovascular", "Hypertension; angina; post-MI", 30),
  G("Captopril", "Cardiovascular", "Hypertension; heart failure; diabetic nephropathy", 30),
  G("Clonidine", "Cardiovascular", "Hypertension", 30),
  G("Diltiazem", "Cardiovascular", "Angina", 30),
  G("Enalapril", "Cardiovascular", "Hypertension; heart failure; post-MI", 30, { y21: 1 }),
  G("Enalapril + Hydrochlorothiazide", "Cardiovascular", "Hypertension", 30),
  G("Hydrochlorothiazide", "Cardiovascular", "Hypertension; edema", 30, { y21: 1 }),
  G("Isosorbide Dinitrate", "Cardiovascular", "Angina", 30),
  G("Isosorbide Mononitrate", "Cardiovascular", "Angina prevention", 30),
  G("Losartan", "Cardiovascular", "Hypertension; diabetic nephropathy", 30, { y21: 1 }),
  G("Methyldopa", "Cardiovascular", "Gestational and chronic hypertension", 30),
  G("Metoprolol", "Cardiovascular", "Hypertension; angina; post-MI", 30, { y21: 1 }),
  G("Telmisartan", "Cardiovascular", "Hypertension; CV risk reduction", 30),
  G("Telmisartan + Hydrochlorothiazide", "Cardiovascular", "Hypertension", 30),
  G("Valsartan", "Cardiovascular", "Hypertension; heart failure; post-MI", 30),
  G("Valsartan + Hydrochlorothiazide", "Cardiovascular", "Hypertension", 30),
  G("Atorvastatin", "Lipid-lowering", "High cholesterol / triglycerides", 30),
  G("Fenofibrate", "Lipid-lowering", "Hypertriglyceridemia; diabetic dyslipidemia", 30),
  G("Rosuvastatin", "Lipid-lowering", "CV event prevention; hyperlipidemia", 30),
  G("Simvastatin", "Lipid-lowering", "CV event prevention; hyperlipidemia", 30, { y21: 1 }),
  G("Dapagliflozin", "Diabetes", "Add-on to metformin in T2DM with CV/renal risk", 30),
  G("Gliclazide", "Diabetes", "Type 2 diabetes", 30, { y21: 1 }),
  G("Metformin", "Diabetes", "Type 2 diabetes", 30, { y21: 1 }),
  G("Budesonide + Formoterol", "Respiratory", "Asthma (12+); COPD maintenance", null, { spec: "DPI: 1 inhaler / 15 days · MDI: 1 inhaler / 30 days" }),
  G("Fluticasone + Salmeterol", "Respiratory", "Asthma (4+); COPD maintenance", null, { y21: 1, spec: "MDI: 1 / 30 days · DPI 28 doses: 1 / 7 days · DPI 60 doses: 1 / 14 days" }),
  G("Ipratropium", "Respiratory", "Chronic asthma", null, { spec: "Nebule: 20 nebules / 5 days" }),
  G("Ipratropium + Salbutamol", "Respiratory", "COPD bronchospasm", null, { spec: "Nebule: 20 / 5 days · MDI 200 doses: 1 / 30 days" }),
  G("Montelukast", "Respiratory", "Asthma; allergic rhinitis with asthma", 30),
  G("Prednisone", "Respiratory", "Inflammatory and allergic conditions; asthma", 7, { y21: 1 }),
  G("Salbutamol", "Respiratory", "Asthma; bronchospasm", null, { y21: 1, spec: "Nebule: 20 / 5 days · DPI capsule: 20 / 5 days · MDI 200 doses: 1 / 30 days" }),
  G("Tiotropium", "Respiratory", "COPD maintenance", null, { spec: "DPI capsule: 30 capsules / 21 days" }),
  G("Butamirate", "Cough", "Non-productive cough", 7),
  G("Lagundi (Vitex negundo)", "Cough", "Mild to moderate cough from colds and flu", 7),
  G("Celecoxib", "Pain / Anti-inflammatory", "Osteoarthritis, RA; short-term acute pain", 7),
  G("Ibuprofen", "Pain / Anti-inflammatory", "Musculoskeletal pain; mild-moderate pain; migraine", 7),
  G("Mefenamic Acid", "Pain / Anti-inflammatory", "Pain; dysmenorrhea", 7),
  G("Naproxen", "Pain / Anti-inflammatory", "Rheumatic and joint disorders; gout", 7),
  G("Paracetamol", "Pain / Anti-inflammatory", "Mild to moderate pain; fever", 7, { y21: 1 }),
  G("Colchicine", "Pain / Anti-inflammatory", "Acute gout; gout prophylaxis", 30),
  G("Gabapentin", "Pain / Anti-inflammatory", "Postherpetic and neuropathic pain", 30),
  G("Cetirizine", "Antihistamine", "Allergic rhinitis; urticaria", 7),
  G("Chlorphenamine", "Antihistamine", "Allergic conditions; pruritus; colds", 7, { y21: 1 }),
  G("Diphenhydramine", "Antihistamine", "Allergic symptoms; adjunct in anaphylaxis", 7),
  G("Loratadine", "Antihistamine", "Allergic rhinitis; urticaria", 7),
  G("Aluminum Hydroxide + Magnesium Hydroxide", "Gastrointestinal", "Hyperacidity; heartburn", 7),
  G("Omeprazole", "Gastrointestinal", "Acid-related disorders; H. pylori", 7),
  G("Oral Rehydration Salts (ORS)", "Gastrointestinal", "Dehydration from diarrhea or vomiting", 7, { y21: 1 }),
  G("Zinc", "Gastrointestinal", "Adjunct for acute and persistent diarrhea", 14),
  G("Ferrous Salt (Iron)", "Vitamins / Minerals", "Iron-deficiency anemia", 30),
  G("Folic Acid + Ferrous Iron", "Vitamins / Minerals", "Iron and folate deficiency prevention (pregnancy)", 30),
  G("Tamsulosin", "Urology", "Benign prostatic hyperplasia", 30),
];
const GAMOT_CATS = [...new Set(GAMOT.map((g) => g.cat))];
const gamotOf = (name) => GAMOT.find((g) => g.name === name);
const limitText = (g) => (g.limit ? `max ${g.limit} days` : g.spec || "see circular");
const progOf = (g) => (g.y21 ? "eKonsulta" : "YAKAP");
function ProgBadge({ g }) { return <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${g.y21 ? "bg-teal-100 text-teal-700" : "bg-indigo-100 text-indigo-700"}`}>{progOf(g)}</span>; }

const mk = (id, last, first, middle, dob, sex, type, extra = {}) => ({
  id, pin: type === "NM" ? "" : `12-0${String(50000000 + id * 7919).slice(0, 8)}-${id % 10}`, last, first, middle, ext: "", dob, sex, type, civil: "Married",
  mobile: "0917" + String(1000000 + id * 3571).slice(0, 7), prov: "DAVAO DEL SUR", mun: "DIGOS CITY", brgy: "ZONE 1", zip: "8002", consent: true, loa: true,
  regDate: todayISO(), hsa: null, consults: [], labs: [], meds: [], emp: null, sub: null, referrals: [], fpeStarted: false, ...extra,
});
const NORMAL_PE = Object.fromEntries(["heent", "chest", "heart", "abdomen", "gu", "dre", "skin", "neuro"].map((k) => [k, ["Essentially normal"]]));
const SEED_HSA = { atc: "ATC-0001", date: todayISO(), pmh: { items: ["Hypertension"], allergy: "", bpS: "150", bpD: "95", others: "", cancer: "", ptb: "", hep: "", eptb: "" }, surg: [], fam: { items: ["None"], allergy: "", bpS: "", bpD: "", others: "", cancer: "", ptb: "", hep: "", eptb: "" }, social: { smoke: "N", packs: "", alcohol: "N", bottles: "", drugs: "N", sexActive: "Y" }, imm: { child: [], adult: [], preg: [], elder: ["None"], others: "" }, fp: "", mens: {}, preg: {}, v: { height: "168", weight: "70", sys: "130", dia: "84", hr: "76", rr: "18", temp: "36.7", blood: "O+", survey: "Awake" }, pe: Object.fromEntries(["heent", "chest", "heart", "abdomen", "gu", "dre", "skin", "neuro"].map((k) => [k, ["Essentially normal"]])), peOther: {}, ncd: { risk: "10% to <20%" }, labs: [], notes: "" };
const SEED_RX = [{ drug: "Amlodipine", qty: 30, days: 30, sig: "5 mg tablet, 1 tab once daily", dispensed: true }];
const SEED_CONSULT = { atc: "ATC-0002", copay: "", date: todayISO(), cc: ["HEADACHE"], ccOther: "", hpi: "Follow-up for hypertension; controlled on medication, occasional nape pain.", v: { sys: "130", dia: "84", rr: "18", height: "168", weight: "70", temp: "36.7", hr: "76" }, pe: NORMAL_PE, peOther: {}, dx: ["Essential (primary) hypertension"], labs: {}, labOther: "", labOtherDoc: "", labOtherCli: "", mgmtNA: false, mgmt: ["Counseling for Lifestyle Modification"], mgmtOther: "", meds: SEED_RX };
const SEED = [
  mk(1, "Dela Cruz", "Juan", "Santos", "1968-03-14", "M", "MM", { hsa: SEED_HSA, fpeStarted: true, emp: { choice: "YES", agree: true, date: todayISO(), verified: true }, consults: [SEED_CONSULT], meds: SEED_RX }),
  mk(2, "Reyes", "Maria", "Garcia", "1975-07-22", "F", "MM", { hsa: { ...SEED_HSA, fp: "Y", mens: { app: "Y", menarche: "13", menopause: "N", lmp: addDays(-20) }, preg: { app: "Y", g: "2", p: "2", full: "2", living: "2" } }, fpeStarted: true }),
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
  if (k) { if (!dxList(k).length) e.push("Consultation has no diagnosis"); if (!k.v.sys || !k.v.dia) e.push("Consultation vitals incomplete"); }
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
function ClientPicker({ clients, value, onChange, filter = () => true, pageSize = 6 }) {
  const [q, setQ] = useState(""); const [pg, setPg] = useState(0);
  const list = clients.filter(filter).filter((c) => (fullName(c) + " " + (c.pin || "")).toLowerCase().includes(q.toLowerCase()));
  const pages = Math.max(1, Math.ceil(list.length / pageSize)); const cur = Math.min(pg, pages - 1);
  const shown = list.slice(cur * pageSize, cur * pageSize + pageSize);
  return (
    <div>
      <div className="relative mb-3"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" /><input className={inp() + " pl-9"} placeholder="Search name or PIN" value={q} onChange={(e) => { setQ(e.target.value); setPg(0); }} /></div>
      {list.length === 0 ? <div className="p-6 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">No client found.</div> :
        <div className="space-y-2">{shown.map((c) => (
          <button key={c.id} type="button" onClick={() => onChange(c.id)} className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border transition-colors ${value === c.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-slate-200 hover:border-[var(--accent)] hover:bg-slate-50"}`}>
            <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">{(c.first[0] + c.last[0]).toUpperCase()}</span>
            <span className="flex-1 min-w-0"><span className="block font-semibold text-sm truncate">{fullName(c)}</span><span className="block text-xs text-slate-500">{c.pin || "No PIN"} · {calcAge(c.dob)} y/o · {c.sex === "F" ? "Female" : "Male"} · {TYPES[c.type]}</span></span>
            <span className="hidden md:inline"><Badge s={patientStatus(c)} /></span>
            <ChevronRight size={16} className="text-slate-400 shrink-0" />
          </button>))}</div>}
      {pages > 1 && <div className="flex items-center justify-end gap-2 mt-3 text-xs text-slate-500">
        <span>{cur * pageSize + 1}–{Math.min(list.length, cur * pageSize + pageSize)} of {list.length}</span>
        <button type="button" aria-label="Previous page" disabled={cur === 0} onClick={() => setPg(cur - 1)} className="p-1 rounded border border-slate-200 disabled:opacity-40"><ChevronLeft size={14} /></button>
        <button type="button" aria-label="Next page" disabled={cur >= pages - 1} onClick={() => setPg(cur + 1)} className="p-1 rounded border border-slate-200 disabled:opacity-40"><ChevronRight size={14} /></button>
      </div>}
    </div>
  );
}
function Table({ cols, rows, empty = "No records.", pageSize = 6 }) {
  const [pg, setPg] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(pg, pages - 1);
  const shown = rows.slice(cur * pageSize, cur * pageSize + pageSize);
  return (
    <div>
      <div className="overflow-auto border border-slate-200 rounded-lg">
        <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr>{cols.map((c) => <th key={c} className="text-left px-3 py-2.5 font-medium">{c}</th>)}</tr></thead>
          <tbody>{rows.length === 0 ? <tr><td colSpan={cols.length} className="p-4 text-center text-slate-500">{empty}</td></tr> :
            shown.map((r, i) => <tr key={cur * pageSize + i} className="border-t border-slate-100 hover:bg-slate-50">{r.map((x, j) => <td key={j} className="px-3 py-2">{x}</td>)}</tr>)}</tbody></table>
      </div>
      {pages > 1 && <div className="flex items-center justify-end gap-2 mt-2 text-xs text-slate-500">
        <span>{cur * pageSize + 1}–{Math.min(rows.length, cur * pageSize + pageSize)} of {rows.length}</span>
        <button type="button" aria-label="Previous page" disabled={cur === 0} onClick={() => setPg(cur - 1)} className="p-1 rounded border border-slate-200 disabled:opacity-40"><ChevronLeft size={14} /></button>
        <button type="button" aria-label="Next page" disabled={cur >= pages - 1} onClick={() => setPg(cur + 1)} className="p-1 rounded border border-slate-200 disabled:opacity-40"><ChevronRight size={14} /></button>
      </div>}
    </div>
  );
}
function Steps({ labels, idx, onGo }) {
  return <div className="no-scrollbar flex flex-wrap mb-3 border-b border-slate-200">{labels.map((l, i) => (
    <button key={l} type="button" title={l} onClick={() => onGo(i)} className={`flex-1 min-w-fit px-1.5 py-1.5 ${labels.length > 9 ? "text-[13px]" : "text-sm"} whitespace-nowrap border-b-[3px] -mb-px transition-colors ${i === idx ? "border-[var(--accent)] text-[var(--accent)] font-semibold" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
      <span className={i === idx ? "" : "text-slate-400"}>{i + 1}.</span> {l}
    </button>
  ))}</div>;
}

/* Shows non-panel content always and one <Panel> at a time, chosen by tabs. */
function Paged({ children }) {
  const kids = React.Children.toArray(children).filter(Boolean);
  const panels = kids.filter((k) => k.type === Panel);
  const [i, setI] = useState(0);
  const cur = Math.min(i, panels.length - 1);
  const FIX = { yakap: "YAKAP", gamot: "GAMOT", ekonsulta: "eKonsulta", philhealth: "PhilHealth", emr: "EMR", fpe: "FPE", yes: "YES", prc: "PRC", or: "OR", vs: "vs" };
  const title = (t) => t.toLowerCase().split(" ").map((w) => FIX[w] || w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  let n = -1;
  return (
    <div className="space-y-4">
      {panels.length > 1 && <div className="flex flex-wrap gap-1 border-b border-slate-200">{panels.map((pnl, k) => <button key={k} type="button" onClick={() => setI(k)} className={`px-3 py-2 text-sm border-b-2 -mb-px ${k === cur ? "border-[var(--accent)] text-[var(--accent)] font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{title(pnl.props.title.split(" — ")[0])}</button>)}</div>}
      {kids.map((k) => { if (k.type !== Panel) return k; n++; return n === cur ? k : null; })}
    </div>
  );
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
  const [d, setD] = useState({ drug: "", qty: "", days: "", sig: "" });
  const [err, setErr] = useState("");
  const g = gamotOf(d.drug);
  const add = () => {
    if (!d.drug) return setErr("Please select a medicine from the GAMOT list.");
    if (!g) return setErr("Only medicines on the GAMOT list can be prescribed here.");
    if (!d.qty || +d.qty <= 0) return setErr("Please enter a valid quantity.");
    if (!d.days || +d.days <= 0) return setErr("Enter the number of days the supply covers.");
    if (g.limit && +d.days > g.limit) return setErr(`${g.name}: GAMOT dispensing limit is ${g.limit} days per prescription.`);
    if (!d.sig.trim()) return setErr("Enter strength, dosage and instructions (e.g. 500 mg tablet, 1 tab every 8 hours).");
    if (meds.some((m) => m.drug === d.drug)) return setErr("Medicine already added.");
    setMeds([...meds, { ...d, qty: +d.qty, days: +d.days, dispensed: false }]); setD({ drug: "", qty: "", days: "", sig: "" }); setErr("");
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-2"><span className="text-sm font-semibold">Prescription (GAMOT: eKonsulta 21 + YAKAP 54)</span>
        <a href={GAMOT_URL} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent)] flex items-center gap-1 hover:underline">PhilHealth circular <ExternalLink size={12} /></a></div>
      <div className="grid md:grid-cols-[2fr_80px_90px_2fr_auto] gap-2 items-end">
        <F label="Medicine"><select className={inp()} value={d.drug} onChange={(e) => setD({ ...d, drug: e.target.value })}><option value="">-- Select --</option>{GAMOT_CATS.map((cat) => <optgroup key={cat} label={cat}>{GAMOT.filter((x) => x.cat === cat).map((x) => <option key={x.name} value={x.name}>{x.name}{x.y21 ? "  (eKonsulta)" : "  (YAKAP)"}</option>)}</optgroup>)}</select></F>
        <F label="Qty"><input className={inp()} inputMode="numeric" value={d.qty} onChange={(e) => setD({ ...d, qty: e.target.value.replace(/\D/g, "") })} /></F>
        <F label="Days"><input className={inp()} inputMode="numeric" value={d.days} onChange={(e) => setD({ ...d, days: e.target.value.replace(/\D/g, "") })} /></F>
        <F label="Strength / instructions"><input className={inp()} placeholder="500 mg tab, 1 tab every 8 hrs" value={d.sig} onChange={(e) => setD({ ...d, sig: e.target.value })} /></F>
        <Btn v="green" onClick={add}><Plus size={14} />Add</Btn>
      </div>
      {g && <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap items-center gap-1"><ProgBadge g={g} />{g.y21 ? " one of the 21 eKonsulta medicines · " : " one of the 54 YAKAP medicines · "}{g.cat} · {g.ind} · Dispensing limit: {limitText(g)}</div>}
      {err && <div className="mt-2"><Notice>{err}</Notice></div>}
      <div className="mt-2"><Table pageSize={3} cols={["Medicine", "Qty", "Days", "Instructions", ""]} rows={meds.map((m, i) => [m.drug, m.qty, m.days || "—", m.sig, <button key={i} type="button" aria-label="Remove" onClick={() => setMeds(meds.filter((_, j) => j !== i))} className="text-rose-600"><Trash2 size={14} /></button>])} empty="No medicines added." /></div>
    </div>
  );
}

function GamotList() {
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [prog, setProg] = useState("");
  const rows = GAMOT.filter((g) => (!cat || g.cat === cat) && (!prog || progOf(g) === prog) && (g.name + " " + g.ind).toLowerCase().includes(q.toLowerCase()));
  const n21 = GAMOT.filter((g) => g.y21).length;
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <div className="relative flex-1 min-w-[200px]"><Search size={14} className="absolute left-2 top-3 text-slate-400" /><input className={inp() + " pl-7"} placeholder="Search medicine or indication" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className={inp() + " max-w-[200px]"} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{GAMOT_CATS.map((c) => <option key={c}>{c}</option>)}</select>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">{[["", `All (${GAMOT.length})`], ["eKonsulta", `eKonsulta (${n21})`], ["YAKAP", `YAKAP (${GAMOT.length - n21})`]].map(([v, l]) => <button key={v} type="button" onClick={() => setProg(v)} className={`px-3 py-2 ${prog === v ? "bg-[var(--accent)] text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>{l}</button>)}</div>
      </div>
      <Table pageSize={8} cols={["Medicine", "List", "Category", "Main indications", "Dispensing limit"]} rows={rows.map((g) => [g.name, <ProgBadge key="p" g={g} />, g.cat, <span key="i" className="text-xs text-slate-600">{g.ind}</span>, <span key="l" className="text-xs">{limitText(g)}</span>])} empty="No medicine matches." />
      <p className="mt-2 text-[11px] text-slate-400">75 GAMOT molecules from Annex A.1 of PhilHealth Circular PC2025-0013: the 21 eKonsulta (Konsulta) medicines plus 54 added under YAKAP. Dispensing limits from Annex B of the YAKAP clinical and pharmaceutical standards circular (<a className="underline" href={GAMOT_LIMITS_URL} target="_blank" rel="noreferrer">PC2026-0007</a>). Indications are abbreviated; confirm with the official circulars.</p>
    </>
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
// Role-aware dashboard: each role sees its own work queue, counts and only the actions it is allowed to use.
function HomeModule({ clients, go, clinic, onSync, role, me, payments }) {
  const st = clinicStatus(clinic);
  const cnt = (f) => clients.filter(f).length;
  const ps = (c) => patientStatus(c);
  const pendingLabs = (c) => c.labs.filter((l) => !l.result && !l.waived).length;
  const toDispense = (c) => c.meds.filter((m) => !m.dispensed).length;
  const openRefs = (c) => c.referrals.filter((r) => r.status !== "Closed").length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  // [label, number, hint, icon, page to open, tone]
  const S = {
    regs: ["Registered clients", clients.length, "", Users, "reg"],
    fpe: ["Need FPE", cnt((c) => !c.hsa), `${cnt((c) => c.fpeStarted && !c.hsa)} in progress`, ClipboardList, "hsa"],
    emp: ["Not yet empanelled", cnt((c) => !(c.emp && c.emp.verified)), "Empanel on the registration site", HeartHandshake, "reg"],
    care: ["Ready for consultation", cnt((c) => ps(c) === "Ready for Care"), "Empanelled, not yet consulted", Stethoscope, "consult"],
    labs: ["Pending lab results", clients.reduce((a, c) => a + pendingLabs(c), 0), `${cnt((c) => pendingLabs(c) > 0)} client(s)`, FlaskConical, "diag"],
    refs: ["Open referrals", clients.reduce((a, c) => a + openRefs(c), 0), "Follow-up tracking", Share2, "diag"],
    disp: ["To dispense", clients.reduce((a, c) => a + toDispense(c), 0), `${cnt((c) => toDispense(c) > 0)} client(s)`, Pill, "med"],
    ready: ["Ready to submit", cnt((c) => subStatus(c) === "Ready to Submit"), `${cnt((c) => subStatus(c) === "Pending Acknowledgment")} pending acknowledgment`, Send, "sub"],
    err: ["Submission errors", cnt((c) => subStatus(c) === "Validation Failed"), "Fix in EMR Submission", AlertTriangle, "sub", "bad"],
    clinic: ["Clinic readiness", readiness(clinic) + "%", st, Building2, "clinic", st === "Action Required" ? "bad" : ""],
    pay: ["Cheques to claim", payments.filter((p) => p.status === "Cheque Issued").length, `${payments.filter((p) => p.status !== "Payment Received").length} batch(es) not yet paid`, Wallet, "pay"],
  };
  const byRole = {
    doctor: ["care", "labs", "refs", "disp"], nurse: ["fpe", "emp", "labs", "disp"], encoder: ["regs", "fpe", "ready", "err"],
    admin: ["clinic", "ready", "err", "pay"], superadmin: ["clinic", "care", "ready", "err"],
  };
  // Work queue per role: clients needing this role's action.
  const queue = {
    doctor: clients.filter((c) => ps(c) === "Ready for Care" || pendingLabs(c) || openRefs(c)).map((c) => [c, ps(c) === "Ready for Care" ? ["Consult", "consult"] : pendingLabs(c) ? [`${pendingLabs(c)} result(s) pending`, "diag"] : ["Referral follow-up", "diag"]]),
    nurse: clients.filter((c) => !c.hsa || toDispense(c)).map((c) => [c, !c.hsa ? [c.fpeStarted ? "Finish FPE" : "Start FPE", "hsa"] : [`Dispense ${toDispense(c)}`, "med"]]),
    encoder: clients.filter((c) => !c.hsa || ["Ready to Submit", "Validation Failed"].includes(subStatus(c))).map((c) => [c, !c.hsa ? ["Encode FPE", "hsa"] : subStatus(c) === "Validation Failed" ? ["Fix errors", "sub"] : ["Submit", "sub"]]),
  }[role] || clients.filter((c) => c.hsa || c.consults.length || c.fpeStarted).map((c) => [c, null]);
  const title = { doctor: "My patients today", nurse: "Nursing work queue", encoder: "Encoding & submission queue" }[role] || "Patient encounters";
  const ACT = { reg: ["Sync clients", Users], hsa: ["Health screening", ClipboardList], emp: ["Empanelment", HeartHandshake], consult: ["Consultation", Stethoscope], diag: ["Lab results", FlaskConical], med: ["Dispense", Pill], sub: ["EMR submission", Send], clinic: ["Accreditation", Building2], pay: ["Payments", Wallet] };
  const order = { doctor: ["consult", "diag", "med"], nurse: ["hsa", "med", "reg"], encoder: ["hsa", "sub", "reg"], admin: ["clinic", "sub", "pay"], superadmin: ["consult", "reg", "clinic"] }[role] || ["reg"];
  const actions = order.filter((pg) => can(role, pg)).map((pg) => [pg, ...ACT[pg]]);
  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: "var(--banner)" }}>
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/20 mb-2">{HOSPITAL} · YAKAP / eKonsulta</span>
          <h2 className="text-xl font-bold tracking-tight">{greet}, {me.name}</h2>
          <p className="text-sm opacity-80 mt-1">{ROLES[role]} · {headerDate()}{can(role, "clinic") ? ` · Clinic: ${st} (${readiness(clinic)}% ready)` : ""}</p>
        </div>
        <div className="flex gap-2 flex-wrap">{actions.map(([pg, label, I], k) => <button key={pg} type="button" onClick={() => go(pg)} className={`inline-flex items-center gap-2 font-medium px-4 py-2 rounded-xl text-sm ${k === 0 ? "bg-white text-slate-800 hover:bg-slate-100" : "bg-white/15 hover:bg-white/25"}`}><I size={14} />{label}</button>)}</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{(byRole[role] || byRole.superadmin).map((k) => { const [label, n, hint, I, pg, tone] = S[k]; return (
        <button key={k} type="button" disabled={!can(role, pg)} onClick={() => go(pg)} className="text-left bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm hover:border-[var(--accent)] transition-colors disabled:cursor-default">
          <div className={`p-2 rounded-xl ${tone === "bad" && n ? "bg-rose-100 text-rose-600" : "bg-[var(--accent-soft)] text-[var(--accent)]"}`}><I size={18} /></div>
          <div className="min-w-0"><div className="text-2xl font-semibold leading-none">{n}</div><div className="text-xs text-slate-500 mt-1">{label}</div>{hint && <div className="text-[11px] text-slate-400 truncate">{hint}</div>}</div>
        </button>); })}</div>
      <Panel title={title.toUpperCase()} right={can(role, "sub") && role !== "doctor" && role !== "nurse" ? <button type="button" onClick={onSync} className="underline">Submit all ready records</button> : <span>{queue.length} client(s)</span>}>
        <Table pageSize={4} cols={["Client", "Encounter status", "EMR status", ""]} rows={queue.map(([c, act]) => [<div key="n"><div className="font-medium">{fullName(c)}</div><div className="text-[11px] text-slate-500">{calcAge(c.dob)} y/o · {c.sex} · {TYPES[c.type]}</div></div>, <Badge key="p" s={ps(c)} />, <Badge key="s" s={subStatus(c)} />, act && can(role, act[1]) ? <Btn key="a" v="white" onClick={() => go(act[1])}>{act[0]}<ChevronRight size={14} /></Btn> : null])} empty={role === "doctor" ? "No patients waiting for you." : "Nothing in your queue right now."} />
      </Panel>
    </div>
  );
}

/* ---------- Registered clients (synced from the partner registration website) ---------- */
// YAKAP tranches (amounts per client):
//   1st tranche ₱680  = doctor's consultation completed.
//   2nd tranche ₱1,020 = performance: every lab ordered for the client has a result.
const TRANCHE_RATE = { t1: 680, t2: 1020 };
const tranche1 = (c) => (c.consults.length ? { done: true, date: c.consults[0].date, amount: TRANCHE_RATE.t1 } : { done: false });
const tranche2 = (c) => {
  const labs = c.labs.filter((l) => !l.waived);
  if (!c.consults.length || !labs.length || labs.some((l) => !l.result)) return { done: false, pending: labs.filter((l) => !l.result).length };
  return { done: true, date: labs.map((l) => l.resultDate || l.date).sort().slice(-1)[0], amount: TRANCHE_RATE.t2 };
};
// Tranche amounts are financial data: only roles with PhilHealth Payments access (Super Admin, Admin) see them.
function Tranche({ t, showAmt }) { return t.done ? <span title={`Done ${t.date}${showAmt ? ` · ₱${t.amount.toLocaleString()}` : ""}`} className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 whitespace-nowrap">{showAmt ? `Done · ₱${t.amount.toLocaleString()}` : `Done · ${t.date.slice(5)}`}</span> : <span title={t.pending ? `${t.pending} lab result(s) pending` : ""} className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 whitespace-nowrap">{t.pending ? `${t.pending} lab pending` : "Not yet done"}</span>; }
const regKey = (c) => (c.pin ? "PIN:" + c.pin : `NM:${c.last}|${c.first}|${c.dob}`.toUpperCase());
// Merge clients from the registration site; keep local clinical data (FPE, consults, labs, meds...).
function mergeRegistry(prev, incoming) {
  const map = new Map(prev.map((c) => [regKey(c), c]));
  let added = 0, updated = 0;
  for (const r of incoming) {
    const emp = r.empanelled ? { choice: "YES", agree: true, date: r.empanelDate || r.regDate || todayISO(), verified: true, source: "registry" } : null;
    const reg = { extId: r.extId, pin: r.pin, last: r.last.toUpperCase(), first: r.first.toUpperCase(), middle: r.middle.toUpperCase(), ext: r.ext.toUpperCase(), dob: r.dob, sex: r.sex || "M", type: r.type,
      civil: r.civil, mobile: r.mobile, prov: r.prov, mun: r.mun, brgy: r.brgy, zip: r.zip, regDate: r.regDate, consent: r.consent, loa: r.loa, pcu: r.pcu, emp, fromRegistry: true };
    const k = regKey(reg); const old = map.get(k);
    if (old) { map.set(k, { ...old, ...reg }); updated++; }
    else { map.set(k, { ...mk(nid(), reg.last, reg.first, reg.middle, reg.dob, reg.sex, reg.type), ...reg }); added++; }
  }
  return { list: [...map.values()], added, updated };
}
function RegistrationModule({ clients, setClients, go, role }) {
  const toast = useToast(), log = useLog();
  const [info, setInfo] = useState({ mode: null, name: "registration site" });
  const [busy, setBusy] = useState(false); const [last, setLast] = useState(null);
  const [q, setQ] = useState(""); const [show, setShow] = useState("all");
  useEffect(() => { fetch("/api/registry").then((r) => r.json()).then(setInfo).catch(() => setInfo({ mode: "offline", name: "registration site" })); }, []);
  const sync = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/registry", { method: "POST" }); const d = await r.json();
      if (!r.ok) { toast(d.error || "Sync failed.", "error"); setBusy(false); return; }
      let res; setClients((p) => { res = mergeRegistry(p, d.clients); return res.list; });
      setLast(d.syncedAt);
      setTimeout(() => { toast(`Synced ${d.clients.length} client(s) from ${d.name}${d.mode === "demo" ? " (demo)" : ""}.`); log("Clients synced", `${d.name}: ${d.clients.length} client(s)${d.mode === "demo" ? " (demo)" : ""}`); }, 0);
    } catch { toast("Could not reach the registry connector.", "error"); }
    setBusy(false);
  };
  const rows = clients.filter((c) => (fullName(c) + " " + (c.pin || "")).toLowerCase().includes(q.toLowerCase()))
    .filter((c) => show === "all" || (show === "t1" && !tranche1(c).done) || (show === "t2" && tranche1(c).done && !tranche2(c).done) || (show === "emp" && !(c.emp && c.emp.verified)));
  const n1 = clients.filter((c) => tranche1(c).done).length, n2 = clients.filter((c) => tranche2(c).done).length;
  return (
    <Panel title={`REGISTERED CLIENTS (${clients.length})`} right={<span>1st tranche {n1}/{clients.length} · 2nd tranche {n2}/{clients.length}</span>}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Btn v="info" disabled={busy} onClick={sync}><Upload size={14} className="rotate-180" />{busy ? "Syncing…" : "Sync clients"}</Btn>
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${info.mode === "live" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{info.mode === "live" ? `Connected: ${info.name}` : info.mode === "demo" ? "Demo list (not connected to the registration site yet)" : "Checking connector…"}</span>
        <span className="text-[11px] text-slate-400">{last ? `Last sync ${new Date(last).toLocaleString()}` : "Not synced in this session"}</span>
        <div className="relative flex-1 min-w-[200px] ml-auto"><Search size={14} className="absolute left-2 top-3 text-slate-400" /><input className={inp() + " pl-7"} placeholder="Search name or PIN" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">{[["all", "All"], ["t1", "1st tranche pending"], ["t2", "2nd tranche pending"], ["emp", "Not empanelled"]].map(([v, l]) => <button key={v} type="button" onClick={() => setShow(v)} className={`px-3 py-2 ${show === v ? "bg-[var(--accent)] text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>{l}</button>)}</div>
        <span className="text-[11px] text-slate-400 ml-auto">Registration, empanelment and consents are managed on the registration site.</span>
      </div>
      <Table key={q + show} pageSize={6} cols={["PIN", "Name", "Type", "Age/Sex", "Barangay", "Empanelled", "1st tranche", "2nd tranche"]} rows={rows.map((c) => [
        <span key="p" className="whitespace-nowrap text-xs">{c.pin || "—"}</span>, <span key="n" className="font-medium whitespace-nowrap" title={c.pcu || ""}>{fullName(c)}</span>, <span key="t" className="text-xs">{TYPES[c.type]}</span>, <span key="g" className="whitespace-nowrap">{calcAge(c.dob)} / {c.sex}</span>, <span key="a" className="text-xs whitespace-nowrap" title={[c.brgy, c.mun, c.prov].filter(Boolean).join(", ")}>{c.brgy || "—"}</span>,
        c.emp && c.emp.verified ? <span key="e" className="text-xs text-emerald-700 whitespace-nowrap" title={c.emp.date || ""}>Yes</span> : <span key="e" className="text-xs text-amber-700 whitespace-nowrap">Not yet</span>,
        <Tranche key="t1" t={tranche1(c)} showAmt={can(role, "pay")} />, <Tranche key="t2" t={tranche2(c)} showAmt={can(role, "pay")} />])} empty="No clients. Click Sync clients." />
      <p className="mt-2 text-[11px] text-slate-400">{can(role, "pay") ? "1st tranche ₱680: doctor's consultation completed · 2nd tranche ₱1,020: performance, all ordered labs have results." : "1st tranche: doctor's consultation completed · 2nd tranche: performance, all ordered labs have results."}</p>
    </Panel>
  );
}

/* ---------- HSA: Health Screening & Assessment Record (First Patient Encounter) ---------- */
const HX_ITEMS = ["Allergy", "Asthma", "Cancer", "Cerebrovascular Disease", "Coronary Artery Disease", "Diabetes Mellitus", "Emphysema", "Epilepsy / Seizure Disorder", "Hepatitis", "Hyperlipidemia", "Hypertension", "Peptic Ulcer", "Pneumonia", "Thyroid Disease", "Pulmonary Tuberculosis", "Extrapulmonary Tuberculosis", "Urinary Tract Infection", "Mental Illness", "Others", "None"];
const IMM = {
  child: ["BCG", "OPV1", "OPV2", "OPV3", "DPT1", "DPT2", "DPT3", "Measles", "Hepatitis B1", "Hepatitis B2", "Hepatitis B3", "Hepatitis A", "Varicella (Chicken Pox)", "None"],
  adult: ["HPV", "MMR", "None"], preg: ["Tetanus Toxoid", "None"], elder: ["Pneumococcal Vaccine", "Flu Vaccine", "None"],
};
const SYSTEMS = [
  ["heent", "A. HEENT", ["Essentially normal", "Abnormal pupillary reaction", "Cervical lymphadenopathy", "Dry mucous membrane", "Icteric sclerae", "Pale conjunctivae", "Sunken eyeballs", "Sunken fontanelle"]],
  ["chest", "B. Chest / Breast / Lungs", ["Essentially normal", "Asymmetrical chest expansion", "Decreased breath sounds", "Wheezes", "Lumps over breast(s)", "Crackles / rales", "Retractions"]],
  ["heart", "C. Heart", ["Essentially normal", "Displaced apex beat", "Heaves / thrills", "Irregular rhythm", "Muffled heart sounds", "Murmurs", "Pericardial bulge"]],
  ["abdomen", "D. Abdomen", ["Essentially normal", "Abdominal rigidity", "Abdominal tenderness", "Hyperactive bowel sounds", "Palpable mass(es)", "Tympanitic / dull abdomen", "Uterine contraction"]],
  ["gu", "E. Genitourinary", ["Essentially normal", "Blood stained in exam finger", "Cervical dilatation", "Presence of abnormal discharge"]],
  ["dre", "F. Digital Rectal Examination", ["Essentially normal", "Enlarge prostate", "Mass", "Hemorrhoids", "Pus", "Not applicable"]],
  ["skin", "G. Skin / Extremities", ["Essentially normal", "Clubbing", "Cold clammy", "Cyanosis / mottled skin", "Edema / swelling", "Decreased mobility", "Pale nailbeds", "Poor skin turgor", "Rashes / petechiae", "Weak pulses"]],
  ["neuro", "H. Neurological Examination", ["Essentially normal", "Abnormal gait", "Abnormal position sense", "Abnormal sensation", "Abnormal reflex(es)", "Poor / altered memory", "Poor muscle tone / strength", "Poor coordination"]],
];
const EXCLUSIVE = ["None", "Essentially normal", "Not applicable"];
const BLOOD = ["A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-"];
const ANGINA = [
  "Have you had any pain or discomfort or any pressure or heaviness in your chest?",
  "Do you get the pain in the center of the chest or left arm?",
  "Do you get it when you walk uphill or hurry?",
  "Do you slow down if you get the pain while walking?",
  "Does the pain go away if you stand still or if you take a tablet under the tongue?",
  "Does the pain go away in less than 10 minutes?",
  "Have you ever had a severe chest pain across the front of your chest lasting for half an hour or more?",
];
const RISK_LEVELS = ["<10%", "10% to <20%", "20% to <30%", "30% to <40%", "≥40%"];
const YN = [["Y", "Yes"], ["N", "No"]];
const blankHx = () => ({ items: [], allergy: "", bpS: "", bpD: "", others: "", cancer: "", ptb: "", hep: "", eptb: "" });
const blankHsa = () => ({
  atc: "", date: todayISO(), pmh: blankHx(), surg: [], fam: blankHx(),
  social: { smoke: "", packs: "", alcohol: "", bottles: "", drugs: "", sexActive: "" },
  imm: { child: [], adult: [], preg: [], elder: [], others: "" },
  fp: "", mens: { app: "", menarche: "", sexOnset: "", menopause: "", menoAge: "", lmp: "", method: "", duration: "", cycle: "", pads: "" },
  preg: { app: "", g: "", p: "", type: "", full: "", prem: "", abort: "", living: "", preEc: false },
  v: { blood: "", survey: "" }, pe: {}, peOther: {},
  ncd: {}, labs: [], notes: "",
});
const ageMonths = (iso) => { const t = new Date(todayISO()), d = new Date(iso); return (t.getFullYear() - d.getFullYear()) * 12 + t.getMonth() - d.getMonth() - (t.getDate() < d.getDate() ? 1 : 0); };
const toggleExclusive = (list, opt, on) => { if (!on) return list.filter((x) => x !== opt); if (EXCLUSIVE.includes(opt)) return [opt]; return [...list.filter((x) => !EXCLUSIVE.includes(x)), opt]; };
const numOnly = (s) => s.replace(/[^0-9.]/g, "");

function CheckGrid({ options, value, onChange, cols = 4 }) {
  return <div className={`grid grid-cols-2 ${cols === 4 ? "md:grid-cols-4" : "md:grid-cols-3"} gap-x-4 gap-y-1`}>{options.map((o) => <Check key={o} checked={value.includes(o)} onChange={(on) => onChange(toggleExclusive(value, o, on))} label={o} />)}</div>;
}
function Sec({ title, children, note }) {
  return <div className="space-y-2"><div className="flex items-center gap-2"><h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">{title}</h4>{note && <span className="text-[11px] text-slate-400">{note}</span>}</div>{children}</div>;
}
function Unit({ u, children }) { return <div className="flex items-center gap-1.5">{children}<span className="text-xs text-slate-500 shrink-0">{u}</span></div>; }
function HistoryBlock({ hx, set }) {
  const has = (x) => hx.items.includes(x);
  const f = (k, label) => <F label={label} req><input className={inp()} value={hx[k]} onChange={(e) => set({ ...hx, [k]: e.target.value })} /></F>;
  return (
    <div className="space-y-3">
      <CheckGrid options={HX_ITEMS} value={hx.items} onChange={(items) => set({ ...hx, items })} />
      <div className="grid md:grid-cols-3 gap-3">
        {has("Allergy") && f("allergy", "Specify allergy")}
        {has("Hypertension") && <F label="Highest blood pressure" req><Unit u="mmHg"><input className={inp()} inputMode="numeric" placeholder="Sys" value={hx.bpS} onChange={(e) => set({ ...hx, bpS: numOnly(e.target.value) })} /><span>/</span><input className={inp()} inputMode="numeric" placeholder="Dia" value={hx.bpD} onChange={(e) => set({ ...hx, bpD: numOnly(e.target.value) })} /></Unit></F>}
        {has("Others") && f("others", "Others, please specify")}
        {has("Cancer") && f("cancer", "Specify organ with cancer")}
        {has("Pulmonary Tuberculosis") && f("ptb", "Specify pulmonary tuberculosis category")}
        {has("Hepatitis") && f("hep", "Specify hepatitis type")}
        {has("Extrapulmonary Tuberculosis") && f("eptb", "Specify extrapulmonary tuberculosis category")}
      </div>
    </div>
  );
}
function hxErr(hx, label) {
  if (!hx.items.length) return `${label}: tick at least one item, or "None".`;
  const need = [["Allergy", "allergy", "specify the allergy"], ["Others", "others", "specify Others"], ["Cancer", "cancer", "specify the organ with cancer"], ["Pulmonary Tuberculosis", "ptb", "specify the pulmonary TB category"], ["Hepatitis", "hep", "specify the hepatitis type"], ["Extrapulmonary Tuberculosis", "eptb", "specify the extrapulmonary TB category"]];
  for (const [item, k, msg] of need) if (hx.items.includes(item) && !hx[k].trim()) return `${label}: ${msg}.`;
  if (hx.items.includes("Hypertension")) { if (!hx.bpS || !hx.bpD) return `${label}: enter the highest blood pressure.`; if (+hx.bpS <= +hx.bpD) return `${label}: systolic must be higher than diastolic.`; }
  return "";
}
const HSA_STEPS = [
  ["profile", "Medical Hx"], ["family", "Family Hx"], ["social", "Social"], ["imm", "Immunization"],
  ["women", "Women's"], ["pe", "Vitals"], ["sysA", "Findings A–D"], ["sysB", "Findings E–H"], ["ncd", "NCD"], ["ncd2", "Angina/Stroke"], ["review", "Review"],
];
function hsaTabErr(h, id, c) {
  const age = calcAge(c.dob);
  if (id === "profile") {
    if (!h.date) return "Health screening & assessment date is required."; if (isFuture(h.date)) return "Assessment date cannot be in the future.";
    return hxErr(h.pmh, "Past medical history");
  }
  if (id === "family") {
    for (const s of h.surg) { if (!s.op.trim()) return "Past surgical history: enter the operation or remove the row."; if (s.date && isFuture(s.date)) return "Past surgical history: date cannot be in the future."; }
    return hxErr(h.fam, "Family history");
  }
  if (id === "social") {
    const s = h.social;
    if (!s.smoke) return "Select smoking status."; if ((s.smoke === "Y" || s.smoke === "Q") && !s.packs) return "Enter the number of packs per year.";
    if (!s.alcohol) return "Select alcohol status."; if ((s.alcohol === "Y" || s.alcohol === "Q") && !s.bottles) return "Enter the number of bottles per day.";
    if (!s.drugs) return "Select illicit drugs (Yes / No)."; if (!s.sexActive) return "Sexual history screening: select whether sexually active.";
  }
  if (id === "women") {
    const m = h.mens, p = h.preg;
    if (!h.fp) return "Family planning: select whether the client has access to counselling.";
    if (!m.app) return "Menstrual history: select Applicable or Not applicable.";
    if (m.app === "Y") {
      if (!m.menarche) return "Menstrual history: enter age at menarche."; if (+m.menarche > age) return "Age at menarche cannot be greater than the client's age.";
      if (m.sexOnset && +m.sexOnset > age) return "Onset of sexual intercourse cannot be greater than the client's age.";
      if (!m.lmp) return "Menstrual history: last menstrual period is required."; if (isFuture(m.lmp)) return "Last menstrual period cannot be in the future.";
      if (!m.menopause) return "Menstrual history: select Menopause Yes or No."; if (m.menopause === "Y" && !m.menoAge) return "Enter the age at menopause.";
      if (m.menoAge && +m.menoAge > age) return "Age at menopause cannot be greater than the client's age.";
    }
    if (!p.app) return "Pregnancy history: select Applicable or Not applicable.";
    if (p.app === "Y") {
      if (p.g === "" || p.p === "") return "Pregnancy history: gravidity and parity are required.";
      if (+p.p > +p.g) return "Parity cannot be greater than gravidity.";
      if ((+p.full || 0) + (+p.prem || 0) > +p.p) return "Full term + premature cannot exceed parity.";
      if ((+p.abort || 0) + (+p.p) > +p.g) return "Parity + abortions cannot exceed gravidity.";
    }
  }
  if (id === "pe") {
    const v = h.v;
    if (!v.sys || !v.dia) return "Blood pressure is required."; if (+v.sys <= +v.dia) return "Systolic must be higher than diastolic.";
    if (!v.rr) return "Respiratory rate is required."; if (!v.height) return "Height is required."; if (!v.temp) return "Temperature is required.";
    if (+v.temp < 30 || +v.temp > 45) return "Temperature looks wrong (expected 30–45 °C)."; if (!v.hr) return "Heart rate is required."; if (!v.weight) return "Weight is required.";
    if (ageMonths(c.dob) <= 24 && (!v.length || !v.headC)) return "Pediatric client (0–24 months): length and head circumference are required.";
    if (!v.survey) return "General survey: select Awake and alert or Altered sensorium."; if (v.survey === "Altered" && !(v.surveyRemarks || "").trim()) return "Enter altered sensorium remarks.";
  }
  if (id === "sysA") return systemsErr(SYS_A, h.pe, h.peOther);
  if (id === "sysB") return systemsErr(SYS_B, h.pe, h.peOther);
  if (id === "ncd") {
    const n = h.ncd;
    for (const [k, l] of [["fat", "High fat / high salt food intake"], ["veg", "Vegetables daily"], ["fruit", "Fruits daily"], ["act", "Physical activity"]]) if (!n[k]) return `NCD: answer "${l}".`;
    if (!n.dm) return "NCD: answer whether the patient was diagnosed as having diabetes.";
    if (n.dm === "Y" && !n.dmMed) return "NCD: select With or Without medication.";
    if (n.dm !== "Y") for (const [k, l] of [["phagia", "Polyphagia"], ["dipsia", "Polydipsia"], ["uria", "Polyuria"]]) if (!n[k]) return `NCD: answer ${l}.`;
    for (const [k, val, dt, l] of [["glu", "fbs", "fbsDate", "raised blood glucose (FBS/RBS)"], ["lip", "chol", "cholDate", "raised blood lipids (total cholesterol)"], ["ket", "ketVal", "ketDate", "urine ketones"], ["pro", "proVal", "proDate", "urine protein"]]) {
      if (!n[k]) return `NCD: answer presence of ${l.split(" (")[0]}.`;
      if (n[k] === "Y" && (!n[val] || !n[dt])) return `NCD: enter the result and date taken for ${l}.`;
      if (n[dt] && isFuture(n[dt])) return `NCD: date taken for ${l} cannot be in the future.`;
    }
  }
  if (id === "ncd2") {
    const n = h.ncd;
    if (!n.angina) return "Answer: Angina or heart attack (Yes / No).";
    for (let q = 1; q <= 7; q++) { if (anginaSkipped(n, q)) continue; if (!n["q" + q]) return `Angina questionnaire: answer question ${q}.`; }
    if (!n.stroke) return "Answer: Stroke and TIA (Yes / No)."; if (!n.q8) return "Answer question 8 (stroke / TIA symptoms).";
    if (!n.risk) return "Select the risk level.";
  }
  return "";
}
// Q1 = No or Q2 = No → go to question 8.
const anginaSkipped = (n, q) => (q >= 2 && n.q1 === "N") || (q >= 3 && n.q2 === "N");
const anginaFlag = (n) => [3, 4, 5, 6, 7].some((q) => !anginaSkipped(n, q) && n["q" + q] === "Y");

function HSAModule({ clients, setClients }) {
  const [sel, setSel] = useState(null);
  const c = clients.find((x) => x.id === sel);
  return (
    <div>
      {!c ? <Panel title="HEALTH SCREENING & ASSESSMENT (FIRST PATIENT ENCOUNTER)"><ClientPicker clients={clients} value={sel} onChange={setSel} /></Panel>
        : <HSAWizard key={c.id} c={c} back={() => setSel(null)} started={() => setClients((p) => p.map((x) => x.id === c.id && !x.fpeStarted ? { ...x, fpeStarted: true } : x))} save={(h) => setClients((p) => p.map((x) => x.id === c.id ? { ...x, hsa: h } : x))} />}
    </div>
  );
}

function HSAWizard({ c, back, save, started }) {
  const toast = useToast(); const log = useLog();
  const [h, setH] = useState(() => { const b = blankHsa(); return c.hsa ? { ...b, ...clone(c.hsa) } : b; });
  const [step, setStep] = useState("profile");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [ask, setAsk] = useState(false);
  const locked = !!c.hsa || done;
  const age = calcAge(c.dob), months = ageMonths(c.dob);
  const steps = HSA_STEPS.filter(([id]) => (id !== "women" || c.sex === "F") && ((id !== "ncd" && id !== "ncd2") || age >= 25));
  const pos = steps.findIndex(([id]) => id === step);
  const upd = (k, v) => setH((p) => ({ ...p, [k]: v }));
  const sub = (k) => (f, v) => setH((p) => ({ ...p, [k]: { ...p[k], [f]: v } }));
  const setSoc = sub("social"), setImm = sub("imm"), setMens = sub("mens"), setPreg = sub("preg"), setV = sub("v"), setN = sub("ncd");
  const go = (dir) => {
    if (dir > 0 && !locked) { const e = hsaTabErr(h, step, c); if (e) return setErr(e); if (started) started(); }
    setErr(""); const n = steps[pos + dir]; if (n) setStep(n[0]);
  };
  const final = () => { for (const [id] of steps) { const e = hsaTabErr(h, id, c); if (e) { setStep(id); return setErr(e); } } setErr(""); setAsk(true); };
  const num = (obj, setter, k, ph = "") => <input className={inp()} inputMode="decimal" placeholder={ph} value={obj[k] || ""} onChange={(e) => setter(k, numOnly(e.target.value))} />;
  const yn = (obj, setter, k, opts = YN) => <Radios value={obj[k] || ""} onChange={(v) => setter(k, v)} options={opts} />;
  const bmi = bmiOf(h.v.height, h.v.weight);
  const n = h.ncd;
  const sympYes = ["phagia", "dipsia", "uria"].filter((k) => n[k] === "Y").length;
  const mmol = n.fbs && !isNaN(parseFloat(n.fbs)) ? (parseFloat(n.fbs) / 18.02).toFixed(1) : "";

  return (
    <Panel title={`HEALTH SCREENING & ASSESSMENT RECORD — ${fullName(c)} (${age} y/o, ${c.sex === "F" ? "Female" : "Male"})`} right={<button type="button" onClick={back} className="underline">Change client</button>}>
      {locked && <div className="mb-3"><Notice kind="info">Health screening already saved for this client (read-only).</Notice></div>}
      <Steps labels={steps.map(([, l]) => l)} idx={pos} onGo={(p) => { setErr(""); setStep(steps[p][0]); }} />
      <fieldset disabled={locked} className="space-y-5">
        {step === "profile" && <>
          <Sec title="Client profile"><div className="grid md:grid-cols-3 gap-3">
            <F label="Authorization Transaction Code"><input className={inp()} value={h.atc} onChange={(e) => upd("atc", e.target.value.toUpperCase())} /></F>
            <F label="Health Screening & Assessment Date" req><input type="date" className={inp()} value={h.date} onChange={(e) => upd("date", e.target.value)} /></F>
          </div></Sec>
          <Sec title="Past medical history *"><HistoryBlock hx={h.pmh} set={(v) => upd("pmh", v)} /></Sec>
        </>}
        {step === "family" && <>
          <Sec title="Past surgical history">
            {h.surg.map((s, k) => <div key={k} className="grid grid-cols-[1fr_180px_auto] gap-2 items-end">
              <F label="Operation"><input className={inp()} value={s.op} onChange={(e) => upd("surg", h.surg.map((x, j) => (j === k ? { ...x, op: e.target.value } : x)))} /></F>
              <F label="Date"><input type="date" className={inp()} value={s.date} onChange={(e) => upd("surg", h.surg.map((x, j) => (j === k ? { ...x, date: e.target.value } : x)))} /></F>
              <button type="button" aria-label="Remove operation" onClick={() => upd("surg", h.surg.filter((_, j) => j !== k))} className="p-2 text-rose-600"><Trash2 size={16} /></button>
            </div>)}
            <Btn v="white" onClick={() => upd("surg", [...h.surg, { op: "", date: "" }])}><Plus size={14} />Add operation</Btn>
          </Sec>
          <Sec title="Family history *"><HistoryBlock hx={h.fam} set={(v) => upd("fam", v)} /></Sec>
        </>}
        {step === "social" && <div className="grid md:grid-cols-3 gap-5">
          <div className="space-y-2"><F label="Smoking" req>{yn(h.social, setSoc, "smoke", [["Y", "Yes"], ["N", "No"], ["Q", "Quit"]])}</F>{(h.social.smoke === "Y" || h.social.smoke === "Q") && <F label="No. of packs / year" req>{num(h.social, setSoc, "packs")}</F>}</div>
          <div className="space-y-2"><F label="Alcohol" req>{yn(h.social, setSoc, "alcohol", [["Y", "Yes"], ["N", "No"], ["Q", "Quit"]])}</F>{(h.social.alcohol === "Y" || h.social.alcohol === "Q") && <F label="No. of bottles / day" req>{num(h.social, setSoc, "bottles")}</F>}</div>
          <div className="space-y-3"><F label="Illicit drugs" req>{yn(h.social, setSoc, "drugs")}</F><F label="Sexual history screening: sexually active" req>{yn(h.social, setSoc, "sexActive")}</F></div>
        </div>}
        {step === "imm" && <>
          <Sec title="For children"><CheckGrid options={IMM.child} value={h.imm.child} onChange={(v) => setImm("child", v)} /></Sec>
          <div className="grid md:grid-cols-3 gap-5">
            <Sec title="For adult"><CheckGrid cols={3} options={IMM.adult} value={h.imm.adult} onChange={(v) => setImm("adult", v)} /></Sec>
            <Sec title="For pregnant women"><CheckGrid cols={3} options={IMM.preg} value={h.imm.preg} onChange={(v) => setImm("preg", v)} /></Sec>
            <Sec title="For elderly"><CheckGrid cols={3} options={IMM.elder} value={h.imm.elder} onChange={(v) => setImm("elder", v)} /></Sec>
          </div>
          <F label="Others, please specify"><textarea rows={2} className={inp()} value={h.imm.others} onChange={(e) => setImm("others", e.target.value)} /></F>
        </>}
        {step === "women" && <>
          <Sec title="Family planning *"><F label="With access to family planning counselling?">{yn(h, (k, v) => upd(k, v), "fp")}</F></Sec>
          <Sec title="Menstrual history *">
            {yn(h.mens, setMens, "app", [["Y", "Applicable"], ["N", "Not applicable"]])}
            {h.mens.app === "Y" && <div className="grid md:grid-cols-4 gap-3">
              <F label="Menarche" req><Unit u="yrs. old">{num(h.mens, setMens, "menarche")}</Unit></F>
              <F label="Onset of sexual intercourse"><Unit u="yrs. old">{num(h.mens, setMens, "sexOnset")}</Unit></F>
              <F label="Menopause?" req>{yn(h.mens, setMens, "menopause")}</F>
              {h.mens.menopause === "Y" ? <F label="If yes, what age?" req><Unit u="yrs. old">{num(h.mens, setMens, "menoAge")}</Unit></F> : <div />}
              <F label="Last menstrual period" req><input type="date" className={inp()} value={h.mens.lmp} onChange={(e) => setMens("lmp", e.target.value)} /></F>
              <F label="Birth control method"><input className={inp()} value={h.mens.method} onChange={(e) => setMens("method", e.target.value)} /></F>
              <F label="Period duration"><Unit u="days">{num(h.mens, setMens, "duration")}</Unit></F>
              <F label="Interval cycle"><Unit u="days">{num(h.mens, setMens, "cycle")}</Unit></F>
              <F label="No. of pads/day during menstruation">{num(h.mens, setMens, "pads")}</F>
            </div>}
          </Sec>
          <Sec title="Pregnancy history *">
            {yn(h.preg, setPreg, "app", [["Y", "Applicable"], ["N", "Not applicable"]])}
            {h.preg.app === "Y" && <div className="grid md:grid-cols-4 gap-3">
              <F label="Gravidity (no. of pregnancy)" req>{num(h.preg, setPreg, "g")}</F>
              <F label="Parity (no. of delivery)" req>{num(h.preg, setPreg, "p")}</F>
              <F label="Type of delivery" className="md:col-span-2"><input className={inp()} value={h.preg.type} onChange={(e) => setPreg("type", e.target.value)} placeholder="e.g. NSD, CS" /></F>
              <F label="No. of full term">{num(h.preg, setPreg, "full")}</F>
              <F label="No. of premature">{num(h.preg, setPreg, "prem")}</F>
              <F label="No. of abortion">{num(h.preg, setPreg, "abort")}</F>
              <F label="No. of living children">{num(h.preg, setPreg, "living")}</F>
              <div className="md:col-span-4"><Check checked={h.preg.preEc} onChange={(v) => setPreg("preEc", v)} label="Pregnancy-induced hypertension (Pre-eclampsia)" /></div>
            </div>}
          </Sec>
        </>}
        {step === "pe" && <>
          <div className="grid md:grid-cols-4 gap-3">
            <F label="Blood pressure" req><Unit u="mmHg">{num(h.v, setV, "sys", "Sys")}<span>/</span>{num(h.v, setV, "dia", "Dia")}</Unit></F>
            <F label="Respiratory rate" req><Unit u="/min">{num(h.v, setV, "rr")}</Unit></F>
            <F label="Height" req><Unit u="cm"><input className={inp()} inputMode="decimal" value={h.v.height || ""} onChange={(e) => setV("height", numOnly(e.target.value))} /></Unit><div className="mt-1"><Unit u="inch"><input className={inp()} inputMode="decimal" value={h.v.height ? (h.v.height / 2.54).toFixed(1) : ""} onChange={(e) => setV("height", e.target.value ? (parseFloat(numOnly(e.target.value)) * 2.54).toFixed(1) : "")} /></Unit></div></F>
            <F label="Temperature" req><Unit u="°C">{num(h.v, setV, "temp")}</Unit></F>
            <F label="Heart rate" req><Unit u="/min">{num(h.v, setV, "hr")}</Unit></F>
            <F label="Visual acuity"><Unit u=""><input className={inp()} placeholder="Left eye" value={h.v.vaL || ""} onChange={(e) => setV("vaL", e.target.value)} /><span>/</span><input className={inp()} placeholder="Right eye" value={h.v.vaR || ""} onChange={(e) => setV("vaR", e.target.value)} /></Unit></F>
            <F label="Weight" req><Unit u="kg"><input className={inp()} inputMode="decimal" value={h.v.weight || ""} onChange={(e) => setV("weight", numOnly(e.target.value))} /></Unit><div className="mt-1"><Unit u="lb"><input className={inp()} inputMode="decimal" value={h.v.weight ? (h.v.weight * 2.20462).toFixed(1) : ""} onChange={(e) => setV("weight", e.target.value ? (parseFloat(numOnly(e.target.value)) / 2.20462).toFixed(1) : "")} /></Unit></div></F>
            <F label="BMI"><div className="px-3 py-2 text-sm bg-slate-50 rounded-lg border border-slate-200">{bmi ?? "—"} <span className="text-slate-500">({bmiLabel(bmi)})</span></div></F>
          </div>
          {months <= 24 && <Sec title="Pediatric client aged 0–24 months"><div className="grid md:grid-cols-3 gap-3">
            <F label="Length" req><Unit u="cm">{num(h.v, setV, "length")}</Unit></F><F label="Head circumference" req><Unit u="cm">{num(h.v, setV, "headC")}</Unit></F><F label="Skinfold thickness"><Unit u="cm">{num(h.v, setV, "skinfold")}</Unit></F>
          </div></Sec>}
          <Sec title="Body circumference"><div className="grid md:grid-cols-4 gap-3">
            <F label="Waist"><Unit u="cm">{num(h.v, setV, "waist")}</Unit></F><F label="Hip"><Unit u="cm">{num(h.v, setV, "hip")}</Unit></F><F label="Limbs"><Unit u="cm">{num(h.v, setV, "limbs")}</Unit></F><F label="Middle & upper arm circumference"><Unit u="cm">{num(h.v, setV, "muac")}</Unit></F>
          </div></Sec>
          <div className="grid md:grid-cols-2 gap-5">
            <Sec title="Blood type">{yn(h.v, setV, "blood", BLOOD.map((b) => [b, b]))}</Sec>
            <Sec title="General survey *">{yn(h.v, setV, "survey", [["Awake", "Awake and alert"], ["Altered", "Altered sensorium"]])}{h.v.survey === "Altered" && <input className={inp()} placeholder="Altered sensorium remarks" value={h.v.surveyRemarks || ""} onChange={(e) => setV("surveyRemarks", e.target.value)} />}</Sec>
          </div>
        </>}
        {(step === "sysA" || step === "sysB") && <SystemsBlock keys={step === "sysA" ? SYS_A : SYS_B} pe={h.pe} peOther={h.peOther} setPe={(v) => upd("pe", v)} setOther={(v) => upd("peOther", v)} />}
        {step === "ncd" && <div className="space-y-5">
          <div className="grid md:grid-cols-4 gap-4">
            <F label="High fat / high salt food intake: processed or fast foods weekly?" req>{yn(n, setN, "fat")}</F>
            <F label="Dietary fiber: 3 servings vegetables daily" req>{yn(n, setN, "veg")}</F>
            <F label="Dietary fiber: 2–3 servings fruits daily" req>{yn(n, setN, "fruit")}</F>
            <F label="Physical activity: at least 2.5 hours a week of moderate-intensity activity?" req>{yn(n, setN, "act")}</F>
          </div>
          <Sec title="Presence or absence of diabetes">
            <div className="grid md:grid-cols-2 gap-4">
              <F label="1. Was the patient diagnosed as having diabetes?" req>{yn(n, setN, "dm", [["Y", "Yes"], ["N", "No"], ["U", "Do not know"]])}</F>
              {n.dm === "Y" && <F label="If yes" req>{yn(n, setN, "dmMed", [["With", "With medication"], ["Without", "Without medication"]])}<div className="text-[11px] text-amber-700 mt-1">Perform urine test for ketones.</div></F>}
            </div>
            {n.dm && n.dm !== "Y" && <div className="grid md:grid-cols-3 gap-4"><F label="2. Polyphagia" req>{yn(n, setN, "phagia")}</F><F label="Polydipsia" req>{yn(n, setN, "dipsia")}</F><F label="Polyuria" req>{yn(n, setN, "uria")}</F></div>}
            {sympYes >= 2 && <Notice kind="info">Two or more symptoms are present: perform a blood glucose test.</Notice>}
          </Sec>
          <div className="grid md:grid-cols-2 gap-5">
            <Sec title="Raised blood glucose">{yn(n, setN, "glu")}{n.glu === "Y" && <div className="grid grid-cols-3 gap-2"><F label="FBS / RBS" req><Unit u="mg/dL">{num(n, setN, "fbs")}</Unit></F><F label=" "><div className="flex items-center gap-1.5"><div className="px-3 py-2 text-sm bg-slate-50 rounded-lg border border-slate-200 w-full">{mmol || "—"}</div><span className="text-xs text-slate-500">mmol/L</span></div></F><F label="Date taken" req><input type="date" className={inp()} value={n.fbsDate || ""} onChange={(e) => setN("fbsDate", e.target.value)} /></F></div>}</Sec>
            <Sec title="Raised blood lipids">{yn(n, setN, "lip")}{n.lip === "Y" && <div className="grid grid-cols-2 gap-2"><F label="Total cholesterol" req>{num(n, setN, "chol")}</F><F label="Date taken" req><input type="date" className={inp()} value={n.cholDate || ""} onChange={(e) => setN("cholDate", e.target.value)} /></F></div>}</Sec>
            <Sec title="Presence of urine ketones">{yn(n, setN, "ket")}{n.ket === "Y" && <div className="grid grid-cols-2 gap-2"><F label="Urine ketone" req><input className={inp()} value={n.ketVal || ""} onChange={(e) => setN("ketVal", e.target.value)} /></F><F label="Date taken" req><input type="date" className={inp()} value={n.ketDate || ""} onChange={(e) => setN("ketDate", e.target.value)} /></F></div>}</Sec>
            <Sec title="Presence of protein">{yn(n, setN, "pro")}{n.pro === "Y" && <div className="grid grid-cols-2 gap-2"><F label="Urine protein" req><input className={inp()} value={n.proVal || ""} onChange={(e) => setN("proVal", e.target.value)} /></F><F label="Date taken" req><input type="date" className={inp()} value={n.proDate || ""} onChange={(e) => setN("proDate", e.target.value)} /></F></div>}</Sec>
          </div>
        </div>}
        {step === "ncd2" && <div className="space-y-4">
          <Sec title="Questionnaire to determine probable angina, heart attack, stroke or TIA">
            <F label="Angina or heart attack" req>{yn(n, setN, "angina")}</F>
            <div className="space-y-1">{ANGINA.map((q, k) => { const no = k + 1; const skip = anginaSkipped(n, no); return (
              <div key={no} className={`grid md:grid-cols-[1fr_200px] gap-2 items-center text-[13px] ${skip ? "opacity-40" : ""}`}><span>{no}. {q}{(no === 1 || no === 2) && <span className="text-xs text-slate-500"> (If No, go to question 8)</span>}</span>{skip ? <span className="text-xs text-slate-500">Skipped</span> : yn(n, setN, "q" + no)}</div>); })}</div>
            {anginaFlag(n) && <Notice>Answer to question 3, 4, 5, 6 or 7 is Yes: the patient may have angina or heart attack and needs to see the doctor.</Notice>}
            <F label="Stroke and TIA (transient ischemic attack)" req>{yn(n, setN, "stroke")}</F>
            <div className="grid md:grid-cols-[1fr_200px] gap-2 items-center text-[13px]"><span>8. Have you ever had any of the following: difficulty in talking, weakness of arm and/or leg on one side of the body or numbness on one side of the body?</span>{yn(n, setN, "q8")}</div>
            {n.q8 === "Y" && <Notice>Answer to question 8 is Yes: the patient may have had a TIA or stroke and needs to see the doctor.</Notice>}
          </Sec>
          <Sec title="Risk level *">{yn(n, setN, "risk", RISK_LEVELS.map((r) => [r, r]))}</Sec>
        </div>}
        {step === "review" && <div className="grid md:grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
          {[["Assessment date", h.date], ["Authorization code", h.atc || "—"], ["Past medical history", h.pmh.items.join(", ") || "—"], ["Family history", h.fam.items.join(", ") || "—"], ["Past surgical history", h.surg.map((s) => s.op + (s.date ? ` (${s.date})` : "")).join("; ") || "None"],
            ["Smoking / Alcohol / Drugs", `${({ Y: "Yes", N: "No", Q: "Quit" })[h.social.smoke] || "—"} / ${({ Y: "Yes", N: "No", Q: "Quit" })[h.social.alcohol] || "—"} / ${({ Y: "Yes", N: "No" })[h.social.drugs] || "—"}`],
            ["Immunizations", [...h.imm.child, ...h.imm.adult, ...h.imm.preg, ...h.imm.elder].filter((x) => x !== "None").join(", ") || "None recorded"],
            ["BP / HR / RR / Temp", `${h.v.sys || "—"}/${h.v.dia || "—"} mmHg · ${h.v.hr || "—"}/min · ${h.v.rr || "—"}/min · ${h.v.temp || "—"} °C`], ["Height / Weight / BMI", `${h.v.height || "—"} cm · ${h.v.weight || "—"} kg · ${bmi ?? "—"} (${bmiLabel(bmi)})`],
            ["Blood type", h.v.blood || "—"], ["Abnormal findings", SYSTEMS.flatMap(([k, l]) => (h.pe[k] || []).filter((x) => !EXCLUSIVE.includes(x)).map((x) => `${l.slice(3)}: ${x === "Others" ? h.peOther[k] : x}`)).join("; ") || "None"],
            ...(age >= 25 ? [["NCD risk level", n.risk || "—"], ["Angina / stroke flags", [anginaFlag(n) && "Probable angina / heart attack", n.q8 === "Y" && "Possible TIA / stroke"].filter(Boolean).join("; ") || "None"]] : [])].map(([k, v]) => <div key={k} className="flex gap-2 border-b border-slate-100 py-1"><span className="w-44 shrink-0 text-slate-500">{k}</span><span>{v}</span></div>)}
          <F label="Remarks" className="md:col-span-2 pt-2"><textarea rows={2} className={inp()} value={h.notes} onChange={(e) => upd("notes", e.target.value)} /></F>
        </div>}
      </fieldset>
      {err && <div className="mt-3"><Notice>{err}</Notice></div>}
      {done && <div className="mt-3"><Notice kind="ok">Health screening saved.</Notice></div>}
      <div className="mt-4 flex justify-between">
        <Btn v="white" disabled={pos === 0} onClick={() => go(-1)}><ChevronLeft size={14} />Previous</Btn>
        {pos < steps.length - 1 ? <Btn v="info" onClick={() => go(1)}>Next<ChevronRight size={14} /></Btn> : !locked && <Btn v="green" onClick={final}>Save HSA</Btn>}
      </div>
      {ask && <ConfirmModal title="Save health screening?" text="After saving, this record can no longer be edited." onNo={() => setAsk(false)} onYes={() => { save(h); setDone(true); setAsk(false); toast("Health screening saved."); log("FPE saved", fullName(c)); }} />}
    </Panel>
  );
}

/* ---------- Consultation Record ---------- */
const CHIEF = ["ABDOMINAL CRAMP/PAIN", "ALTERED MENTAL SENSORIUM", "ANOREXIA", "BLEEDING GUMS", "BLURRING OF VISION", "BODY WEAKNESS", "CHEST PAIN/DISCOMFORT", "CONSTIPATION", "COUGH", "DIARRHEA", "DIZZINESS", "DYSPHAGIA", "DYSPNEA",
  "DYSURIA", "EPISTAXIS", "FEVER", "FREQUENCY OF URINATION", "HEADACHE", "HEMATEMESIS", "HEMATURIA", "HEMOPTYSIS", "IRRITABILITY", "JAUNDICE", "LOWER EXTREMITY EDEMA", "MYALGIA", "ORTHOPNEA",
  "PAIN", "PALPITATIONS", "SEIZURES", "SKIN RASHES", "STOOL, BLOODY/BLACK TARRY/MUCOID", "SWEATING", "URGENCY", "VOMITING/NAUSEA", "WEIGHT LOSS", "OTHERS"];
const MGMT_ITEMS = ["Breastfeeding Program Education", "Counseling for Smoking Cessation", "Counseling for Lifestyle Modification", "Oral Check-up and Prophylaxis", "Others"];
const DX_ROWS = 7;
const blankC = () => ({ atc: "", copay: "", date: todayISO(), cc: [], ccOther: "", hpi: "", v: {}, pe: {}, peOther: {}, dx: Array(DX_ROWS).fill(""), labs: {}, labOther: "", labOtherDoc: "", labOtherCli: "", mgmtNA: false, mgmt: [], mgmtOther: "", meds: [] });

// Shared: vitals / anthropometrics block (Consultation Record "Objective / Physical Examination").
function VitalsBlock({ v, set, months }) {
  const num = (k, ph = "") => <input className={inp()} inputMode="decimal" placeholder={ph} value={v[k] || ""} onChange={(e) => set(k, numOnly(e.target.value))} />;
  const bmi = bmiOf(v.height, v.weight);
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <F label="Blood pressure" req><Unit u="mmHg">{num("sys", "Sys")}<span>/</span>{num("dia", "Dia")}</Unit></F>
        <F label="Respiratory rate" req><Unit u="/min">{num("rr")}</Unit></F>
        <F label="Height" req><div className="grid grid-cols-2 gap-2"><Unit u="cm">{num("height")}</Unit><Unit u="inch"><input className={inp()} inputMode="decimal" value={v.height ? (v.height / 2.54).toFixed(1) : ""} onChange={(e) => set("height", e.target.value ? (parseFloat(numOnly(e.target.value)) * 2.54).toFixed(1) : "")} /></Unit></div></F>
        <F label="Temperature" req><Unit u="°C">{num("temp")}</Unit></F>
        <F label="Heart rate" req><Unit u="/min">{num("hr")}</Unit></F>
        <F label="Visual acuity"><Unit u=""><input className={inp()} placeholder="Left eye" value={v.vaL || ""} onChange={(e) => set("vaL", e.target.value)} /><span>/</span><input className={inp()} placeholder="Right eye" value={v.vaR || ""} onChange={(e) => set("vaR", e.target.value)} /></Unit></F>
        <F label="Weight" req><div className="grid grid-cols-2 gap-2"><Unit u="kg">{num("weight")}</Unit><Unit u="lb"><input className={inp()} inputMode="decimal" value={v.weight ? (v.weight * 2.20462).toFixed(1) : ""} onChange={(e) => set("weight", e.target.value ? (parseFloat(numOnly(e.target.value)) / 2.20462).toFixed(1) : "")} /></Unit></div></F>
        <F label="BMI"><div className="px-3 py-2 text-sm bg-slate-50 rounded-lg border border-slate-200">{bmi ?? "—"} <span className="text-slate-500">({bmiLabel(bmi)})</span></div></F>
      </div>
      {months <= 24 && <Sec title="Pediatric client aged 0–24 months"><div className="grid md:grid-cols-3 gap-3"><F label="Length" req><Unit u="cm">{num("length")}</Unit></F><F label="Head circumference" req><Unit u="cm">{num("headC")}</Unit></F><F label="Skinfold thickness"><Unit u="cm">{num("skinfold")}</Unit></F></div></Sec>}
      <Sec title="Body circumference"><div className="grid md:grid-cols-4 gap-3"><F label="Waist"><Unit u="cm">{num("waist")}</Unit></F><F label="Hip"><Unit u="cm">{num("hip")}</Unit></F><F label="Limbs"><Unit u="cm">{num("limbs")}</Unit></F><F label="Middle & upper arm circumference"><Unit u="cm">{num("muac")}</Unit></F></div></Sec>
    </div>
  );
}
function vitalsErr(v, dob) {
  if (!v.sys || !v.dia) return "Blood pressure is required."; if (+v.sys <= +v.dia) return "Systolic must be higher than diastolic.";
  if (!v.rr) return "Respiratory rate is required."; if (!v.height) return "Height is required."; if (!v.temp) return "Temperature is required.";
  if (+v.temp < 30 || +v.temp > 45) return "Temperature looks wrong (expected 30–45 °C)."; if (!v.hr) return "Heart rate is required."; if (!v.weight) return "Weight is required.";
  if (ageMonths(dob) <= 24 && (!v.length || !v.headC)) return "Pediatric client (0–24 months): length and head circumference are required.";
  return "";
}
// Shared: pertinent findings per system, for a subset of systems.
function SystemsBlock({ keys, pe, peOther, setPe, setOther }) {
  return <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">{SYSTEMS.filter(([k]) => keys.includes(k)).map(([k, label, opts]) => (
    <Sec key={k} title={label + " *"}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">{[...opts, "Others"].map((o) => <Check key={o} checked={(pe[k] || []).includes(o)} onChange={(on) => setPe({ ...pe, [k]: toggleExclusive(pe[k] || [], o, on) })} label={o} />)}</div>
      {(pe[k] || []).includes("Others") && <input className={inp()} placeholder="Specify others" value={peOther[k] || ""} onChange={(e) => setOther({ ...peOther, [k]: e.target.value })} />}
    </Sec>))}</div>;
}
function systemsErr(keys, pe, peOther) {
  for (const [k, label] of SYSTEMS.filter(([k]) => keys.includes(k))) { if (!(pe[k] || []).length) return `${label}: tick at least one finding.`; if ((pe[k] || []).includes("Others") && !(peOther[k] || "").trim()) return `${label}: specify Others.`; }
  return "";
}
const SYS_A = ["heent", "chest", "heart", "abdomen"], SYS_B = ["gu", "dre", "skin", "neuro"];

const C_STEPS = [["profile", "Complaint"], ["pe", "Vitals"], ["sysA", "Findings A–D"], ["sysB", "Findings E–H"], ["dx", "Diagnosis"], ["labsA", "Labs 1"], ["labsB", "Labs 2"], ["mgmt", "Mgmt & Rx"], ["review", "Review"]];
const LAB_A = ["CBC", "LIPID", "FBS", "OGTT", "HBA1C", "CREA", "CXR"], LAB_B = ["SPUTUM", "ECG", "UA", "PAP", "FECA", "FOBT"];
function cErr(f, id, c) {
  if (id === "profile") {
    if (!f.date) return "Consultation date is required."; if (isFuture(f.date)) return "Consultation date cannot be in the future.";
    if (f.copay && isNaN(parseFloat(f.copay))) return "Co-payment must be a number.";
    if (!f.cc.length) return "Chief complaint: tick at least one."; if (f.cc.includes("OTHERS") && !f.ccOther.trim()) return "Chief complaint: specify Others.";
  }
  if (id === "pe") return vitalsErr(f.v, c.dob);
  if (id === "sysA") return systemsErr(SYS_A, f.pe, f.peOther);
  if (id === "sysB") return systemsErr(SYS_B, f.pe, f.peOther);
  if (id === "dx" && !f.dx.some((d) => d.trim())) return "Enter at least one diagnosis.";
  if (id === "labsB") {
    const any = Object.values(f.labs).some((x) => x.doc || x.cli === "R") || f.labOtherDoc || f.labOtherCli === "R";
    if (!any) return "Laboratory / imaging: the doctor must decide (Yes or No) on at least one test.";
    if ((f.labOtherDoc === "Y" || f.labOtherCli === "R") && !f.labOther.trim()) return "Laboratory / imaging: specify Others.";
  }
  if (id === "mgmt") { if (!f.mgmtNA && !f.mgmt.length) return 'Management: tick at least one item, or "Not applicable".'; if (f.mgmt.includes("Others") && !f.mgmtOther.trim()) return "Management: specify Others."; }
  return "";
}
const dxList = (k) => (Array.isArray(k.dx) ? k.dx : [k.dx]).filter((d) => d && d.trim());

function ConsultModule({ clients, setClients }) {
  const [sel, setSel] = useState(null);
  const c = clients.find((x) => x.id === sel);
  const saveConsult = (f) => setClients((p) => p.map((x) => {
    if (x.id !== c.id) return x;
    const add = [];
    Object.entries(f.labs).forEach(([code, r]) => {
      if (r.cli !== "R") return;
      if (!x.labs.some((l) => l.test === code && !l.result && !l.waived)) add.push({ id: nid(), test: code, date: f.date, result: "", flag: "", guide: labStatus(code, x), from: r.doc === "Y" ? "doctor" : "patient" });
    });
    return { ...x, consults: [...x.consults, { ...f, dx: f.dx.filter((d) => d.trim()) }], meds: [...x.meds, ...f.meds], labs: [...x.labs, ...add] };
  }));
  return !c ? <Panel title="CONSULTATION"><Notice kind="info">Only clients with a completed FPE who are empanelled on the registration site can be consulted (status: Ready for Care).</Notice><div className="mt-3"><ClientPicker clients={clients} filter={(x) => x.hsa && x.emp && x.emp.choice === "YES" && x.emp.verified} value={sel} onChange={setSel} /></div></Panel>
    : <ConsultWizard key={c.id} c={c} back={() => setSel(null)} save={saveConsult} />;
}

// Doctor decides the tests. Doctor "Yes" automatically sets Client = Request and locks it.
// If the doctor did not choose "Yes", the patient may still request the test on their own.
function LabPlanRow({ code, name, guide, row, set, pending }) {
  const disabled = guide === "X";
  const docYes = row.doc === "Y";
  const setDoc = (val) => set({ ...row, doc: val, cli: val === "Y" ? "R" : row.doc === "Y" ? "" : row.cli || "" });
  const dr = (val, label) => <label className="flex items-center gap-1 text-xs"><input type="radio" disabled={disabled} checked={(row.doc || "") === val} onChange={() => setDoc(val)} />{label}</label>;
  const cr = (val, label) => <label className={`flex items-center gap-1 text-xs ${docYes ? "text-slate-400" : ""}`}><input type="radio" disabled={disabled || docYes} checked={(row.cli || "") === val} onChange={() => set({ ...row, cli: val })} />{label}</label>;
  return (
    <tr className={`border-t border-slate-100 ${disabled ? "opacity-45" : ""}`}>
      <td className="px-3 py-1.5 text-sm">{name}{pending && <div className="text-[10px] text-amber-700">Already ordered, awaiting result</div>}</td>
      <td className="px-2 py-1.5">{guide ? <GuideBadge s={guide} /> : <span className="text-xs text-slate-400">—</span>}</td>
      <td className="px-2 py-1.5"><div className="flex gap-3">{dr("Y", "Yes")}{dr("N", "No")}{dr("", "Deselect")}</div></td>
      <td className="px-2 py-1.5"><div className="flex items-center gap-3">{cr("R", "Request")}{cr("", "Deselect")}{docYes ? <span className="inline-flex items-center gap-1 text-[10px] text-slate-500"><Lock size={11} />Doctor's order</span> : row.cli === "R" ? <span className="text-[10px] text-indigo-600 font-medium">Patient request</span> : null}</div></td>
    </tr>
  );
}

function ConsultWizard({ c, back, save }) {
  const toast = useToast(); const log = useLog();
  const [f, setF] = useState(blankC());
  const [step, setStep] = useState("profile");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [ask, setAsk] = useState(false);
  const age = calcAge(c.dob), months = ageMonths(c.dob);
  const pos = C_STEPS.findIndex(([id]) => id === step);
  const upd = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const go = (dir) => { if (dir > 0 && !done) { const e = cErr(f, step, c); if (e) return setErr(e); } setErr(""); const n = C_STEPS[pos + dir]; if (n) setStep(n[0]); };
  const finish = () => { for (const [id] of C_STEPS) { const e = cErr(f, id, c); if (e) { setStep(id); return setErr(e); } } setErr(""); setAsk(true); };
  const pending = (code) => c.labs.some((l) => l.test === code && !l.result && !l.waived);
  const yesRec = Object.keys(LABS).filter((k) => labStatus(k, c) === "R");
  const requested = Object.entries(f.labs).filter(([, r]) => r.doc === "Y").map(([k]) => LABS[k].short);
  const refused = Object.entries(f.labs).filter(([, r]) => r.doc !== "Y" && r.cli === "R").map(([k]) => LABS[k].short);
  return (
    <Panel title={`CONSULTATION RECORD — ${fullName(c)} (${age} y/o, ${c.sex === "F" ? "Female" : "Male"})`} right={<button type="button" onClick={back} className="underline">Change client</button>}>
      <Steps labels={C_STEPS.map(([, l]) => l)} idx={pos} onGo={(p) => { setErr(""); setStep(C_STEPS[p][0]); }} />
      <fieldset disabled={done} className="space-y-4">
        {step === "profile" && <>
          <div className="grid md:grid-cols-3 gap-3">
            <F label="Authorization Transaction Code"><input className={inp()} value={f.atc} onChange={(e) => upd("atc", e.target.value.toUpperCase())} /></F>
            <F label="Co-payment"><Unit u="Php"><input className={inp()} inputMode="decimal" value={f.copay} onChange={(e) => upd("copay", numOnly(e.target.value))} /></Unit></F>
            <F label="Consultation date" req><input type="date" className={inp()} value={f.date} onChange={(e) => upd("date", e.target.value)} /></F>
          </div>
          <Sec title="A. Chief complaint *"><div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-0.5 text-xs">{CHIEF.map((o) => <Check key={o} checked={f.cc.includes(o)} onChange={(on) => upd("cc", on ? [...f.cc, o] : f.cc.filter((x) => x !== o))} label={o} />)}</div>
            {f.cc.includes("OTHERS") && <input className={inp()} placeholder="Specify other complaints" value={f.ccOther} onChange={(e) => upd("ccOther", e.target.value)} />}</Sec>
          <F label="B. History of illness"><textarea rows={2} className={inp()} value={f.hpi} onChange={(e) => upd("hpi", e.target.value)} /></F>
        </>}
        {step === "pe" && <VitalsBlock v={f.v} set={(k, v) => setF((p) => ({ ...p, v: { ...p.v, [k]: v } }))} months={months} />}
        {(step === "sysA" || step === "sysB") && <SystemsBlock keys={step === "sysA" ? SYS_A : SYS_B} pe={f.pe} peOther={f.peOther} setPe={(v) => upd("pe", v)} setOther={(v) => upd("peOther", v)} />}
        {step === "dx" && <div className="space-y-2">{f.dx.map((d, k) => <div key={k} className="grid grid-cols-[40px_1fr] gap-2 items-center"><span className="text-sm text-slate-500 text-center">{k + 1}</span><input className={inp()} placeholder={k === 0 ? "Diagnosis name (required)" : "Diagnosis name"} value={d} onChange={(e) => upd("dx", f.dx.map((x, j) => (j === k ? e.target.value : x)))} /></div>)}</div>}
        {(step === "labsA" || step === "labsB") && <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>Age group {AGE_BANDS[ageBand(c.dob)]}: recommended tests are suggestions.</span><Btn v="white" disabled={!yesRec.length} onClick={() => upd("labs", { ...f.labs, ...Object.fromEntries(yesRec.map((k) => [k, { ...(f.labs[k] || {}), doc: "Y", cli: "R" }])) })}>Mark recommended as Yes ({yesRec.length})</Btn></div>
          <div className="overflow-auto border border-slate-200 rounded-lg"><table className="w-full">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide"><tr><th className="text-left px-3 py-2 font-medium">Laboratory / imaging</th><th className="text-left px-2 py-2 font-medium">Age guide</th><th className="text-left px-2 py-2 font-medium">Doctor recommendation</th><th className="text-left px-2 py-2 font-medium">Client request</th></tr></thead>
            <tbody>{(step === "labsA" ? LAB_A : LAB_B).map((code) => [code, LABS[code]]).map(([code, t]) => <LabPlanRow key={code} code={code} name={t.short + (t.waivable ? " *" : "")} guide={labStatus(code, c)} pending={pending(code)} row={f.labs[code] || {}} set={(r) => upd("labs", { ...f.labs, [code]: r })} />)}
              {step === "labsB" && <LabPlanRow code="OTHER" name={<input className={inp() + " max-w-[220px]"} placeholder="Others (specify)" value={f.labOther} onChange={(e) => upd("labOther", e.target.value)} />} guide={null} row={{ doc: f.labOtherDoc, cli: f.labOtherCli }} set={(r) => setF((p) => ({ ...p, labOtherDoc: r.doc || "", labOtherCli: r.cli || "" }))} />}</tbody></table></div>
          <div className="text-[11px] text-slate-400">The doctor decides the tests: choosing Yes automatically sets the client to Request (locked). If the doctor did not choose Yes, the patient may still request a test. Every request becomes an order in Diagnostics &amp; Referral.</div>
        </div>}
        {step === "mgmt" && <>
          <Sec title="B. Management (check if done) *">
            <Check checked={f.mgmtNA} onChange={(on) => setF((p) => ({ ...p, mgmtNA: on, mgmt: on ? [] : p.mgmt, mgmtOther: on ? "" : p.mgmtOther }))} label="Not applicable" />
            <div className="grid md:grid-cols-2 gap-x-4 gap-y-1">{MGMT_ITEMS.map((o) => <Check key={o} disabled={f.mgmtNA} checked={f.mgmt.includes(o)} onChange={(on) => upd("mgmt", on ? [...f.mgmt, o] : f.mgmt.filter((x) => x !== o))} label={o} />)}</div>
            {f.mgmt.includes("Others") && <input className={inp()} placeholder="Specify other management" value={f.mgmtOther} onChange={(e) => upd("mgmtOther", e.target.value)} />}
          </Sec>
          <MedsEditor meds={f.meds} setMeds={(m) => upd("meds", m)} />
        </>}
        {step === "review" && <div className="grid md:grid-cols-2 gap-x-8 gap-y-1 text-sm">{[
          ["Consultation date", f.date], ["Authorization code / Co-pay", `${f.atc || "—"} / ${f.copay ? "Php " + f.copay : "—"}`],
          ["Chief complaint", f.cc.map((x) => (x === "OTHERS" ? `OTHERS: ${f.ccOther}` : x)).join(", ")], ["History of illness", f.hpi || "—"],
          ["BP / HR / RR / Temp", `${f.v.sys}/${f.v.dia} mmHg · ${f.v.hr}/min · ${f.v.rr}/min · ${f.v.temp} °C`], ["Height / Weight / BMI", `${f.v.height} cm · ${f.v.weight} kg · ${bmiOf(f.v.height, f.v.weight) ?? "—"}`],
          ["Abnormal findings", SYSTEMS.flatMap(([k, l]) => (f.pe[k] || []).filter((x) => !EXCLUSIVE.includes(x)).map((x) => `${l.slice(3)}: ${x === "Others" ? f.peOther[k] : x}`)).join("; ") || "None"],
          ["Diagnosis", f.dx.filter((d) => d.trim()).map((d, k) => `${k + 1}. ${d}`).join("  ")], ["Doctor's lab orders", requested.join(", ") || "None"], ["Patient-requested tests", refused.join(", ") || "None"],
          ["Management", f.mgmtNA ? "Not applicable" : f.mgmt.map((x) => (x === "Others" ? `Others: ${f.mgmtOther}` : x)).join(", ")], ["Prescription", f.meds.map((m) => `${m.drug} ×${m.qty}`).join(", ") || "None"],
        ].map(([k, v]) => <div key={k} className="flex gap-2 border-b border-slate-100 py-1"><span className="w-40 shrink-0 text-slate-500">{k}</span><span>{v}</span></div>)}</div>}
      </fieldset>
      {err && <div className="mt-3"><Notice>{err}</Notice></div>}
      {done && <div className="mt-3"><Notice kind="ok">Consultation saved. Requested tests were sent to Diagnostics & Referral and prescriptions to Medicine.</Notice></div>}
      <div className="mt-4 flex justify-between">
        <Btn v="white" disabled={pos === 0} onClick={() => go(-1)}><ChevronLeft size={14} />Previous</Btn>
        {pos < C_STEPS.length - 1 ? <Btn v="info" onClick={() => go(1)}>Next<ChevronRight size={14} /></Btn> : !done && <Btn v="green" onClick={finish}>Save consultation</Btn>}
      </div>
      {ask && <ConfirmModal title="Save consultation?" text="After saving, this consultation can no longer be edited." onNo={() => setAsk(false)} onYes={() => { save(f); setDone(true); setAsk(false); toast("Consultation saved."); log("Consultation saved", fullName(c)); }} />}
    </Panel>
  );
}

/* ---------- Laboratory ---------- */
const flagFor = (lo, hi, n) => (isNaN(n) ? "" : n < lo ? "LOW" : n > hi ? "HIGH" : "NORMAL");
// Flag for an imported result (same rules as manual entry). unit "mmol/L" is converted for FBS/OGTT.
function autoFlag(code, value, parts, unit) {
  const cfg = LABS[code];
  if (cfg.parts) { const fs = cfg.parts.map(([k, , , lo, hi]) => flagFor(lo, hi, parseFloat(parts[k]))).filter(Boolean); return fs.length ? (fs.some((x) => x !== "NORMAL") ? "ABNORMAL" : "NORMAL") : ""; }
  if (cfg.text) return cfg.choices ? (/neg/i.test(value) ? "NORMAL" : /pos/i.test(value) ? "ABNORMAL" : "Reported") : value ? "Reported" : "";
  let n = parseFloat(value); if (cfg.conv && /mmol/i.test(unit || "")) n = n * cfg.conv; return flagFor(cfg.lo, cfg.hi, n);
}
function LabRow({ l, onSave }) {
  const cfg = LABS[l.test];
  const [val, setVal] = useState(l.result || "");
  const [parts, setParts] = useState(l.parts || {});
  const [mm, setMm] = useState(false);
  const [err, setErr] = useState("");
  if (l.waived) return <tr className="border-t align-top"><td className="px-3 py-2">{cfg.name}</td><td className="px-3 py-2 text-slate-500" colSpan={3}>Waived{l.waiveReason ? `: ${l.waiveReason}` : ""}</td></tr>;
  let fl = "", conv = "";
  if (cfg.parts) { const fs = cfg.parts.map(([k, , , lo, hi]) => flagFor(lo, hi, parseFloat(parts[k]))).filter(Boolean); fl = fs.length ? (fs.some((x) => x !== "NORMAL") ? "ABNORMAL" : "NORMAL") : ""; }
  else if (cfg.text) fl = val ? (cfg.choices ? (val === cfg.choices[0] ? "NORMAL" : "ABNORMAL") : "Reported") : "";
  else { let n = parseFloat(val); if (mm && cfg.conv) n = n * cfg.conv; fl = flagFor(cfg.lo, cfg.hi, n); if (cfg.conv && val && !isNaN(parseFloat(val))) conv = mm ? `${(parseFloat(val) * cfg.conv).toFixed(1)} mg/dL` : `${(parseFloat(val) / cfg.conv).toFixed(1)} mmol/L`; }
  const save = () => {
    if (cfg.parts) { if (cfg.parts.some(([k]) => parts[k] === undefined || parts[k] === "")) return setErr("Enter all lipid values."); if (cfg.parts.some(([k]) => isNaN(parseFloat(parts[k])))) return setErr("Values must be numeric."); setErr(""); return onSave(cfg.parts.map(([k, n]) => `${n} ${parts[k]}`).join(", "), fl, parts); }
    if (!val.trim()) return setErr("Enter a result."); if (!cfg.text && isNaN(parseFloat(val))) return setErr("Result must be numeric."); setErr(""); onSave(cfg.text ? val : `${val} ${mm ? cfg.unit2 : cfg.unit}`, fl);
  };
  return (
    <tr className="border-t align-top">
      <td className="px-3 py-2">{cfg.name}<div className="text-[11px] text-slate-400">Ordered {l.date}{l.from === "patient" ? " · patient request" : l.from === "doctor" ? " · doctor's order" : ""}{l.source === "lab-system" ? ` · from laboratory system ${l.resultDate || ""}` : ""}</div></td>
      <td className="px-3 py-2">
        {cfg.parts ? <div className="grid grid-cols-2 gap-2 max-w-[340px]">{cfg.parts.map(([k, n, u, lo, hi]) => <label key={k} className="text-xs text-slate-500">{n} <span className="text-slate-400">({k === "HDL" ? `≥${lo}` : `<${hi}`} {u})</span><input className={inp() + " mt-0.5"} inputMode="decimal" value={parts[k] || ""} onChange={(e) => setParts({ ...parts, [k]: e.target.value.replace(/[^0-9.]/g, "") })} /></label>)}</div>
          : cfg.choices ? <select className={inp(err) + " max-w-[160px]"} value={val} onChange={(e) => setVal(e.target.value)}><option value="">-- Select --</option>{cfg.choices.map((x) => <option key={x}>{x}</option>)}</select>
          : cfg.text ? <textarea rows={1} className={inp(err) + " max-w-[340px]"} placeholder="Findings / impression" value={val} onChange={(e) => setVal(e.target.value)} />
          : <><div className="flex gap-2 items-center"><input className={inp(err) + " max-w-[140px]"} inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} />{cfg.conv ? <select className="border border-slate-200 rounded-lg text-xs p-1 bg-white" value={mm ? "m" : "g"} onChange={(e) => setMm(e.target.value === "m")}><option value="g">{cfg.unit}</option><option value="m">{cfg.unit2}</option></select> : <span className="text-xs text-slate-500">{cfg.unit}</span>}</div><div className="text-[11px] text-slate-400 mt-0.5">Reference {cfg.lo}–{cfg.hi} {cfg.unit}{conv && ` · ≈ ${conv}`}</div></>}
        {err && <div className="text-xs text-rose-600 mt-1">{err}</div>}
      </td>
      <td className="px-3 py-2">{fl && <span className={`px-2 py-0.5 rounded text-xs ${fl === "NORMAL" || fl === "Reported" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{fl}</span>}</td>
      <td className="px-3 py-2"><Btn v="green" onClick={save}>{l.result ? "Update" : "Save"}</Btn></td>
    </tr>
  );
}
function LabModule({ clients, setClients }) {
  const toast = useToast();
  const [sel, setSel] = useState(null);
  const c = clients.find((x) => x.id === sel);
  const setLab = (id, result, flag, parts) => { toast("Lab result saved."); setClients((p) => p.map((x) => x.id === sel ? { ...x, labs: x.labs.map((l) => l.id === id ? { ...l, result, flag, ...(parts ? { parts } : {}) } : l) } : x)); };
  return (
    <Panel title="LABORATORY / IMAGING RESULTS">
      <ClientPicker clients={clients} filter={(x) => x.labs.length} value={sel} onChange={setSel} />
      {c && <div className="overflow-auto border rounded"><table className="w-full text-sm"><thead className="bg-gray-100"><tr>{["Test", "Result", "Flag", ""].map((t) => <th key={t} className="text-left px-3 py-2">{t}</th>)}</tr></thead><tbody>{c.labs.map((l) => <LabRow key={l.id + (l.result || "")} l={l} onSave={(r, f, pts) => setLab(l.id, r, f, pts)} />)}</tbody></table></div>}
    </Panel>
  );
}

/* ---------- Medicine ---------- */
function MedicineModule({ clients, setClients }) {
  const toast = useToast(); const log = useLog();
  const rows = clients.flatMap((c) => c.meds.map((m, k) => ({ c, m, k })));
  const disp = (cid, k) => { toast("Medicine dispensed."); log("Medicine dispensed", ""); setClients((p) => p.map((x) => x.id === cid ? { ...x, meds: x.meds.map((m, j) => j === k ? { ...m, dispensed: true } : m) } : x)); };
  return (
    <Paged>
      <Panel title="MEDICINE DISPENSING">
        <Table cols={["Client", "Medicine", "Qty", "Days", "Instructions", "Status"]} rows={rows.map(({ c, m, k }) => [fullName(c), <span key="d" className="flex items-center gap-1.5">{m.drug}{gamotOf(m.drug) && <ProgBadge g={gamotOf(m.drug)} />}</span>, m.qty, m.days || "—", m.sig, m.dispensed ? <span key="s" className="text-emerald-700">Dispensed</span> : <Btn key={k} v="green" onClick={() => disp(c.id, k)}>Dispense</Btn>])} empty="No prescriptions yet." />
      </Panel>
      <Panel title={`GAMOT LIST (${GAMOT.length} MEDICINES: EKONSULTA 21 + YAKAP 54)`} right={<a href={GAMOT_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">Official circular <ExternalLink size={12} /></a>}><GamotList /></Panel>
    </Paged>
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
    <Paged>
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
    </Paged>
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
    <Paged>
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
    </Paged>
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
const GUIDE = { R: ["Recommended", "bg-blue-600 text-white", "✓"], A: ["As applicable", "bg-amber-300 text-blue-900", "✓"], X: ["Not applicable", "bg-slate-900 text-white", "●"] };
function GuideDot({ s }) { const [l, cls, ch] = GUIDE[s]; return <span title={l} className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${cls}`}>{ch}</span>; }
function GuideBadge({ s }) { const [l] = GUIDE[s]; const cls = { R: "bg-blue-100 text-blue-700", A: "bg-amber-100 text-amber-800", X: "bg-slate-200 text-slate-600" }[s]; return <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>{l}</span>; }
function LabGuideTable({ band }) {
  return (
    <div className="overflow-auto border border-slate-200 rounded-lg">
      <table className="w-full text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="text-left px-3 py-2 font-medium">Targeted diagnostics (by risk, age and health assessment)</th>{AGE_BANDS.map((b, k) => <th key={b} className={`px-2 py-2 font-medium text-center ${k === band ? "bg-[var(--accent-soft)] text-[var(--accent)]" : ""}`}>{b}{k === 0 ? "" : <div className="font-normal">yrs</div>}</th>)}</tr></thead>
        <tbody>{Object.entries(LABS).map(([code, t]) => <tr key={code} className="border-t border-slate-100"><td className="px-3 py-1.5">{t.short}{t.waivable && <span className="text-rose-600">*</span>}</td>{t.guide.split("").map((g, k) => <td key={k} className={`text-center py-1.5 ${k === band ? "bg-[var(--accent-soft)]" : ""}`}><GuideDot s={g} /></td>)}</tr>)}</tbody></table>
      <div className="flex flex-wrap gap-4 px-3 py-2 text-[11px] text-slate-500 border-t border-slate-100"><span className="flex items-center gap-1"><GuideDot s="R" /> Recommended</span><span className="flex items-center gap-1"><GuideDot s="A" /> As applicable</span><span className="flex items-center gap-1"><GuideDot s="X" /> Not applicable</span><span><span className="text-rose-600">*</span> Allowed to waive</span><span>Source: Annex B / Annex D, PhilHealth Circular No. 2024-0013</span></div>
    </div>
  );
}

// Lab results for one client (pending first, then completed).
function ClientResults({ c, setClients }) {
  const toast = useToast(), log = useLog();
  const [lab, setLab2] = useState({ mode: null }); const [busy, setBusy] = useState(false); const [preview, setPreview] = useState(null);
  useEffect(() => { fetch("/api/lab-results").then((r) => r.json()).then(setLab2).catch(() => setLab2({ mode: "offline" })); }, []);
  const pendingLabs = c.labs.filter((l) => !l.result && !l.waived);
  const fetchLab = async () => {
    if (!pendingLabs.length) return toast("No pending tests to fetch.", "info");
    setBusy(true);
    try {
      const since = pendingLabs.map((l) => l.date).sort()[0];
      const r = await fetch("/api/lab-results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ last: c.last, first: c.first, middle: c.middle, dob: c.dob, since, tests: [...new Set(pendingLabs.map((l) => l.test))] }) });
      const d = await r.json();
      if (!r.ok) { toast(d.error || "Laboratory system error.", "error"); setBusy(false); return; }
      const rows = pendingLabs.map((l) => {
        const hits = d.results.filter((x) => x.code === l.test && (!x.date || x.date >= l.date)).sort((a, b) => b.date.localeCompare(a.date));
        if (!hits.length) return { l, found: false };
        if (LABS[l.test].parts) {
          const parts = {}; let date = hits[0].date;
          for (const [k] of LABS[l.test].parts) { const h = hits.find((x) => x.part === k); if (h) { parts[k] = String(parseFloat(h.value)); date = h.date > date ? h.date : date; } }
          const complete = LABS[l.test].parts.every(([k]) => parts[k] && parts[k] !== "NaN");
          return { l, found: true, complete, parts, date, value: LABS[l.test].parts.filter(([k]) => parts[k]).map(([k, n]) => `${n} ${parts[k]}`).join(", "), flag: complete ? autoFlag(l.test, "", parts) : "", pick: complete };
        }
        const h = hits[0]; const value = LABS[l.test].text ? h.value : `${h.value} ${h.unit || LABS[l.test].unit}`.trim();
        return { l, found: true, complete: true, value, date: h.date, flag: autoFlag(l.test, h.value, null, h.unit), pick: true };
      });
      const extra = d.results.filter((x) => !x.code || !pendingLabs.some((l) => l.test === x.code));
      setPreview({ ...d, rows, extra });
    } catch { toast("Could not reach the laboratory connector.", "error"); }
    setBusy(false);
  };
  const doImport = () => {
    const chosen = preview.rows.filter((x) => x.found && x.complete && x.pick);
    setClients((p) => p.map((x) => x.id !== c.id ? x : { ...x, labs: x.labs.map((l) => { const m = chosen.find((y) => y.l.id === l.id); return m ? { ...l, result: m.value, flag: m.flag, resultDate: m.date, source: "lab-system", ...(m.parts ? { parts: m.parts } : {}) } : l; }) }));
    log("Lab results imported", `${fullName(c)}: ${chosen.map((y) => LABS[y.l.test].short).join(", ")} (${preview.mode === "demo" ? "demo lab" : "laboratory database"})`);
    toast(`${chosen.length} result(s) imported from the laboratory system.`); setPreview(null);
  };
  const [pg, setPg] = useState(0); const PER = 3;
  // Pending tests first, but keep the order fixed while this client is open so a saved row doesn't jump away.
  const [order] = useState(() => [...c.labs].sort((a, b) => (!!a.result || !!a.waived) - (!!b.result || !!b.waived)).map((l) => l.id));
  const labs = [...order.map((id) => c.labs.find((l) => l.id === id)).filter(Boolean), ...c.labs.filter((l) => !order.includes(l.id))];
  const setLab = (id, result, flag, parts) => { setClients((p) => p.map((x) => x.id === c.id ? { ...x, labs: x.labs.map((l) => l.id === id ? { ...l, result, flag, resultDate: todayISO(), ...(parts ? { parts } : {}) } : l) } : x)); toast("Lab result saved."); log("Lab result saved", `${fullName(c)}: ${LABS[c.labs.find((l) => l.id === id).test].short}`); };
  const bar = (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <Btn v="info" disabled={busy || !pendingLabs.length} onClick={fetchLab}><Server size={14} />{busy ? "Reading laboratory system…" : "Get results from laboratory"}</Btn>
      <span className={`text-[11px] px-2 py-0.5 rounded-full ${lab.mode === "database" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{lab.mode === "database" ? `Connected: lab database (${lab.type})` : lab.mode === "demo" ? "Demo lab (not connected to the real laboratory system yet)" : "Checking connector…"}</span>
      <span className="text-[11px] text-slate-400 ml-auto">Patient matched by name + birthdate · results can still be typed manually</span>
    </div>
  );
  const modal = preview && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-5">
      <h3 className="font-semibold">Results from the laboratory system{preview.mode === "demo" && <span className="ml-2 text-xs font-normal text-amber-700">(demo data)</span>}</h3>
      <p className="text-xs text-slate-500 mb-3">Matched by name + birthdate: <b>{fullName(c)}</b> · {c.dob}{preview.patients.length ? ` · lab patient ID ${preview.patients.join(", ")}` : ""}</p>
      {preview.multiple ? <Notice>More than one patient in the laboratory system has this name and birthdate ({preview.patients.join(", ")}). Results were not imported. Check the laboratory system and enter results manually.</Notice> :
        <div className="space-y-1.5 max-h-[50vh] overflow-auto">{preview.rows.map((x) => (
          <label key={x.l.id} className={`flex items-start gap-2 border rounded-lg px-3 py-2 text-sm ${x.found && x.complete ? "border-slate-200" : "border-dashed border-slate-200 text-slate-400"}`}>
            <input type="checkbox" className="mt-1" disabled={!x.found || !x.complete} checked={!!x.pick} onChange={(e) => setPreview((p) => ({ ...p, rows: p.rows.map((y) => (y.l.id === x.l.id ? { ...y, pick: e.target.checked } : y)) }))} />
            <span className="flex-1"><span className="font-medium">{LABS[x.l.test].short}</span>{x.found ? <span className="block text-xs text-slate-600">{x.value} · {x.date}{!x.complete && " · incomplete (missing lipid values)"}</span> : <span className="block text-xs">No result in the laboratory system yet</span>}</span>
            {x.flag && <span className={`px-2 py-0.5 rounded text-xs ${x.flag === "NORMAL" || x.flag === "Reported" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{x.flag}</span>}
          </label>))}
          {preview.extra.length > 0 && <div className="text-[11px] text-slate-400 pt-1">Also in the laboratory system but not ordered here (skipped): {[...new Set(preview.extra.map((x) => x.test))].join(", ")}</div>}
        </div>}
      <div className="flex justify-end gap-2 mt-4"><Btn v="white" onClick={() => setPreview(null)}>Cancel</Btn>{!preview.multiple && <Btn v="green" disabled={!preview.rows.some((x) => x.pick && x.found && x.complete)} onClick={doImport}>Import selected ({preview.rows.filter((x) => x.pick && x.found && x.complete).length})</Btn>}</div>
    </div></div>
  );
  if (!labs.length) return <div className="text-sm text-slate-500 py-6 text-center">No tests were requested in this client's consultation. Tests are ordered in Consultation (Labs steps).</div>;
  return (
    <div>{bar}{modal}<div className="border border-slate-200 rounded-lg"><table className="w-full text-sm">
      <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide"><tr>{["Test", "Result", "Flag", ""].map((t) => <th key={t} className="text-left px-3 py-2 font-medium">{t}</th>)}</tr></thead>
      <tbody>{labs.slice(Math.min(pg, Math.ceil(labs.length / PER) - 1) * PER).slice(0, PER).map((l) => <LabRow key={l.id} l={l} onSave={(r, f, pts) => setLab(l.id, r, f, pts)} />)}</tbody></table>
      {labs.length > PER && (() => { const pages = Math.ceil(labs.length / PER), cur = Math.min(pg, pages - 1); return <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-slate-100 text-xs text-slate-500"><span>Tests {cur * PER + 1}–{Math.min(labs.length, cur * PER + PER)} of {labs.length}</span><button type="button" aria-label="Previous tests" disabled={cur === 0} onClick={() => setPg(cur - 1)} className="p-1 rounded border border-slate-200 disabled:opacity-40"><ChevronLeft size={14} /></button><button type="button" aria-label="Next tests" disabled={cur >= pages - 1} onClick={() => setPg(cur + 1)} className="p-1 rounded border border-slate-200 disabled:opacity-40"><ChevronRight size={14} /></button></div>; })()}
    </div></div>
  );
}
function ClientReferrals({ c, setClients }) {
  const toast = useToast(), log = useLog();
  const [r, setR] = useState({ dest: "", reason: "", urgency: "Routine", follow: "" }); const [err, setErr] = useState("");
  const add = () => {
    if (!r.dest) return setErr("Select a referral destination."); if (r.reason.trim().length < 5) return setErr("Enter the reason for referral.");
    if (!r.follow || r.follow < todayISO()) return setErr("Follow-up date is required and cannot be in the past.");
    setErr(""); setClients((p) => p.map((x) => x.id === c.id ? { ...x, referrals: [...x.referrals, { id: nid(), ...r, status: "Pending", date: todayISO() }] } : x));
    log("Referral created", `${fullName(c)} → ${r.dest}`); toast("Referral saved."); setR({ dest: "", reason: "", urgency: "Routine", follow: "" });
  };
  const setStatus = (rid, status) => { setClients((p) => p.map((x) => x.id === c.id ? { ...x, referrals: x.referrals.map((y) => y.id === rid ? { ...y, status } : y) } : x)); log("Referral status", `${fullName(c)}: ${status}`); };
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-[2fr_120px_160px_2fr_auto] gap-2 items-end">
        <F label="Destination" req><select className={inp()} value={r.dest} onChange={(e) => setR({ ...r, dest: e.target.value })}><option value="">-- Select --</option>{REFERRAL_DEST.map((x) => <option key={x}>{x}</option>)}</select></F>
        <F label="Urgency"><select className={inp()} value={r.urgency} onChange={(e) => setR({ ...r, urgency: e.target.value })}><option>Routine</option><option>Urgent</option></select></F>
        <F label="Follow-up date" req><input type="date" className={inp()} value={r.follow} onChange={(e) => setR({ ...r, follow: e.target.value })} /></F>
        <F label="Reason" req><input className={inp()} value={r.reason} onChange={(e) => setR({ ...r, reason: e.target.value })} /></F>
        <Btn v="green" onClick={add}><Plus size={14} />Refer</Btn>
      </div>
      {err && <Notice>{err}</Notice>}
      <Table pageSize={4} cols={["Destination", "Urgency", "Reason", "Follow-up", "Status"]} rows={c.referrals.map((y) => [y.dest, y.urgency, y.reason, <span key="f" className={y.status !== "Closed" && y.follow < todayISO() ? "text-rose-600 font-medium" : ""}>{y.follow}{y.status !== "Closed" && y.follow < todayISO() ? " · overdue" : ""}</span>, <select key={y.id} className="border border-slate-200 rounded-lg text-xs p-1 bg-white" value={y.status} onChange={(e) => setStatus(y.id, e.target.value)}><option>Pending</option><option>Seen</option><option>Closed</option></select>])} empty="No referrals for this client." />
    </div>
  );
}

function DiagnosticsModule({ clients, setClients }) {
  const toast = useToast(), log = useLog();
  const [sel, setSel] = useState(null); const [tab, setTab] = useState("results"); const [q, setQ] = useState(""); const [show, setShow] = useState("all");
  const done = clients.filter((x) => x.consults.length);
  const info = (x) => {
    const k = x.consults[x.consults.length - 1];
    const pending = x.labs.filter((l) => !l.result && !l.waived).length, finished = x.labs.filter((l) => l.result).length;
    const refs = x.referrals.filter((r) => r.status !== "Closed").length;
    return { k, pending, finished, refs };
  };
  const list = done.filter((x) => fullName(x).toLowerCase().includes(q.toLowerCase()) || (x.pin || "").includes(q))
    .filter((x) => show === "all" || (show === "pending" && info(x).pending) || (show === "refs" && info(x).refs));
  const c = clients.find((x) => x.id === sel);
  if (c) {
    const { k, pending, finished } = info(c);
    const tabs = [["results", `Lab results (${pending} pending)`], ["refer", `Referrals (${c.referrals.length})`]];
    return (
      <Panel title={`DIAGNOSTICS & REFERRAL — ${fullName(c)}`} right={<button type="button" onClick={() => setSel(null)} className="underline">← All consulted clients</button>}>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 mb-3"><span>{calcAge(c.dob)} y/o · {c.sex === "F" ? "Female" : "Male"} · {c.pin || "No PIN"}</span><span>Last consultation {k.date}</span><span>Diagnosis: {dxList(k).join("; ")}</span><span>{finished} result(s) in</span></div>
        <div className="flex gap-1 border-b border-slate-200 mb-3">{tabs.map(([v, l]) => <button key={v} type="button" onClick={() => setTab(v)} className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === v ? "border-[var(--accent)] text-[var(--accent)] font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{l}</button>)}</div>
        {tab === "results" && <ClientResults c={c} setClients={setClients} />}
        {tab === "refer" && <ClientReferrals c={c} setClients={setClients} />}
      </Panel>
    );
  }
  return (
    <Panel title={`CONSULTED CLIENTS (${done.length})`} right={<span>Clients who completed the doctor's consultation</span>}>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <div className="relative flex-1 min-w-[220px]"><Search size={14} className="absolute left-2 top-3 text-slate-400" /><input className={inp() + " pl-7"} placeholder="Search name or PIN" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">{[["all", "All"], ["pending", "Pending results"], ["refs", "Open referrals"]].map(([v, l]) => <button key={v} type="button" onClick={() => setShow(v)} className={`px-3 py-2 ${show === v ? "bg-[var(--accent)] text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>{l}</button>)}</div>
      </div>
      <Table pageSize={8} cols={["Client", "Consultation", "Diagnosis", "Lab results", "Referrals", ""]} rows={list.map((x) => { const { k, pending, finished, refs } = info(x); return [
        <div key="n"><div className="font-medium">{fullName(x)}</div><div className="text-[11px] text-slate-500">{calcAge(x.dob)} y/o · {x.sex} · {x.pin || "No PIN"}</div></div>,
        k.date, <span key="d" className="text-xs">{dxList(k).join("; ")}</span>,
        <span key="l" className="text-xs">{pending ? <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{pending} pending</span> : x.labs.length ? <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">All done</span> : <span className="text-slate-400">None ordered</span>}{finished ? <span className="text-slate-500"> · {finished} in</span> : null}</span>,
        refs ? <span key="r" className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-xs font-medium">{refs} open</span> : <span key="r" className="text-xs text-slate-400">—</span>,
        <Btn key="o" v="info" onClick={() => { setSel(x.id); setTab("results"); }}>Open</Btn>]; })} empty={done.length ? "No client matches." : "No client has completed a doctor's consultation yet."} />
    </Panel>
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
  const [tab, setTab] = useState("activity"); const [aq, setAq] = useState("");
  const expiring = [...clinic.docs.map((d) => ({ n: d.type + " " + d.ref, exp: d.expires })), ...clinic.physicians.map((p) => ({ n: "PRC " + p.name, exp: p.expiry }))].sort((a, b) => a.exp.localeCompare(b.exp));
  const count = (f) => clients.filter(f).length;
  const tabs = [["activity", "Activity"], ["expiry", "Document expiry"], ["summary", "Summary"], ["eKAS", "eKAS"], ["ePresS", "ePresS"], ["xml", "XML"]];
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-4 border-b border-slate-200">{tabs.map(([k, l]) => <button key={k} type="button" onClick={() => setTab(k)} className={`px-3 py-2 text-sm border-b-2 ${tab === k ? "border-[var(--accent)] text-[var(--accent)] font-semibold" : "border-transparent text-slate-500"}`}>{l}</button>)}</div>
      {tab === "activity" && <Panel title={`ACTIVITY HISTORY (${audit.length})`}><div className="relative mb-3"><Search size={14} className="absolute left-2 top-3 text-slate-400" /><input className={inp() + " pl-7"} placeholder="Search user, action or detail" value={aq} onChange={(e) => setAq(e.target.value)} /></div><Table key={aq} cols={["When", "User", "Action", "Detail"]} rows={audit.filter((a) => (a.user + " " + a.action + " " + a.detail).toLowerCase().includes(aq.toLowerCase())).map((a) => [a.ts, a.user, a.action, a.detail])} empty="No matching activity." /></Panel>}
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
// Historical tranche batches (dummy). The current month is built from real completed tranches via "New batch".
const SEED_PAYMENTS = [
  { id: 1, ref: "TR1-2026-05", period: monthOffset(-5), type: "1st tranche", clients: 45, expected: 45 * 680, received: 45 * 680, status: "Payment Received", method: "Bank transfer", payRef: "ADA-77120", paidOn: addDays(-130) },
  { id: 2, ref: "TR2-2026-06", period: monthOffset(-4), type: "2nd tranche", clients: 30, expected: 30 * 1020, received: 30 * 1020, status: "Payment Received", method: "Cheque deposited", payRef: "OR-10421", paidOn: addDays(-100), chequeNo: "004518", chequeDate: addDays(-112), bank: "Land Bank" },
  { id: 3, ref: "TR1-2026-07", period: monthOffset(-3), type: "1st tranche", clients: 52, expected: 52 * 680, received: 49 * 680, status: "Payment Received", method: "Bank transfer", payRef: "ADA-80433", paidOn: addDays(-70), note: "3 clients denied (₱2,040): awaiting explanation" },
  { id: 4, ref: "TR2-2026-08", period: monthOffset(-2), type: "2nd tranche", clients: 40, expected: 40 * 1020, received: 0, status: "Cheque Issued", chequeNo: "004977", chequeDate: addDays(-41), bank: "Land Bank" },
  { id: 5, ref: "TR1-2026-09", period: monthOffset(-1), type: "1st tranche", clients: 60, expected: 60 * 680, received: 0, status: "Under Review" },
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

const monthName = (ym) => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" }); };
const shortPeso = (n) => (n >= 1000 ? "₱" + (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "k" : "₱" + n);
// Completed tranches that are not yet in any batch, for a given month.
const unbilled = (clients, ym) => clients.flatMap((c) => [["t1", "1st tranche", tranche1(c)], ["t2", "2nd tranche", tranche2(c)]]
  .filter(([k, , t]) => t.done && t.date.slice(0, 7) === ym && !(c.billed && c.billed[k])).map(([k, label, t]) => ({ c, k, label, amount: t.amount, date: t.date })));

function PaymentsModule({ payments, setPayments, clients, setClients }) {
  const toast = useToast(), log = useLog();
  const [filter, setFilter] = useState("All"); const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [ym, setYm] = useState(todayISO().slice(0, 7)); const [kinds, setKinds] = useState({ t1: true, t2: true });
  const sum = (arr, k) => arr.reduce((a, p) => a + (+p[k] || 0), 0);
  const recd = payments.filter((p) => p.status === "Payment Received"), cheque = payments.filter((p) => p.status === "Cheque Issued");
  const waiting = payments.filter((p) => p.status === "Awaiting Payment" || p.status === "Under Review");
  const shortPaid = recd.filter((p) => p.received < p.expected); const variance = shortPaid.reduce((a, p) => a + (p.expected - p.received), 0);
  const allMonths = [...new Set(clients.flatMap((c) => [tranche1(c), tranche2(c)].filter((t) => t.done).map((t) => t.date.slice(0, 7))))];
  const earnedNotBilled = allMonths.flatMap((m) => unbilled(clients, m)).reduce((a, x) => a + x.amount, 0);
  const periods = [...new Set([...payments.map((p) => p.period), ...allMonths])].sort().slice(-8);
  const perPeriod = periods.map((per) => { const items = payments.filter((p) => p.period === per); const ub = unbilled(clients, per).reduce((a, x) => a + x.amount, 0);
    return { per, expected: sum(items, "expected") + ub, received: sum(items.filter((p) => p.status === "Payment Received"), "received"), pending: items.some((p) => p.status !== "Payment Received") || ub > 0, unbilled: ub, state: ub ? "Not yet billed" : items.find((p) => p.status !== "Payment Received")?.status || "Paid" }; });
  const max = Math.max(1, ...perPeriod.map((x) => x.expected));
  const rows = payments.filter((p) => (filter === "All" || payStates(p).includes(filter)) && (p.ref + " " + p.type + " " + (p.chequeNo || "") + (p.payRef || "")).toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.period.localeCompare(a.period));
  const patch = (id, data, what) => { setPayments((l) => l.map((p) => (p.id === id ? { ...p, ...data } : p))); log(what, payments.find((p) => p.id === id).ref); };
  const pick = unbilled(clients, ym).filter((x) => kinds[x.k]);
  const createBatch = () => {
    if (!pick.length) return toast("No completed, unbilled tranches for that month.", "info");
    const types = [...new Set(pick.map((x) => x.label))];
    const ref = `TR${types.length > 1 ? "" : types[0] === "1st tranche" ? "1" : "2"}-${ym}-${String(payments.filter((p) => p.period === ym).length + 1).padStart(2, "0")}`;
    const items = pick.map((x) => ({ clientId: x.c.id, name: fullName(x.c), pin: x.c.pin, tranche: x.label, amount: x.amount, date: x.date }));
    setPayments((l) => [...l, { id: nid(), ref, period: ym, type: types.join(" + "), clients: new Set(items.map((x) => x.clientId)).size, items, expected: items.reduce((a, x) => a + x.amount, 0), received: 0, status: "Awaiting Payment" }]);
    setClients((p) => p.map((c) => { const mine = pick.filter((x) => x.c.id === c.id); return mine.length ? { ...c, billed: { ...(c.billed || {}), ...Object.fromEntries(mine.map((x) => [x.k, ref])) } } : c; }));
    log("Tranche batch created", `${ref}: ${items.length} tranche(s), ${peso(items.reduce((a, x) => a + x.amount, 0))}`); toast(`Batch ${ref} created.`);
  };
  const card = (label, value, hint, tone) => <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><div className="text-xs text-slate-500">{label}</div><div className={`text-xl font-semibold mt-1 ${tone || ""}`}>{value}</div><div className="text-[11px] text-slate-400 mt-0.5">{hint}</div></div>;
  return (
    <Paged>
      <div className="flex items-center gap-2 text-xs text-slate-500"><Info size={14} className="shrink-0" />Tranche rates: 1st tranche ₱680 (consultation) · 2nd tranche ₱1,020 (performance / labs). Past batches are sample data.</div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {card("Earned, not yet billed", peso(earnedNotBilled), "Completed tranches without a batch", "text-sky-700")}
        {card("Payment received", peso(sum(recd, "received")), `${recd.length} batch(es)`, "text-emerald-600")}
        {card("On cheque", peso(sum(cheque, "expected")), `${cheque.length} cheque(s) to claim/deposit`, "text-amber-600")}
        {card("Awaiting / under review", peso(sum(waiting, "expected")), `${waiting.length} batch(es)`)}
        {card("Short-paid / denied", peso(variance), `${shortPaid.length} batch(es) to reconcile`, variance ? "text-rose-600" : "")}
      </div>
      <Panel title="OVERVIEW">
        <div className="flex items-end gap-3 h-44">{perPeriod.map((x) => (
          <div key={x.per} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="flex items-end gap-1 h-36 w-full justify-center">
              <div className="w-[38%] flex flex-col items-center justify-end h-full"><span className="text-[10px] text-slate-500 mb-0.5">{shortPeso(x.expected)}</span><div title={`Expected ${peso(x.expected)}`} className="w-full rounded-t bg-slate-300" style={{ height: (x.expected / max) * 100 + "%" }} /></div>
              <div className="w-[38%] flex flex-col items-center justify-end h-full">{x.received ? <><span className="text-[10px] text-[var(--accent)] font-medium mb-0.5">{shortPeso(x.received)}</span><div title={`Received ${peso(x.received)}`} className="w-full rounded-t bg-[var(--accent)]" style={{ height: (x.received / max) * 100 + "%" }} /></> : <div title={x.state} className="w-full rounded-t border-2 border-dashed border-amber-300 bg-amber-50" style={{ height: Math.max(8, (x.expected / max) * 100) + "%" }} />}</div>
            </div>
            <div className="text-[11px] text-slate-600 font-medium">{monthName(x.per)}</div>
            <div className={`text-[10px] ${x.state === "Paid" ? "text-emerald-600" : "text-amber-700"}`}>{x.state === "Paid" && x.received < x.expected ? "Short-paid" : x.state}</div>
          </div>))}</div>
        <div className="flex gap-4 text-xs text-slate-500 mt-3"><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-300" />Expected</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[var(--accent)]" />Received</span><span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-dashed border-amber-300 bg-amber-50" />Not yet paid</span></div>
      </Panel>
      <Panel title="NEW BATCH">
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <F label="Month of completed tranches"><input type="month" className={inp()} value={ym} onChange={(e) => setYm(e.target.value)} /></F>
          <Check checked={kinds.t1} onChange={(v) => setKinds({ ...kinds, t1: v })} label="1st tranche (₱680)" />
          <Check checked={kinds.t2} onChange={(v) => setKinds({ ...kinds, t2: v })} label="2nd tranche (₱1,020)" />
          <div className="ml-auto text-sm">Total: <b>{peso(pick.reduce((a, x) => a + x.amount, 0))}</b> · {pick.length} tranche(s)</div>
          <Btn v="green" disabled={!pick.length} onClick={createBatch}><Plus size={14} />Create batch</Btn>
        </div>
        <Table pageSize={5} cols={["Client", "PIN", "Tranche", "Completed", "Amount"]} rows={pick.map((x) => [fullName(x.c), x.c.pin || "—", x.label, x.date, peso(x.amount)])} empty="No completed tranches waiting to be billed for this month." />
      </Panel>
      <Panel title="CHEQUES">
        <Table cols={["Batch", "Cheque no.", "Bank", "Cheque date", "Days out", "Amount", ""]} rows={cheque.map((p) => { const d = -daysUntil(p.chequeDate); return [p.ref, p.chequeNo, p.bank, p.chequeDate, <span key={p.id} className={d >= 30 ? "text-rose-600 font-medium" : ""}>{d}{d >= 30 ? " · follow up" : ""}</span>, peso(p.expected), <Btn key={"b" + p.id} v="green" onClick={() => setModal({ p, mode: "receive" })}>Mark received</Btn>]; })} empty="No cheques outstanding." />
      </Panel>
      <Panel title="LEDGER" right={<span>{rows.length} batch(es)</span>}>
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="relative flex-1 min-w-[200px]"><Search size={14} className="absolute left-2 top-3 text-slate-400" /><input className={inp() + " pl-7"} placeholder="Search batch, tranche, cheque or receipt no." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className={inp() + " max-w-[200px]"} value={filter} onChange={(e) => setFilter(e.target.value)}><option>All</option>{[...PAY_STATUS, "Short-paid"].map((x) => <option key={x}>{x}</option>)}</select>
        </div>
        <Table pageSize={3} cols={["Batch", "Period", "Tranche", "Clients", "Expected", "Received", "Status", ""]} rows={rows.map((p) => [<span key="r" className="text-xs font-medium whitespace-nowrap">{p.ref}</span>, monthName(p.period), <span key="t" className="text-xs">{p.type}</span>, <span key="c" title={(p.items || []).map((x) => `${x.name} (${x.tranche})`).join("\n")}>{p.clients || (p.items || []).length || "—"}</span>, peso(p.expected), p.status === "Payment Received" ? peso(p.received) : "—",
          <div key={p.id} className="flex gap-1 flex-wrap">{payStates(p).map((x) => <span key={x} className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${PAY_BADGE[x]}`}>{x}</span>)}</div>,
          <div key={"a" + p.id} className="flex gap-1">{(p.status === "Awaiting Payment" || p.status === "Under Review") && <>{p.status === "Awaiting Payment" && <Btn v="white" onClick={() => { patch(p.id, { status: "Under Review" }, "Batch under review"); toast("Marked under review."); }}>Review</Btn>}<Btn v="info" onClick={() => setModal({ p, mode: "cheque" })}>Cheque</Btn><Btn v="green" onClick={() => setModal({ p, mode: "receive" })}>Received</Btn></>}{p.status === "Cheque Issued" && <Btn v="green" onClick={() => setModal({ p, mode: "receive" })}>Received</Btn>}</div>])} empty="No batches match." />
      </Panel>
      {modal && <PayModal key={modal.p.id + modal.mode} p={modal.p} mode={modal.mode} onClose={() => setModal(null)} onSave={(d) => { patch(modal.p.id, d, modal.mode === "cheque" ? "Cheque recorded" : "Payment received"); toast(modal.mode === "cheque" ? "Cheque recorded." : "Payment recorded."); setModal(null); }} />}
    </Paged>
  );
}

/* ---------- Assistant chatbot ---------- */
const PAGE_NAMES = { home: "Dashboard", clinic: "Clinic Accreditation", docs: "Documents & Physicians", emrcfg: "EMR Configuration", reg: "Registered Clients", hsa: "FPE & Health Profile", emp: "YES & Empanelment", consult: "Consultation", diag: "Diagnostics & Referral", med: "Medicine", pay: "PhilHealth Payments", sub: "EMR Submission", audit: "Audit & Reports", upl: "Masterlist Uploader", users: "User Accounts", kb: "Assistant Knowledge" };
const HOWTO = [
  [/regist|new (client|patient)|add (client|patient)|sync|tranche/, "reg", "Clients are registered on the partner registration website and synced here: open Registered Clients and click Sync clients. The list shows empanelment (from the registration site), 1st tranche (doctor's consultation done) and 2nd tranche (all ordered labs have results)."],
  [/fpe|first patient|health screen|hsa|health profile/, "hsa", "To do the First Patient Encounter: open FPE & Health Profile, pick the client and complete the Health Screening & Assessment Record tabs: Profile & Medical History, Surgical & Family History, Personal/Social, Immunizations, Women's Health (female clients), Physical Exam, Findings per System and NCD Risk (25 years and above). Then Review and Save HSA. A saved FPE becomes read-only."],
  [/empanel|yes form|\byes\b|consent|pcu/, "reg", "Empanelment (YES), PCU and consents are recorded on the partner registration website. After syncing, Registered Clients shows each client\'s empanelment; empanelled clients with a completed FPE are Ready for Care."],
  [/consult|soap|diagnos/, "consult", "Consultation (doctors and super admin) follows the Consultation Record: Profile & chief complaint, Physical exam, Findings A–D and E–H, Assessment/Diagnosis (up to 7), Laboratory/Imaging (the 13 selected tests with the age guide; Doctor Yes/No and Client Request/Refuse), Management & prescription, then Review and Save. Only Ready for Care clients appear."],
  [/lab|diagnostic|order|result|referr|pap|cbc|ecg|x-?ray|lipid|ogtt|hba1c|fecal|sputum/, "diag", "Diagnostics & Referral lists every client who completed the doctor's consultation, with pending lab results and open referrals. Click Open on a client to enter lab results or create referrals. Tests are ordered during the Consultation (Labs steps) and appear there automatically."],
  [/dispens|medicine|prescri|gamot|drug|formulary/, "med", "Medicine has two tabs: Dispensing (prescriptions from consultations; click Dispense) and the GAMOT List: 75 medicines = 21 eKonsulta + 54 YAKAP. Search, filter by category or by eKonsulta / YAKAP, and see dispensing limits. Prescriptions can only use GAMOT medicines and respect the day limits (7, 14 or 30 days)."],
  [/submit|emr submission|upload record|acknowledg/, "sub", "EMR Submission lists each record's status: Draft, Validation Failed, Ready to Submit, Pending Acknowledgment, Acknowledged. Submitting needs Approval Verified clinic status and a tested EMR connection."],
  [/accredit|checklist|readiness|approval/, "clinic", "Clinic Accreditation shows the readiness checklist and open items. Submit the application when all items are done, then record PhilHealth's official decision with its reference number. Only that sets Approval Verified."],
  [/document|physician|prc|license|expir/, "docs", "Documents & Physicians tracks PDR, Performance Commitment and SAT documents plus the physician roster. Each shows Valid, Expiring (within 60 days) or Expired."],
  [/payment|cheque|check|remittance|short.?paid|batch/, "pay", "PhilHealth Payments: 1st tranche ₱680 per client (consultation done) and 2nd tranche ₱1,020 (all ordered labs resulted). Overview compares expected vs received by month; New batch bills a month\'s completed tranches; Cheques and Ledger track cheque issued and payment received."],
  [/user|account|password|role/, "users", "User Accounts (super admin and admin) lets you create accounts, change roles, deactivate users and reset passwords."],
];
function localAnswer(q, ctx) {
  const t = q.toLowerCase();
  const { clients, clinic, payments, role } = ctx;
  const names = (arr) => arr.slice(0, 8).map(fullName).join("; ") + (arr.length > 8 ? ` … and ${arr.length - 8} more` : "");
  const by = (st) => clients.filter((c) => patientStatus(c) === st);
  // Role gate: answers only include data from modules this role may open.
  const deny = (page) => ({ text: `That information is in ${PAGE_NAMES[page]}, which your role (${ROLES[role]}) can't access.` });
  // open / go to a page
  const goRe = /^(go to|open|show me|take me to|navigate to)\s+(the\s+)?/;
  const target = goRe.test(t) ? t.replace(goRe, "").replace(/\s*(page|module|screen|tab)$/, "").trim() : "";
  const nav = target && (Object.entries(PAGE_NAMES).find(([, n]) => n.toLowerCase() === target) || Object.entries(PAGE_NAMES).find(([id, n]) => id === target || n.toLowerCase().split(/[\s&/]+/).some((w) => w.length > 2 && target.split(/\s+/).includes(w))));
  if (nav) return can(role, nav[0]) ? { text: `Opening ${nav[1]}.`, go: nav[0], auto: true } : { text: `Your role (${ROLES[role]}) doesn't have access to ${nav[1]}.` };
  // a specific client
  const hit = clients.find((c) => [c.last, c.first].some((n) => n.length > 2 && t.includes(n.toLowerCase())));
  if (hit) {
    const ps = patientStatus(hit), ss = subStatus(hit);
    const next = { Registered: "start the FPE", "FPE In Progress": "finish and save the FPE", "Awaiting Empanelment": "record and verify the YES / empanelment", "Ready for Care": "do the consultation", "Consultation Completed": ss === "Ready to Submit" ? "submit the record in EMR Submission" : ss === "Validation Failed" ? "fix the validation errors in EMR Submission" : "wait for or record the acknowledgment" }[ps];
    const errs = validateRecord(hit);
    const showEmr = can(role, "sub");
    return { text: `${fullName(hit)} (${TYPES[hit.type]}, ${calcAge(hit.dob)} y/o): encounter status ${ps}${showEmr ? `; EMR status ${ss}` : ""}.${showEmr && hit.consults.length && errs.length ? " Validation issues: " + errs.join("; ") + "." : ""} Next step: ${next}.` };
  }
  if (/pending fpe|no fpe|without fpe|need.*fpe/.test(t)) { const l = clients.filter((c) => !c.hsa); return { text: l.length ? `${l.length} client(s) still need an FPE: ${names(l)}.` : "All registered clients have a completed FPE.", go: "hsa" }; }
  if (/awaiting empanel|not empanel/.test(t)) { const l = by("Awaiting Empanelment"); return { text: l.length ? `${l.length} awaiting empanelment: ${names(l)}.` : "All clients with an FPE are empanelled.", go: "reg" }; }
  if (/ready for care|can (be )?consult/.test(t)) { const l = by("Ready for Care"); return { text: l.length ? `${l.length} ready for consultation: ${names(l)}.` : "No clients are currently Ready for Care.", go: "consult" }; }
  if (/error|fail|invalid|reject/.test(t) && !can(role, "sub")) return deny("sub");
  if (/ready to submit|pending ack|acknowledg.*pending|submission status/.test(t) && !can(role, "sub")) return deny("sub");
  if (/blocker|open item|why.*(not|can't|cannot).*(submit|approv)|missing/.test(t) && !can(role, "clinic")) return deny("clinic");
  if (/expir/.test(t) && !can(role, "docs")) return deny("docs");
  if (/error|fail|invalid|reject/.test(t)) { const l = clients.filter((c) => subStatus(c) === "Validation Failed"); return { text: l.length ? `${l.length} record(s) failed validation: ` + l.map((c) => `${fullName(c)} (${(c.sub && c.sub.rejected) || validateRecord(c).join(", ")})`).join("; ") + "." : "No submission errors right now.", go: "sub" }; }
  if (/ready to submit|pending ack|acknowledg.*pending|submission status/.test(t)) { const r = clients.filter((c) => subStatus(c) === "Ready to Submit"), p = clients.filter((c) => subStatus(c) === "Pending Acknowledgment"); return { text: `${r.length} ready to submit, ${p.length} pending acknowledgment, ${clients.filter((c) => subStatus(c) === "Acknowledged").length} acknowledged.`, go: "sub" }; }
  if (/how many|count|total|summary|overview|statistic/.test(t) && !/payment|cheque/.test(t)) {
    const n = (s) => by(s).length;
    return { text: `${clients.length} registered clients: ${n("Registered")} registered only, ${n("FPE In Progress")} FPE in progress, ${n("Awaiting Empanelment")} awaiting empanelment, ${n("Ready for Care")} ready for care, ${n("Consultation Completed")} with completed consultation. ${can(role, "clinic") ? `Clinic: ${clinicStatus(clinic)} (${readiness(clinic)}% ready).` : ""}` };
  }
  if (/blocker|open item|why.*(not|can't|cannot).*(submit|approv)|missing/.test(t)) { const b = clinicBlockers(clinic); const g = gateReason(clinic); return { text: (b.length ? `Open accreditation items (${b.length}): ${b.join("; ")}.` : "All internal accreditation items are complete.") + (g ? ` Submission is blocked because: ${g}.` : " Submission is not blocked."), go: "clinic" }; }
  if (/expir/.test(t)) { const l = [...clinic.docs.map((d) => [d.type + " " + d.ref, d.expires]), ...clinic.physicians.map((p) => ["PRC " + p.name, p.expiry])].filter(([, e]) => daysUntil(e) <= 60); return { text: l.length ? "Expired or expiring within 60 days: " + l.map(([n, e]) => `${n} (${e}, ${daysUntil(e) < 0 ? "expired" : daysUntil(e) + " days left"})`).join("; ") + "." : "Nothing expires within the next 60 days.", go: "docs" }; }
  if (/payment|cheque|check|remittance|received|paid/.test(t) && !/how/.test(t)) {
    if (!can(role, "pay")) return { text: `Payment information is limited to Admin and Super Admin. Your role is ${ROLES[role]}.` };
    const sum = (a, k) => a.reduce((x, p) => x + (+p[k] || 0), 0);
    const rec = payments.filter((p) => p.status === "Payment Received"), chq = payments.filter((p) => p.status === "Cheque Issued"), wait = payments.filter((p) => ["Awaiting Payment", "Under Review"].includes(p.status));
    const old = chq.filter((p) => -daysUntil(p.chequeDate) >= 30);
    return { text: `Received ${peso(sum(rec, "received"))} (${rec.length}); on cheque ${peso(sum(chq, "expected"))} (${chq.length}${old.length ? `, ${old.length} out 30+ days: follow up` : ""}); awaiting/under review ${peso(sum(wait, "expected"))} (${wait.length}).`, go: "pay" };
  }
  if (/my role|what can i|access|permission/.test(t)) return { text: `You are signed in as ${ROLES[role]}. You can open: ${Object.keys(PAGE_NAMES).filter((p) => can(role, p)).map((p) => PAGE_NAMES[p]).join(", ")}.` };
  const how = HOWTO.find(([re]) => re.test(t));
  if (how && how[1] === "pay" && !can(role, "pay")) return deny("pay");
  if (how) return { text: how[2] + (can(role, how[1]) ? "" : ` (Note: your role, ${ROLES[role]}, can't open ${PAGE_NAMES[how[1]]}.)`), go: can(role, how[1]) ? how[1] : null };
  if (/^(hi|hello|hey|good (morning|afternoon|evening))/.test(t)) return { text: "Hello! Ask me about a client's status, pending FPEs, submission errors, accreditation blockers, expiring documents, payments, or how to do a task." };
  return null;
}
const SUGGEST = ["What do you remember?", "Summary", "Pending FPEs", "Submission errors", "Accreditation blockers", "Expiring documents", "Payments", "How do I empanel?", "What can I access?"];
const CHIP_PAGE = { "Submission errors": "sub", "Accreditation blockers": "clinic", "Expiring documents": "docs", Payments: "pay", "Pending FPEs": "hsa" };

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
// Reveals text gradually (about 45 chars/sec, capped at ~4s for long replies).
function TypeText({ text, onDone, onTick }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const step = Math.max(1, Math.ceil(text.length / 180));
    const id = setInterval(() => setN((k) => { const v = Math.min(text.length, k + step); if (v >= text.length) clearInterval(id); return v; }), 22);
    return () => clearInterval(id);
  }, [text]);
  useEffect(() => { onTick && onTick(); if (n >= text.length && onDone) onDone(); }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>{text.slice(0, n)}{n < text.length && <span className="inline-block w-1.5 h-3.5 align-middle bg-current opacity-50 ml-0.5 animate-pulse" />}</>;
}
function TypingDots() {
  return <div className="flex justify-start"><div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-3 flex gap-1" aria-label="Assistant is typing">{[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: d + "ms" }} />)}</div></div>;
}

const STOP = new Set("the a an is are was were my me i you your to of and or in on at for with what who when where how do does did it this that be can will about please".split(" "));
const stem = (w) => w.replace(/(ing|ed|es|s)$/, "");
const words = (x) => x.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map(stem);
// Memory commands handled before anything else.
function memoryCommand(t, notes) {
  const m = t.match(/^(please\s+)?remember( that)?[:\s]+(.{3,300})$/i);
  if (m) { const text = m[3].trim().replace(/\.$/, ""); if (notes.some((n) => n.text.toLowerCase() === text.toLowerCase())) return { reply: "I already remember that." }; return { add: text, reply: `Got it. I'll remember: "${text}". Say "what do you remember" to see everything I've saved.` }; }
  if (/^(what do you remember|show (my )?(notes|memory|memories)|my notes|list (notes|memories))\??$/i.test(t)) return { reply: notes.length ? "Here's what I remember:\n" + notes.map((n, i) => `${i + 1}. ${n.text}`).join("\n") + '\n\nSay "forget 2" to remove one, or "forget everything".' : 'I have no saved notes yet. Say "remember that …" to teach me something.' };
  const f = t.match(/^forget (note )?#?(\d+)$/i);
  if (f) { const i = +f[2] - 1; return notes[i] ? { remove: i, reply: `Forgot: "${notes[i].text}".` } : { reply: `There's no note number ${f[2]}.` }; }
  if (/^forget (everything|all)( notes| memories)?$/i.test(t)) return { clearNotes: true, clearHistory: true, reply: "Done. I've cleared all saved notes and our chat history." };
  if (/^(clear|delete) (the )?(chat|history|conversation)$/i.test(t)) return { clearHistory: true, reply: "Chat history cleared. Your saved notes are kept." };
  return null;
}
function recallFromNotes(t, notes) {
  const q = words(t); if (!q.length) return null;
  const scored = notes.map((n) => ({ n, s: words(n.text).filter((w) => q.includes(w)).length })).filter((x) => x.s >= Math.min(2, q.length)).sort((a, b) => b.s - a.s);
  return scored.length ? { text: "From what you asked me to remember:\n" + scored.slice(0, 3).map((x) => "• " + x.n.text).join("\n") } : null;
}
/* ---------- Shared assistant knowledge (learned from all accounts) ---------- */
const kbPost = (body) => fetch("/api/knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => ({ ok: r.ok, ...(await r.json().catch(() => ({}))) }));
function matchFact(t, facts) {
  const q = words(t); if (!q.length) return null;
  let best = null;
  for (const f of facts) {
    const fw = words(f.q); if (!fw.length) continue;
    const hit = fw.filter((w) => q.includes(w)).length;
    const score = hit / Math.max(fw.length, q.length);
    if (hit >= Math.min(2, fw.length) && score >= 0.5 && (!best || score > best.score)) best = { f, score };
  }
  return best && best.f;
}
function KnowledgeModule({ me }) {
  const toast = useToast(), log = useLog();
  const [kb, setKb] = useState(null);
  const [form, setForm] = useState({ q: "", a: "" }); const [err, setErr] = useState("");
  const refresh = () => fetch("/api/knowledge").then((r) => r.json()).then(setKb).catch(() => setKb({ error: true }));
  useEffect(() => { refresh(); }, []);
  const act = async (body, ok) => { const r = await kbPost({ user: me.username, role: me.role, ...body }); if (!r.ok) return toast(r.error || "Failed.", "error"); setKb(r); toast(ok); };
  const teach = async () => {
    if (form.q.trim().length < 3 || form.a.trim().length < 2) return setErr("Enter both the question and the answer.");
    setErr(""); await act({ action: "teach", q: form.q, a: form.a }, "The assistant learned this answer for everyone."); log("Assistant taught", form.q); setForm({ q: "", a: "" });
  };
  if (!kb) return <Panel title="ASSISTANT KNOWLEDGE"><div className="text-sm text-slate-500">Loading…</div></Panel>;
  if (kb.error) return <Panel title="ASSISTANT KNOWLEDGE"><Notice>Could not load the knowledge base from the server.</Notice></Panel>;
  return (
    <Paged>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{[["Questions asked", kb.stats.questions], ["Different questions", kb.stats.distinct], ["Accounts asking", kb.stats.users], ["Learned answers", kb.facts.length], ["Awaiting approval", kb.pending.length]].map(([l, n]) => <div key={l} className="bg-white border border-slate-200 rounded-2xl p-3"><div className="text-xl font-semibold">{n}</div><div className="text-xs text-slate-500">{l}</div></div>)}</div>
      <Panel title={`UNANSWERED QUESTIONS (${kb.unanswered.length})`}>
        <p className="text-xs text-slate-500 mb-3">Questions from any account that the assistant couldn't answer. Click Answer to teach it, and everyone gets the answer from then on.</p>
        <Table pageSize={5} cols={["Question", "Times asked", "Accounts", ""]} rows={kb.unanswered.map((q) => [q.q, q.unanswered, q.users.join(", "), <div key={q.q} className="flex gap-1"><Btn v="green" onClick={() => setForm({ q: q.q, a: "" }) || toast("Question copied to the Teach tab.", "info")}>Answer</Btn><Btn v="white" onClick={() => act({ action: "dismiss", q: q.q }, "Dismissed.")}>Dismiss</Btn></div>])} empty="Nothing unanswered. Nice!" />
      </Panel>
      <Panel title={`TEACH AN ANSWER`}>
        <div className="grid md:grid-cols-2 gap-3">
          <F label="Question (how staff would ask it)" req><input className={inp()} value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} placeholder="e.g. What time is the PhilHealth cut-off?" /></F>
          <F label="Answer" req><input className={inp()} value={form.a} onChange={(e) => setForm({ ...form, a: e.target.value })} placeholder="e.g. Submit by the 5th of each month." /></F>
        </div>
        {err && <div className="mt-3"><Notice>{err}</Notice></div>}
        <div className="mt-3"><Btn v="green" onClick={teach}><Plus size={14} />Teach assistant</Btn></div>
      </Panel>
      <Panel title={`PENDING APPROVAL (${kb.pending.length})`}>
        <p className="text-xs text-slate-500 mb-3">Answers taught by Encoder, Nurse or Doctor accounts. Approve to share them with everyone.</p>
        <Table pageSize={5} cols={["Question", "Answer", "Taught by", ""]} rows={kb.pending.map((p) => [p.q, p.a, p.by, <div key={p.id} className="flex gap-1"><Btn v="green" onClick={() => act({ action: "approve", id: p.id }, "Approved and shared.")}>Approve</Btn><Btn v="white" onClick={() => act({ action: "reject", id: p.id }, "Rejected.")}>Reject</Btn></div>])} empty="Nothing waiting for approval." />
      </Panel>
      <Panel title={`LEARNED ANSWERS (${kb.facts.length})`}>
        <Table pageSize={5} cols={["Question", "Answer", "Taught by", "Used", "👍 / 👎", ""]} rows={kb.facts.slice().reverse().map((f) => [f.q, f.a, f.by + (f.approvedBy ? ` (approved by ${f.approvedBy})` : ""), f.uses, `${f.helpful} / ${f.unhelpful}`, <Btn key={f.id} v="white" onClick={() => act({ action: "delete", id: f.id }, "Removed.")}><Trash2 size={14} /></Btn>])} empty="No learned answers yet." />
      </Panel>
      <Panel title="POPULAR QUESTIONS">
        <p className="text-xs text-slate-500 mb-3">The most-asked questions across all accounts. These appear as quick buttons in everyone's chat.</p>
        <Table pageSize={6} cols={["Question", "Times asked", "Accounts"]} rows={kb.popular.map((q) => [q.q, q.count, q.users.length])} empty="No questions yet." />
      </Panel>
    </Paged>
  );
}

const GREETING = { from: "bot", text: "Hi! I'm the YAKAP assistant. Ask about clients, pending work, accreditation, payments, or how to do a task. I also remember things: say \"remember that …\"." };

function ChatWidget({ ctx, go, user }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([GREETING]);
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [memErr, setMemErr] = useState(false);
  const [kb, setKb] = useState({ facts: [], popular: [] });
  const loadKb = () => fetch("/api/knowledge").then((r) => r.json()).then((d) => d && d.facts && setKb(d)).catch(() => {});
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { fetch("/api/chat").then((r) => r.json()).then((d) => setAi(!!d.enabled)).catch(() => setAi(false)); }, []);
  useEffect(() => { loadKb(); }, []);
  useEffect(() => { if (open) loadKb(); }, [open]);
  // Load this user's long-term memory (saved chat + notes) from the server.
  useEffect(() => {
    let alive = true;
    fetch("/api/memory?user=" + encodeURIComponent(user)).then((r) => r.json()).then((d) => {
      if (!alive) return;
      const hist = Array.isArray(d.history) ? d.history : [];
      setNotes(Array.isArray(d.notes) ? d.notes : []);
      setMsgs(hist.length ? [GREETING, { from: "bot", text: `Welcome back. I've restored our last ${hist.length} messages${d.notes && d.notes.length ? ` and ${d.notes.length} saved note(s)` : ""}.` , sys: true }, ...hist] : [GREETING]);
      setLoaded(true);
    }).catch(() => { if (alive) { setMemErr(true); setLoaded(true); } });
    return () => { alive = false; };
  }, [user]);
  // Save after each finished exchange.
  const save = (history, nts) => fetch("/api/memory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user, history, notes: nts }) }).then((r) => setMemErr(!r.ok)).catch(() => setMemErr(true));
  useEffect(() => {
    if (!loaded || msgs.some((m) => m.anim)) return;
    save(msgs.filter((m) => m !== GREETING && !m.sys), notes);
  }, [msgs, notes, loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ block: "end" }); }, [msgs, open]);
  const summary = () => {
    const { clients, clinic, payments, role } = ctx;
    const cnt = (f) => clients.filter(f).length;
    return { role: ROLES[role], ...(can(role, "clinic") ? { clinicStatus: clinicStatus(clinic), readiness: readiness(clinic) + "%", openItems: clinicBlockers(clinic) } : {}), clients: clients.length,
      encounter: Object.fromEntries(["Registered", "FPE In Progress", "Awaiting Empanelment", "Ready for Care", "Consultation Completed"].map((s) => [s, cnt((c) => patientStatus(c) === s)])),
      ...(can(role, "sub") ? { emr: Object.fromEntries(["Draft", "Validation Failed", "Ready to Submit", "Pending Acknowledgment", "Acknowledged"].map((s) => [s, cnt((c) => subStatus(c) === s)])) } : {}),
      payments: can(role, "pay") ? { batches: payments.length, received: payments.filter((p) => p.status === "Payment Received").length, onCheque: payments.filter((p) => p.status === "Cheque Issued").length } : "not permitted for this role",
      modulesAllowed: Object.keys(PAGE_NAMES).filter((p) => can(role, p)).map((p) => PAGE_NAMES[p]) };
  };
  const send = async (text) => {
    const t = (text ?? q).trim(); if (!t || busy || msgs.some((m) => m.anim)) return;
    setQ(""); const next = [...msgs, { from: "me", text: t }]; setMsgs(next);
    const at = new Date().toISOString();
    next[next.length - 1].at = at;
    const mem = memoryCommand(t, notes);
    if (mem) {
      let nts = notes;
      if (mem.add) nts = [...notes, { text: mem.add, at }];
      if (mem.remove !== undefined) nts = notes.filter((_, k) => k !== mem.remove);
      if (mem.clearNotes) nts = [];
      setBusy(true); await sleep(700); setBusy(false);
      setNotes(nts);
      setMsgs([...(mem.clearHistory ? [GREETING] : next), { from: "bot", text: mem.reply, anim: true, at }]);
      return;
    }
    const tm = t.match(/^teach( everyone)?\s*:?\s*(.+?)\s*(=>|->|=)\s*(.+)$/i);
    if (tm) {
      setBusy(true);
      const r = await kbPost({ action: "teach", user, role: ctx.role, q: tm[2], a: tm[4] });
      await sleep(600); setBusy(false);
      if (r.ok) setKb(r);
      const txt = !r.ok ? (r.error || "Couldn't save that.") : r.result === "learned" ? `Learned! From now on, anyone who asks "${tm[2]}" will get: ${tm[4]}` : "Thanks! I've sent this answer to an Admin for approval. Once approved, everyone will get it.";
      setMsgs([...next, { from: "bot", text: txt, anim: true, at }]);
      return;
    }
    const fact = matchFact(t, kb.facts);
    const local = localAnswer(t, ctx) || (fact ? { text: fact.a + `\n— learned from ${fact.by}`, factId: fact.id } : null) || (!ai ? recallFromNotes(t, notes) : null);
    kbPost({ action: "log", user, role: ctx.role, q: t, answered: !!local || ai }).then((r) => r.ok && setKb(r)).catch(() => {});
    if (fact && local && local.factId) kbPost({ action: "used", user, role: ctx.role, id: fact.id }).catch(() => {});
    if (local || !ai) {
      const reply = local || { text: "I don't know that yet. If you know the answer, teach me so everyone benefits:\nteach: " + t + " => your answer\n\nOr try a suggestion, a client's name, or \"how do I …\"." };
      setBusy(true);
      await sleep(Math.min(1600, 650 + reply.text.length * 3));   // "thinking" pause
      setBusy(false);
      setMsgs([...next, { from: "bot", ...reply, anim: true, at }]);
      return;
    }
    setBusy(true);
    try {
      const history = next.filter((m) => m !== GREETING && !m.sys).slice(-16).map((m) => ({ role: m.from === "me" ? "user" : "assistant", content: m.text }));
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history, context: { ...summary(), memoryNotes: notes.map((n) => n.text), sharedKnowledge: kb.facts.slice(-30).map((f) => ({ q: f.q, a: f.a })) } }) });
      const d = await r.json();
      setMsgs([...next, { from: "bot", text: r.ok ? d.text : d.error || "The AI service is unavailable right now.", ai: r.ok, anim: true, at }]);
    } catch { setMsgs([...next, { from: "bot", text: "Couldn't reach the AI service. Built-in answers still work." }]); }
    setBusy(false);
  };
  return (
    <>
      {open && <div className="fixed bottom-20 right-5 z-40 w-[360px] max-w-[calc(100vw-2.5rem)] h-[480px] max-h-[calc(100vh-7rem)] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"><div><div className="text-sm font-semibold flex items-center gap-1.5"><Bot size={16} className="text-[var(--accent)]" />YAKAP Assistant</div><div className="text-[10px] text-slate-500">{ai ? "Built-in answers + AI" : "Built-in answers"} · {memErr ? <span className="text-rose-600">memory not saving</span> : `remembers ${notes.length} note${notes.length === 1 ? "" : "s"} + chat · ${kb.facts.length} shared answer${kb.facts.length === 1 ? "" : "s"}`}</div></div><button type="button" aria-label="Close chat" onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-100"><X size={16} /></button></div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {msgs.map((m, i) => <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.from === "me" ? "bg-[var(--accent)] text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"}`}>{m.anim ? <TypeText text={m.text} onTick={() => endRef.current && endRef.current.scrollIntoView({ block: "end" })} onDone={() => { setMsgs((l) => l.map((x, k) => (k === i ? { ...x, anim: false } : x))); if (m.auto && can(ctx.role, m.go)) go(m.go); }} /> : m.text}{!m.anim && m.go && can(ctx.role, m.go) && <div><button type="button" onClick={() => go(m.go)} className="mt-1.5 text-xs font-semibold underline">Open {PAGE_NAMES[m.go]} →</button></div>}{m.factId && !m.anim && <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">{m.rated ? "Thanks for the feedback." : <>Helpful?<button type="button" aria-label="Helpful" onClick={() => { kbPost({ action: "feedback", user, role: ctx.role, id: m.factId, good: true }); setMsgs((l) => l.map((x, k) => (k === i ? { ...x, rated: true } : x))); }} className="p-0.5 hover:text-emerald-600"><ThumbsUp size={12} /></button><button type="button" aria-label="Not helpful" onClick={() => { kbPost({ action: "feedback", user, role: ctx.role, id: m.factId, good: false }); setMsgs((l) => l.map((x, k) => (k === i ? { ...x, rated: true } : x))); }} className="p-0.5 hover:text-rose-600"><ThumbsDown size={12} /></button></>}</div>}
              {m.ai && !m.anim && <div className="mt-1 text-[10px] opacity-60">AI-generated, so check important details.</div>}</div></div>)}
          {busy && <TypingDots />}
          <div ref={endRef} />
        </div>
        <div className="px-3 pt-2 flex gap-1.5 overflow-x-auto">{[...kb.popular.map((p) => p.q).filter((x) => !SUGGEST.some((s) => s.toLowerCase() === x.toLowerCase()) && x.length <= 40).slice(0, 3), ...SUGGEST.filter((x) => !CHIP_PAGE[x] || can(ctx.role, CHIP_PAGE[x]))].map((s) => <button key={s} type="button" onClick={() => send(s)} className="shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">{s}</button>)}</div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 flex gap-2"><input className={inp()} placeholder="Ask a question…" value={q} onChange={(e) => setQ(e.target.value)} maxLength={500} /><button type="submit" aria-label="Send" disabled={busy || !q.trim()} className="px-3 rounded-lg text-white bg-[var(--accent)] hover:bg-[var(--accent-h)] disabled:opacity-40"><Send size={16} /></button></form>
      </div>}
      <button type="button" aria-label={open ? "Close assistant" : "Open assistant"} onClick={() => setOpen(!open)} className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full shadow-lg text-white bg-[var(--accent)] hover:bg-[var(--accent-h)] flex items-center justify-center">{open ? <X size={20} /> : <MessageCircle size={20} />}</button>
    </>
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
  ["Patient", [["reg", "Registered Clients", Users], ["hsa", "FPE & Health Profile", ClipboardList], ["consult", "Consultation", Stethoscope], ["diag", "Diagnostics & Referral", FlaskConical], ["med", "Medicine", Pill]]],
  ["Finance", [["pay", "PhilHealth Payments", Wallet]]],
  ["Submission", [["sub", "EMR Submission", Send], ["audit", "Audit & Reports", History], ["upl", "Masterlist Uploader", Upload]]],
  ["Administration", [["users", "User Accounts", KeyRound], ["kb", "Assistant Knowledge", BookOpen]]],
];
const PATIENT_PAGES = ["reg", "hsa", "consult", "diag", "med"];
/* ---------- Accounts & roles ---------- */
const ROLES = { superadmin: "Super Admin", admin: "Admin", encoder: "Encoder / IT", nurse: "Nurse", doctor: "Doctor" };
const ALL = Object.keys(ROLES);
const PERMS = {
  home: ALL,
  clinic: ["superadmin", "admin"], docs: ["superadmin", "admin"], emrcfg: ["superadmin", "admin", "encoder"],
  reg: ["superadmin", "admin", "encoder", "nurse"], hsa: ["superadmin", "encoder", "nurse", "doctor"], emp: ["superadmin", "admin", "encoder", "nurse"],
  consult: ["superadmin", "doctor"], diag: ["superadmin", "nurse", "doctor"], med: ["superadmin", "nurse", "doctor"],
  pay: ["superadmin", "admin"], sub: ["superadmin", "admin", "encoder"], audit: ["superadmin", "admin"], upl: ["superadmin", "encoder"],
  users: ["superadmin", "admin"], kb: ["superadmin", "admin"], profile: ALL,
};
const can = (role, page) => (PERMS[page] || []).includes(role);
// Admins may manage staff accounts but not Super Admin / Admin accounts.
const canManage = (actor, target) => actor === "superadmin" || (actor === "admin" && !["superadmin", "admin"].includes(target));
const SEED_USERS = [
  { id: 1, username: "superadmin", password: "Super@123", name: "System Super Admin", role: "superadmin", active: true },
  { id: 2, username: "admin", password: "Admin@123", name: "Rosa M. Dizon", role: "admin", active: true },
  { id: 3, username: "encoder", password: "Encoder@123", name: "Noel Villanueva", role: "encoder", active: true },
  { id: 4, username: "nurse", password: "Nurse@123", name: "Elena Reyes, RN", role: "nurse", active: true, title: "Primary Care Nurse", prc: "0456123" },
  { id: 5, username: "doctor", password: "Doctor@123", name: "Dr. Maria L. Santos", role: "doctor", active: true, title: "Family Medicine Physician", prc: "0098231" },
];
const AVATAR_COLORS = [["", "Theme color"], ["#0a9d98", "Teal"], ["#2563eb", "Blue"], ["#7c3aed", "Violet"], ["#db2777", "Pink"], ["#ea580c", "Orange"], ["#16a34a", "Green"], ["#475569", "Slate"]];
const pwOk = (s) => s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s);
function Avatar({ u, size = 32 }) {
  return <div className="rounded-full text-white flex items-center justify-center font-bold shrink-0" style={{ width: size, height: size, fontSize: size * 0.36, background: u.color || "var(--accent)" }}>{initials(u.name)}</div>;
}
// My profile: every role can edit its own profile, password and preferences.
function ProfileModule({ me, setUsers, theme, setTheme, startTab }) {
  const toast = useToast(), log = useLog();
  const [tab, setTab] = useState(startTab || "profile");
  const [f, setF] = useState({ name: me.name, title: me.title || "", email: me.email || "", mobile: me.mobile || "", prc: me.prc || "", color: me.color || "" });
  const [pw, setPw] = useState({ cur: "", next: "", again: "" }); const [show, setShow] = useState(false);
  const [err, setErr] = useState(""); const [pwErr, setPwErr] = useState("");
  const clinical = me.role === "doctor" || me.role === "nurse";
  const dirty = ["name", "title", "email", "mobile", "prc", "color"].some((k) => (f[k] || "") !== (me[k] || ""));
  const saveProfile = () => {
    if (f.name.trim().length < 3) return setErr("Full name must be at least 3 characters.");
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return setErr("Enter a valid email address.");
    if (f.mobile && !/^09\d{9}$/.test(f.mobile)) return setErr("Mobile number must be 11 digits starting with 09.");
    if (clinical && f.prc && !/^\d{6,8}$/.test(f.prc)) return setErr("PRC license number must be 6–8 digits.");
    setErr(""); setUsers((l) => l.map((u) => (u.id === me.id ? { ...u, ...f, name: f.name.trim(), title: f.title.trim(), email: f.email.trim() } : u)));
    log("Profile updated", me.username); toast("Profile saved.");
  };
  const strength = (s) => [s.length >= 8, /[A-Za-z]/.test(s) && /\d/.test(s), /[A-Z]/.test(s) && /[a-z]/.test(s), /[^A-Za-z0-9]/.test(s), s.length >= 12].filter(Boolean).length;
  const st = strength(pw.next);
  const changePw = () => {
    if (!pw.cur) return setPwErr("Enter your current password.");
    if (pw.cur !== me.password) return setPwErr("Current password is incorrect.");
    if (!pwOk(pw.next)) return setPwErr("New password must be at least 8 characters with letters and numbers.");
    if (pw.next === pw.cur) return setPwErr("New password must be different from the current one.");
    if (pw.next !== pw.again) return setPwErr("The new passwords do not match.");
    setPwErr(""); setUsers((l) => l.map((u) => (u.id === me.id ? { ...u, password: pw.next, pwChanged: new Date().toLocaleString() } : u)));
    log("Password changed", me.username); toast("Password changed."); setPw({ cur: "", next: "", again: "" });
  };
  const pickTheme = (t) => { setTheme(t); setUsers((l) => l.map((u) => (u.id === me.id ? { ...u, theme: t } : u))); log("Preference changed", `theme → ${t}`); toast("Theme saved to your profile."); };
  const tabs = [["profile", "Profile"], ["security", "Security"], ["prefs", "Preferences"]];
  return (
    <Panel title="MY PROFILE" right={<span>{me.username} · {ROLES[me.role]}</span>}>
      <div className="flex items-center gap-4 mb-4"><Avatar u={{ ...me, ...f }} size={56} /><div><div className="font-semibold text-lg leading-tight">{f.name || me.name}</div><div className="text-sm text-slate-500">{f.title || ROLES[me.role]}</div><div className="text-[11px] text-slate-400">Last sign-in {me.lastLogin || "—"}{me.pwChanged ? ` · Password changed ${me.pwChanged}` : ""}</div></div></div>
      <div className="flex gap-1 border-b border-slate-200 mb-4">{tabs.map(([v, l]) => <button key={v} type="button" onClick={() => { setTab(v); setErr(""); setPwErr(""); }} className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === v ? "border-[var(--accent)] text-[var(--accent)] font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{l}</button>)}</div>
      {tab === "profile" && <div className="space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <F label="Full name (shown in the app)" req><input className={inp()} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></F>
          <F label="Position / title"><input className={inp()} placeholder={ROLES[me.role]} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></F>
          <F label="Username"><div className="px-3 py-2 text-sm bg-slate-50 rounded-lg border border-slate-200 text-slate-500">{me.username} <span className="text-[10px]">(set by admin)</span></div></F>
          <F label="Email"><input className={inp()} type="email" placeholder="name@example.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></F>
          <F label="Mobile no."><input className={inp()} inputMode="numeric" maxLength={11} placeholder="09XXXXXXXXX" value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value.replace(/\D/g, "") })} /></F>
          {clinical ? <F label="PRC license no."><input className={inp()} inputMode="numeric" value={f.prc} onChange={(e) => setF({ ...f, prc: e.target.value.replace(/\D/g, "") })} /></F> : <F label="Role"><div className="px-3 py-2 text-sm bg-slate-50 rounded-lg border border-slate-200 text-slate-500">{ROLES[me.role]} <span className="text-[10px]">(set by admin)</span></div></F>}
        </div>
        <F label="Avatar color"><div className="flex flex-wrap gap-2">{AVATAR_COLORS.map(([c, l]) => <button key={l} type="button" title={l} aria-label={`Avatar color ${l}`} onClick={() => setF({ ...f, color: c })} className={`w-8 h-8 rounded-full border-2 ${f.color === c ? "border-slate-800 scale-110" : "border-white shadow"}`} style={{ background: c || "var(--accent)" }} />)}</div></F>
        {err && <Notice>{err}</Notice>}
        <div className="flex gap-2"><Btn v="green" disabled={!dirty} onClick={saveProfile}>Save profile</Btn><Btn v="white" disabled={!dirty} onClick={() => { setF({ name: me.name, title: me.title || "", email: me.email || "", mobile: me.mobile || "", prc: me.prc || "", color: me.color || "" }); setErr(""); }}>Cancel</Btn></div>
      </div>}
      {tab === "security" && <div className="max-w-md space-y-3">
        <F label="Current password" req><input type={show ? "text" : "password"} autoComplete="current-password" className={inp()} value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} /></F>
        <F label="New password" req><input type={show ? "text" : "password"} autoComplete="new-password" className={inp()} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></F>
        {pw.next && <div className="flex items-center gap-2"><div className="flex-1 flex gap-1">{[0, 1, 2, 3, 4].map((k) => <div key={k} className={`h-1.5 flex-1 rounded ${k < st ? (st <= 2 ? "bg-rose-400" : st <= 3 ? "bg-amber-400" : "bg-emerald-500") : "bg-slate-200"}`} />)}</div><span className="text-[11px] text-slate-500 w-14">{st <= 2 ? "Weak" : st <= 3 ? "Fair" : "Strong"}</span></div>}
        <F label="Confirm new password" req><input type={show ? "text" : "password"} autoComplete="new-password" className={inp()} value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} /></F>
        <Check checked={show} onChange={setShow} label="Show passwords" />
        <p className="text-[11px] text-slate-500">At least 8 characters with letters and numbers. Uppercase, symbols and 12+ characters make it stronger.</p>
        {pwErr && <Notice>{pwErr}</Notice>}
        <Btn v="green" onClick={changePw}><KeyRound size={14} />Change password</Btn>
      </div>}
      {tab === "prefs" && <div className="space-y-3">
        <div className="text-sm font-semibold">Theme <span className="font-normal text-xs text-slate-500">(applied every time you sign in)</span></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{THEMES.map((t) => <button key={t.id} type="button" onClick={() => pickTheme(t.id)} className={`theme-${t.id} text-left rounded-xl border-2 p-3 ${theme === t.id ? "border-[var(--accent)]" : "border-slate-200"}`}><div className="h-10 rounded-lg mb-2" style={{ background: "var(--banner)" }} /><div className="flex items-center justify-between text-sm font-medium">{t.name}{theme === t.id && <CheckIcon size={14} className="text-[var(--accent)]" />}</div></button>)}</div>
      </div>}
    </Panel>
  );
}
const initials = (n) => n.replace(/^(Dr\.|Dra\.)\s*/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function LoginScreen({ users, onLogin }) {
  const [u, setU] = useState(""), [p, setP] = useState(""), [err, setErr] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!u.trim() || !p) return setErr("Enter your username and password.");
    const acct = users.find((x) => x.username.toLowerCase() === u.trim().toLowerCase());
    if (!acct || acct.password !== p) return setErr("Incorrect username or password.");
    if (!acct.active) return setErr("This account is deactivated. Contact your administrator.");
    setErr(""); onLogin(acct);
  };
  return (
    <div className="theme-sunga min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl shadow-sm w-full max-w-sm p-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Sunga Hospital logo" className="h-14 w-auto mx-auto mb-5" />
        <h1 className="text-center font-semibold text-slate-800">YAKAP / eKonsulta</h1>
        <p className="text-center text-xs text-slate-500 mb-6">Sign in to continue</p>
        <div className="space-y-3">
          <F label="Username"><input className={inp()} autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} autoFocus /></F>
          <F label="Password"><input type="password" className={inp()} autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} /></F>
        </div>
        {err && <div className="mt-3"><Notice>{err}</Notice></div>}
        <button type="submit" className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-h)]">Sign in</button>
        <details className="mt-5 text-xs text-slate-500">
          <summary className="cursor-pointer">Demo accounts (mock only)</summary>
          <table className="mt-2 w-full"><tbody>{SEED_USERS.map((x) => <tr key={x.id}><td className="py-0.5 pr-2">{ROLES[x.role]}</td><td className="font-mono">{x.username}</td><td className="font-mono pl-2">{x.password}</td></tr>)}</tbody></table>
        </details>
      </form>
    </div>
  );
}

const BLANK_USER = { name: "", username: "", role: "", password: "" };
function UsersModule({ users, setUsers, me }) {
  const toast = useToast(), log = useLog();
  const [f, setF] = useState(BLANK_USER); const [err, setErr] = useState("");
  const [reset, setReset] = useState(null); const [pw, setPw] = useState(""); const [pwErr, setPwErr] = useState("");
  const roleOptions = ALL.filter((r) => canManage(me.role, r));
  const pwRule = (s) => s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s);
  const add = () => {
    if (!f.name.trim()) return setErr("Full name is required.");
    if (!/^[a-z0-9._]{4,20}$/i.test(f.username)) return setErr("Username: 4–20 letters, numbers, dot or underscore.");
    if (users.some((x) => x.username.toLowerCase() === f.username.toLowerCase())) return setErr("Username already exists.");
    if (!f.role) return setErr("Select a role.");
    if (!canManage(me.role, f.role)) return setErr("You cannot create an account with that role.");
    if (!pwRule(f.password)) return setErr("Password must be at least 8 characters with letters and numbers.");
    setErr(""); setUsers((l) => [...l, { ...f, id: nid(), active: true }]);
    log("User created", `${f.username} (${ROLES[f.role]})`); toast("Account created."); setF(BLANK_USER);
  };
  const toggle = (x) => {
    if (x.id === me.id) return toast("You cannot deactivate your own account.", "error");
    if (x.active && x.role === "superadmin" && users.filter((y) => y.role === "superadmin" && y.active).length === 1) return toast("At least one active Super Admin is required.", "error");
    setUsers((l) => l.map((y) => (y.id === x.id ? { ...y, active: !y.active } : y))); log(x.active ? "User deactivated" : "User activated", x.username);
  };
  const changeRole = (x, role) => {
    if (x.id === me.id) return toast("You cannot change your own role.", "error");
    if (x.role === "superadmin" && role !== "superadmin" && users.filter((y) => y.role === "superadmin" && y.active).length === 1) return toast("At least one active Super Admin is required.", "error");
    setUsers((l) => l.map((y) => (y.id === x.id ? { ...y, role } : y))); log("Role changed", `${x.username} → ${ROLES[role]}`); toast("Role updated.");
  };
  const doReset = () => {
    if (!pwRule(pw)) return setPwErr("Password must be at least 8 characters with letters and numbers.");
    setUsers((l) => l.map((y) => (y.id === reset.id ? { ...y, password: pw } : y))); log("Password reset", reset.username); toast("Password updated."); setReset(null); setPw(""); setPwErr("");
  };
  return (
    <Paged>
      <Notice kind="info">Mock accounts held in browser memory only: they reset when the page reloads, and passwords are not encrypted. A real deployment needs server-side login and a database.</Notice>
      <Panel title="USER ACCOUNTS">
        <Table cols={["Name", "Username", "Role", "Status", "Actions"]} rows={users.map((x) => {
          const m = canManage(me.role, x.role) || x.id === me.id;
          return [x.name + (x.id === me.id ? " (you)" : ""), <span key="u" className="font-mono">{x.username}</span>,
            canManage(me.role, x.role) && x.id !== me.id ? <select key="r" className="border border-slate-200 rounded-lg text-xs p-1 bg-white" value={x.role} onChange={(e) => changeRole(x, e.target.value)}>{ALL.filter((r) => canManage(me.role, r)).map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}</select> : ROLES[x.role],
            <span key="s" className={`px-2 py-0.5 rounded-full text-xs font-medium ${x.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{x.active ? "Active" : "Deactivated"}</span>,
            m ? <div key="a" className="flex gap-1">{x.id !== me.id && <Btn v="white" onClick={() => toggle(x)}>{x.active ? "Deactivate" : "Activate"}</Btn>}<Btn v="white" onClick={() => { setReset(x); setPw(""); setPwErr(""); }}>Reset password</Btn></div> : <span key="a" className="text-xs text-slate-400">No access</span>];
        })} />
      </Panel>
      <Panel title="CREATE ACCOUNT">
        <div className="grid md:grid-cols-5 gap-3 items-end">
          <F label="Full name" req><input className={inp()} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></F>
          <F label="Username" req><input className={inp()} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.trim() })} /></F>
          <F label="Role" req><select className={inp()} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="">-- Select --</option>{roleOptions.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}</select></F>
          <F label="Temporary password" req><input type="password" className={inp()} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></F>
          <Btn v="green" onClick={add}><Plus size={14} />Create</Btn>
        </div>
        {err && <div className="mt-3"><Notice>{err}</Notice></div>}
      </Panel>
      <Panel title="ROLE ACCESS">
        <Table pageSize={8} cols={["Module", ...ALL.map((r) => ROLES[r])]} rows={NAV.flatMap(([, items]) => items).concat([["users", "User Accounts"]]).map(([id, label]) => [label, ...ALL.map((r) => (can(r, id) ? <CheckIcon key={r} size={14} className="text-emerald-600" /> : <span key={r} className="text-slate-300">—</span>))])} />
      </Panel>
      {reset && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5">
        <h3 className="font-semibold mb-1">Reset password</h3><p className="text-xs text-slate-500 mb-3">{reset.name} ({reset.username})</p>
        <F label="New password"><input type="password" className={inp()} value={pw} onChange={(e) => setPw(e.target.value)} /></F>
        {pwErr && <div className="mt-3"><Notice>{pwErr}</Notice></div>}
        <div className="flex justify-end gap-2 mt-4"><Btn v="white" onClick={() => setReset(null)}>Cancel</Btn><Btn v="green" onClick={doReset}>Save</Btn></div>
      </div></div>}
    </Paged>
  );
}


export default function EKonsultaApp() {
  const [users, setUsers] = useState(SEED_USERS);
  const [me, setMe] = useState(null);
  const [clients, setClients] = useState(SEED);
  const [clinic, setClinic] = useState(INITIAL_CLINIC);
  const [audit, setAudit] = useState([]);
  const [payments, setPayments] = useState(SEED_PAYMENTS);
  const [page, setPage] = useState("home");
  const [open, setOpen] = useState(true);
  const [theme, setTheme] = useState("sunga");
  const [userMenu, setUserMenu] = useState(false); const [profileTab, setProfileTab] = useState("profile");
  const [themeMenu, setThemeMenu] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [sync, setSync] = useState(null);
  const timer = useRef(null);
  const toast = (message, type = "ok") => { setToastMsg({ message, type }); clearTimeout(timer.current); timer.current = setTimeout(() => setToastMsg(null), 3000); };
  const log = (action, detail = "") => setAudit((p) => [{ ts: new Date().toLocaleString(), user: me ? me.username : "-", action, detail }, ...p].slice(0, 200));
  useEffect(() => () => clearTimeout(timer.current), []);
  const go = (p) => { setPage(p); setThemeMenu(false); setUserMenu(false); };
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
  const login = (acct) => { const ts = new Date().toLocaleString(); setUsers((l) => l.map((u) => (u.id === acct.id ? { ...u, lastLogin: ts } : u))); setTheme(acct.theme || "sunga"); setUserMenu(false); setMe(acct); setPage("home"); setAudit((p) => [{ ts: new Date().toLocaleString(), user: acct.username, action: "Signed in", detail: ROLES[acct.role] }, ...p]); };
  const logout = () => { log("Signed out", ""); setMe(null); setPage("home"); };
  const current = me && users.find((u) => u.id === me.id);
  if (!current || !current.active) return <LoginScreen users={users} onLogin={login} />;
  const role = current.role;
  const allowed = can(role, page);
  return (
    <AppCtx.Provider value={{ toast, log }}>
      <div className={`theme-${theme} h-screen overflow-hidden flex flex-col bg-slate-50 text-slate-800`}>
        <header className="bg-white border-b border-slate-200 shrink-0 z-30">
          <div className="flex items-center justify-between px-4 md:px-6 py-2.5 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" aria-label="Toggle sidebar" onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-slate-100"><Menu size={18} /></button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={theme === "midnight" || theme === "contrast" ? "/logo-dark.png" : "/logo.png"} alt="Sunga Hospital logo" className="h-10 w-auto" />
              <div className="hidden sm:block border-l border-slate-200 pl-3 min-w-0"><div className="font-semibold leading-tight truncate">{HOSPITAL}</div><div className="text-xs text-slate-500 truncate">{HOSPITAL_ADDR} · YAKAP / eKonsulta</div></div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <span className="hidden md:inline"><Badge s={cst} /></span>
              <div className="relative">
                <button type="button" onClick={() => setThemeMenu(!themeMenu)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium hover:bg-slate-50"><Palette size={14} className="text-[var(--accent)]" /><span className="hidden md:inline">{THEMES.find((t) => t.id === theme).name}</span><ChevronDown size={12} /></button>
                {themeMenu && <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-40">{THEMES.map((t) => <button key={t.id} type="button" onClick={() => { setTheme(t.id); setThemeMenu(false); }} className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50">{t.name}{theme === t.id && <CheckIcon size={14} className="text-[var(--accent)]" />}</button>)}</div>}
              </div>
              {can(role, "sub") && <button type="button" onClick={runSync} className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-h)]"><UploadCloud size={14} />Submit ready records</button>}
              <div className="relative flex items-center gap-1">
                <button type="button" aria-label="Open profile menu" aria-expanded={userMenu} onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2 rounded-xl pl-1 pr-2 py-1 hover:bg-slate-100"><Avatar u={current} /><div className="hidden lg:block leading-tight text-left"><div className="text-xs font-semibold">{current.name}</div><div className="text-[10px] text-slate-500">{ROLES[role]}</div></div><ChevronDown size={12} className="text-slate-400" /></button>
                <button type="button" title="Sign out" aria-label="Sign out" onClick={logout} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><LogOut size={16} /></button>
                {userMenu && <div className="absolute right-0 top-full mt-1 w-60 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-40">
                  <div className="px-3 py-2 border-b border-slate-100"><div className="text-sm font-semibold truncate">{current.name}</div><div className="text-[11px] text-slate-500">{current.title ? `${current.title} · ` : ""}{current.username} · {ROLES[role]}</div></div>
                  {[["profile", "My profile", Users], ["security", "Change password", KeyRound], ["prefs", "Preferences", Palette]].map(([t, l, I]) => <button key={t} type="button" onClick={() => { setProfileTab(t); setUserMenu(false); go("profile"); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"><I size={14} className="text-slate-500" />{l}</button>)}
                  <button type="button" onClick={() => { setUserMenu(false); logout(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 border-t border-slate-100"><LogOut size={14} />Sign out</button>
                </div>}
              </div>
            </div>
          </div>
        </header>
        <div className="flex flex-1 min-h-0">
          <aside className={`${open ? "w-64" : "w-[68px]"} shrink-0 bg-white border-r border-slate-200 transition-all duration-200 flex flex-col justify-between overflow-y-auto`}>
            <nav className="px-3 py-2 space-y-0.5">
              <button type="button" title="Dashboard" onClick={() => go("home")} className={`w-full flex items-center gap-3 px-3.5 py-[7px] rounded-xl text-sm transition-colors ${page === "home" ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold" : "text-slate-600 hover:bg-slate-100"}`}><Home size={16} className="shrink-0" />{open && <span>Dashboard</span>}</button>
              {NAV.map(([group, all]) => [group, all.filter(([id]) => can(role, id))]).filter(([, items]) => items.length).map(([group, items]) => (
                <div key={group}>
                  {open ? <div className="px-3.5 pt-2.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group}</div> : <div className="my-2 border-t border-slate-100" />}
                  {items.map(([id, label, Icon]) => (
                    <button key={id} type="button" title={label} onClick={() => go(id)} className={`w-full flex items-center gap-3 px-3.5 py-[7px] rounded-xl text-sm transition-colors ${page === id ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold" : "text-slate-600 hover:bg-slate-100"}`}>
                      <Icon size={16} className="shrink-0" />{open && <span className="truncate">{label}</span>}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            {open && <div className="px-6 py-1.5 text-[10px] text-slate-400">{headerDate()} · Mock data</div>}
          </aside>
          <main className="flex-1 min-w-0 overflow-y-auto px-4 md:px-8 py-4">
            <div className="max-w-6xl mx-auto">
              {allowed && PATIENT_PAGES.includes(page) && cst !== "Approval Verified" && <div className="mb-3 flex items-center gap-2 text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5"><Info size={14} className="shrink-0" />Clinic approval not verified ({cst}): records save as drafts; EMR submission is blocked.</div>}
              {!allowed && <Panel title="ACCESS RESTRICTED"><div className="flex items-center gap-3 text-sm text-slate-600"><Lock size={18} />Your role ({ROLES[role]}) does not have access to this module.</div></Panel>}
              {allowed && <>
              {page === "home" && <HomeModule clients={clients} go={go} clinic={clinic} onSync={runSync} role={role} me={current} payments={payments} />}
              {page === "clinic" && <ClinicModule clinic={clinic} setClinic={setClinic} />}
              {page === "docs" && <DocsModule clinic={clinic} setClinic={setClinic} />}
              {page === "emrcfg" && <EmrConfigModule clinic={clinic} setClinic={setClinic} />}
              {page === "reg" && <RegistrationModule clients={clients} setClients={setClients} go={go} role={role} />}
              {page === "hsa" && <HSAModule clients={clients} setClients={setClients} />}
              {page === "consult" && <ConsultModule clients={clients} setClients={setClients} />}
              {page === "diag" && <DiagnosticsModule clients={clients} setClients={setClients} />}
              {page === "med" && <MedicineModule clients={clients} setClients={setClients} />}
              {page === "pay" && <PaymentsModule payments={payments} setPayments={setPayments} clients={clients} setClients={setClients} />}
              {page === "sub" && <SubmissionModule clients={clients} setClients={setClients} clinic={clinic} />}
              {page === "audit" && <AuditModule clients={clients} clinic={clinic} audit={audit} />}
              {page === "upl" && <UploaderModule />}
              {page === "users" && <UsersModule users={users} setUsers={setUsers} me={current} />}
              {page === "kb" && <KnowledgeModule me={current} />}
              {page === "profile" && <ProfileModule key={current.id + profileTab} me={current} setUsers={setUsers} theme={theme} setTheme={setTheme} startTab={profileTab} />}
              </>}
            </div>
          </main>
        </div>
        <ChatWidget key={current.username} user={current.username} ctx={{ clients, clinic, payments, role }} go={go} />
        {toastMsg && <div role="status" className={`fixed bottom-20 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm text-white ${toastMsg.type === "info" ? "bg-slate-800" : toastMsg.type === "error" ? "bg-rose-600" : "bg-emerald-600"}`}>{toastMsg.type === "info" ? <Info size={16} /> : toastMsg.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}{toastMsg.message}</div>}
        {sync && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"><h3 className="font-semibold mb-1">EMR batch submission</h3><p className="text-sm text-slate-500 mb-4">{SYNC_STEPS[sync.step]}…</p><div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${sync.pct}%` }} /></div><div className="text-xs text-slate-400 mt-2">{sync.pct}% · simulation only</div></div></div>}
      </div>
    </AppCtx.Provider>
  );
}
