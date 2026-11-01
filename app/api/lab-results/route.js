// Laboratory connector: reads results from the laboratory system's database (read-only)
// and matches patients by NAME + BIRTHDATE.
//
// Configure in .env.local (next to package.json), then run rebuild.bat:
//   LAB_DB_TYPE=mysql            # or: mssql   (leave empty = demo lab)
//   LAB_DB_HOST=192.168.1.20
//   LAB_DB_PORT=3306             # 1433 for SQL Server
//   LAB_DB_USER=readonly_user    # use a READ-ONLY account
//   LAB_DB_PASSWORD=********
//   LAB_DB_NAME=lis
//   LAB_DB_QUERY=SELECT p.patient_id, r.test_name, r.result_value AS result, r.unit, r.result_date FROM results r JOIN patients p ON p.patient_id = r.patient_id WHERE UPPER(p.last_name) = :last AND UPPER(p.first_name) = :first AND p.birth_date = :dob AND r.result_date >= :since
//
//   LAB_DB_PATIENT_QUERY=SELECT patient_id FROM patients WHERE UPPER(last_name) = :last AND UPPER(first_name) = :first AND birth_date = :dob
//     (strongly recommended: lets the app detect two lab patients with the same name + birthdate)
// NOTE: if the password contains # or spaces, wrap it in double quotes, e.g. LAB_DB_PASSWORD="Pa#ss word".
//
// The query must return the columns: test_name, result, result_date  (optional: unit, patient_id, remarks).
// Placeholders available: :last  :first  :middle  :dob (YYYY-MM-DD)  :since (YYYY-MM-DD). Values are always sent as parameters (no string building).
export const dynamic = "force-dynamic";

const cfg = () => ({
  type: (process.env.LAB_DB_TYPE || "").toLowerCase(),
  host: process.env.LAB_DB_HOST, port: process.env.LAB_DB_PORT ? Number(process.env.LAB_DB_PORT) : undefined,
  user: process.env.LAB_DB_USER, password: process.env.LAB_DB_PASSWORD, database: process.env.LAB_DB_NAME,
  query: process.env.LAB_DB_QUERY || "", patientQuery: process.env.LAB_DB_PATIENT_QUERY || "",
});
const mode = () => (["mysql", "mssql"].includes(cfg().type) ? "database" : "demo");

