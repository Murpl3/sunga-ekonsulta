// Registry connector: client registration, empanelment and consents come from the partner
// registration website. This route fetches the client list from that site's API (server-side).
//
// Configure in .env.local, then run rebuild.bat:
//   REGISTRY_NAME="Partner registration site"
//   REGISTRY_URL=https://partner-site.example/api/clients      # must return JSON: [ {...}, ... ] or { "clients": [ ... ] }
//   REGISTRY_API_KEY="..."                                      # sent as: Authorization: Bearer <key>   (optional)
// Without REGISTRY_URL the app uses a DEMO client list.
//
// Field names are matched flexibly (e.g. pin / philhealth_pin, last_name / lastName, birth_date / dob ...).
// Dates are best sent as YYYY-MM-DD (other formats are read as month/day/year).
export const dynamic = "force-dynamic";

const pick = (o, ...keys) => { for (const k of keys) { const hit = Object.keys(o).find((x) => x.toLowerCase().replace(/[^a-z0-9]/g, "") === k); if (hit && o[hit] !== null && o[hit] !== undefined && o[hit] !== "") return o[hit]; } return ""; };
const ymd = (v) => { if (!v) return ""; const s = String(v); if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10); const d = new Date(s); return isNaN(d) ? "" : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const yes = (v) => v === true || /^(y|yes|true|1|done|verified|empanelled|empaneled|signed)$/i.test(String(v).trim());
function normalize(o) {
  const typeRaw = String(pick(o, "type", "patienttype", "membertype", "category")).toUpperCase();
  // Check non-member first ("NON-MEMBER" also ends with "MEMBER").
  const type = /^NM$|NON/.test(typeRaw) ? "NM" : /^DD$|DEPEND/.test(typeRaw) ? "DD" : /^MM$|MEMBER/.test(typeRaw) ? "MM" : "NM";
  const sexRaw = String(pick(o, "sex", "gender")).toUpperCase();
  return {
    extId: String(pick(o, "id", "clientid", "registrationid", "patientid")),
    pin: String(pick(o, "pin", "philhealthpin", "philhealthno", "philhealthnumber")).trim(),
    last: String(pick(o, "lastname", "last", "surname", "familyname")).trim(), first: String(pick(o, "firstname", "first", "givenname")).trim(),
    middle: String(pick(o, "middlename", "middle")).trim(), ext: String(pick(o, "extension", "suffix", "nameext")).trim(),
    dob: ymd(pick(o, "birthdate", "dob", "dateofbirth", "birthday")), sex: sexRaw.startsWith("F") ? "F" : sexRaw.startsWith("M") ? "M" : "",
    type, civil: String(pick(o, "civilstatus", "civil", "maritalstatus")), mobile: String(pick(o, "mobile", "mobileno", "contactno", "phone")),
    prov: String(pick(o, "province")).toUpperCase(), mun: String(pick(o, "municipality", "city", "citymunicipality")).toUpperCase(), brgy: String(pick(o, "barangay", "brgy")).toUpperCase(), zip: String(pick(o, "zip", "zipcode")),
    regDate: ymd(pick(o, "registrationdate", "dateregistered", "registereddate", "createdat")),
    empanelled: yes(pick(o, "empanelled", "empaneled", "empanelmentstatus", "yes", "empanelment")), empanelDate: ymd(pick(o, "empanelmentdate", "empanelleddate", "empaneleddate")),
    pcu: String(pick(o, "pcu", "primarycareunit", "pcprovider", "facility")),
    consent: yes(pick(o, "consent", "dataprivacyconsent", "consentsigned")), loa: yes(pick(o, "loa", "letterofauthorization")),
  };
}
function demo() {
  const today = new Date(); const d = (n) => { const x = new Date(today); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
  const base = { province: "DAVAO DEL SUR", municipality: "DIGOS CITY", pcu: "Sunga Hospital PCU", consent: "yes", loa: "yes" };
  return [
    { id: "R-0001", philhealth_pin: "12-050007919-1", last_name: "Dela Cruz", first_name: "Juan", middle_name: "Santos", birth_date: "1968-03-14", sex: "Male", type: "Member", barangay: "Zone 1", registration_date: d(60), empanelled: "yes", empanelment_date: d(58), ...base },
    { id: "R-0002", philhealth_pin: "12-050015838-2", last_name: "Reyes", first_name: "Maria", middle_name: "Garcia", birth_date: "1975-07-22", sex: "Female", type: "Member", barangay: "Zone 1", registration_date: d(40), empanelled: "no", ...base },
    { id: "R-0003", philhealth_pin: "12-050023757-3", last_name: "Bautista", first_name: "Pedro", middle_name: "Lim", birth_date: "1990-11-02", sex: "Male", type: "Member", barangay: "Zone 1", registration_date: d(30), empanelled: "yes", empanelment_date: d(29), ...base },
    { id: "R-0004", philhealth_pin: "12-050031676-4", last_name: "Aquino", first_name: "Liza", middle_name: "Mendoza", birth_date: "2016-05-30", sex: "Female", type: "Dependent", barangay: "Zone 1", registration_date: d(25), empanelled: "yes", empanelment_date: d(25), ...base },
    { id: "R-0005", philhealth_pin: "12-050039595-5", last_name: "Castillo", first_name: "Ramon", middle_name: "Tan", birth_date: "1959-01-09", sex: "Male", type: "Member", barangay: "Zone 1", registration_date: d(20), empanelled: "yes", empanelment_date: d(19), ...base },
    { id: "R-0006", philhealth_pin: "", last_name: "Villanueva", first_name: "Ana", middle_name: "Cruz", birth_date: "1984-09-18", sex: "Female", type: "Non-Member", barangay: "Zone 1", registration_date: d(15), empanelled: "no", ...base },
    { id: "R-0007", philhealth_pin: "12-345678901-2", last_name: "Santos", first_name: "Carmen", middle_name: "Lopez", birth_date: "1980-05-10", sex: "Female", type: "Member", barangay: "Zone 2", registration_date: d(2), empanelled: "yes", empanelment_date: d(1), ...base },
    { id: "R-0008", philhealth_pin: "12-345678902-0", last_name: "Mendoza", first_name: "Jose", middle_name: "Ramos", birth_date: "1972-12-03", sex: "Male", type: "Member", barangay: "Matti", registration_date: d(1), empanelled: "yes", empanelment_date: d(1), ...base },
    { id: "R-0009", philhealth_pin: "12-345678903-9", last_name: "Garcia", first_name: "Rosa", middle_name: "Tan", birth_date: "1995-02-14", sex: "Female", type: "Dependent", barangay: "San Jose", registration_date: d(0), empanelled: "no", ...base },
  ];
}

export async function GET() {
  return Response.json({ mode: process.env.REGISTRY_URL ? "live" : "demo", name: process.env.REGISTRY_NAME || "Partner registration site" });
}

export async function POST() {
  let raw;
  if (!process.env.REGISTRY_URL) raw = demo();
  else {
    if (!/^https?:\/\//i.test(process.env.REGISTRY_URL)) return Response.json({ error: "REGISTRY_URL must start with http:// or https://" }, { status: 500 });
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
      const r = await fetch(process.env.REGISTRY_URL, { headers: { Accept: "application/json", ...(process.env.REGISTRY_API_KEY ? { Authorization: `Bearer ${process.env.REGISTRY_API_KEY}` } : {}) }, signal: ctrl.signal, cache: "no-store" });
      clearTimeout(t);
      if (!r.ok) return Response.json({ error: `Registration site answered ${r.status}.` }, { status: 502 });
      const j = await r.json(); raw = Array.isArray(j) ? j : j.clients || j.data || j.results || [];
    } catch (e) { return Response.json({ error: "Could not reach the registration site: " + String(e && e.message || e).slice(0, 160) }, { status: 502 }); }
  }
  const clients = raw.slice(0, 5000).map(normalize).filter((c) => c.last && c.first && c.dob);
  return Response.json({ mode: process.env.REGISTRY_URL ? "live" : "demo", name: process.env.REGISTRY_NAME || "Partner registration site", syncedAt: new Date().toISOString(), skipped: raw.length - clients.length, clients });
}