// Map laboratory test names to the 13 selected tests.
const MAP = [
  ["LIPID:HDL", /\bhdl\b/i], ["LIPID:LDL", /\bldl\b/i], ["LIPID:TG", /trigly|\btg\b/i], ["LIPID:TC", /total\s*chol|cholesterol,?\s*total|^chol(esterol)?$/i],
  ["OGTT", /ogtt|glucose\s*tolerance/i], ["HBA1C", /a1c|glyco(sylated|hemoglobin)/i], ["FBS", /\bfbs\b|fasting\s*(blood\s*)?(sugar|glucose)/i],
  ["CBC", /\bcbc\b|complete\s*blood/i], ["CREA", /creat/i], ["CXR", /x-?ray|\bcxr\b|chest\s*pa/i], ["SPUTUM", /sputum|\bafb\b/i],
  ["ECG", /\becg\b|\bekg\b|electrocardio/i], ["FOBT", /occult/i], ["FECA", /fecalysis|stool\s*exam|routine\s*stool/i], ["UA", /urinalysis|urine\s*(exam|routine)/i], ["PAP", /\bpap\b/i],
];
const mapTest = (name) => (MAP.find(([, re]) => re.test(String(name || ""))) || [null])[0];
// SQL Server returns DATE as UTC midnight; use UTC parts so the day never shifts.
const iso = (d) => (d instanceof Date ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}` : String(d || "").slice(0, 10));
const clean = (s, n = 60) => String(s || "").trim().toUpperCase().slice(0, n);

async function runQuery(c, params, query = c.query) {
  const names = [];
  if (c.type === "mysql") {
    const mysql = await import("mysql2/promise");
    const sql = query.replace(/:(last|first|middle|dob|since)\b/g, (_, k) => { names.push(k); return "?"; });
    // dateStrings keeps DATE columns as "YYYY-MM-DD" (no timezone shift).
    const conn = await mysql.createConnection({ host: c.host, port: c.port || 3306, user: c.user, password: c.password, database: c.database, connectTimeout: 8000, dateStrings: true });
    try { const [rows] = await conn.execute(sql, names.map((k) => params[k])); return rows; } finally { await conn.end(); }
  }
  const sqlsrv = (await import("mssql")).default;
  const pool = await sqlsrv.connect({ server: c.host, port: c.port || 1433, user: c.user, password: c.password, database: c.database, options: { encrypt: false, trustServerCertificate: true }, connectionTimeout: 8000, requestTimeout: 15000 });
  try {
    const req = pool.request();
    for (const k of ["last", "first", "middle", "dob", "since"]) req.input(k, params[k]);
    const sql = query.replace(/:(last|first|middle|dob|since)\b/g, "@$1");
    return (await req.query(sql)).recordset;
  } finally { await pool.close(); }
}

function demoRows(p) {
  const d = new Date().toISOString().slice(0, 10);
  const all = { CBC: [["CBC", "Hgb 13.2 g/dL, WBC 8.1, Plt 265 — normal"]], FBS: [["Fasting Blood Sugar", "118", "mg/dL"]], OGTT: [["OGTT 2-hr", "152", "mg/dL"]], HBA1C: [["HbA1c", "6.1", "%"]], CREA: [["Creatinine", "0.9", "mg/dL"]],
    LIPID: [["Total Cholesterol", "236", "mg/dL"], ["HDL", "42", "mg/dL"], ["LDL", "158", "mg/dL"], ["Triglycerides", "180", "mg/dL"]], CXR: [["Chest X-Ray PA", "No active lung infiltrates. Heart not enlarged."]],
    SPUTUM: [["Sputum AFB", "Negative for acid-fast bacilli"]], ECG: [["ECG", "Normal sinus rhythm"]], UA: [["Urinalysis", "Clear, pH 6.0, protein negative, sugar negative"]], PAP: [["Pap Smear", "Negative for intraepithelial lesion or malignancy"]],
    FECA: [["Fecalysis", "No ova or parasites seen"]], FOBT: [["Fecal Occult Blood", "Negative"]] };
  return (p.tests.length ? p.tests : Object.keys(all)).flatMap((k) => (all[k] || []).map(([test_name, result, unit]) => ({ patient_id: "DEMO-001", test_name, result, unit: unit || "", result_date: d })));
}

export async function GET() {
  const c = cfg();
  return Response.json({ mode: mode(), type: c.type || null, configured: mode() === "database" && Boolean(c.host && c.user && c.database && c.query), duplicateCheck: Boolean(c.patientQuery) });
}

export async function POST(req) {
  let b; try { b = await req.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  const params = { last: clean(b.last), first: clean(b.first), middle: clean(b.middle), dob: iso(b.dob), since: iso(b.since || "1900-01-01") };
  if (!params.last || !params.first || !/^\d{4}-\d{2}-\d{2}$/.test(params.dob)) return Response.json({ error: "Last name, first name and birthdate are required to match the patient." }, { status: 400 });
  const tests = Array.isArray(b.tests) ? b.tests.filter((t) => typeof t === "string").slice(0, 20) : [];
  const c = cfg();
  let rows;
  if (mode() === "demo") rows = demoRows({ tests });
  else {
    if (!c.host || !c.user || !c.database || !c.query) return Response.json({ error: "Laboratory database is not fully configured (LAB_DB_HOST, LAB_DB_USER, LAB_DB_NAME, LAB_DB_QUERY)." }, { status: 503 });
    if (!/^\s*select\b/i.test(c.query) || /;\s*\S/.test(c.query)) return Response.json({ error: "LAB_DB_QUERY must be a single SELECT statement." }, { status: 500 });
    const safe = (q) => /^\s*select\b/i.test(q) && !/;\s*\S/.test(q);
    if (c.patientQuery && !safe(c.patientQuery)) return Response.json({ error: "LAB_DB_PATIENT_QUERY must be a single SELECT statement." }, { status: 500 });
    try {
      rows = await runQuery(c, params);
      if (c.patientQuery) {
        const ids = [...new Set((await runQuery(c, params, c.patientQuery)).map((x) => String(x.patient_id)))];
        if (ids.length > 1) return Response.json({ mode: mode(), matchedBy: "name + birthdate", patients: ids, multiple: true, results: [] });
      }
    }
    catch (e) { return Response.json({ error: "Could not read the laboratory database: " + String(e && e.message || e).slice(0, 200) }, { status: 502 }); }
  }
  const patients = [...new Set(rows.map((r) => r.patient_id).filter((x) => x !== undefined && x !== null).map(String))];
  const results = rows.slice(0, 500).map((r) => {
    const code = mapTest(r.test_name);
    return { code: code ? code.split(":")[0] : null, part: code && code.includes(":") ? code.split(":")[1] : null, test: String(r.test_name || ""), value: String(r.result ?? "").slice(0, 500), unit: String(r.unit || ""), date: iso(r.result_date), patient: r.patient_id != null ? String(r.patient_id) : null, remarks: r.remarks ? String(r.remarks).slice(0, 200) : "" };
  });
  return Response.json({ mode: mode(), matchedBy: "name + birthdate", patients, multiple: patients.length > 1, results });
}
