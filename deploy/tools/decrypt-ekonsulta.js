// Decrypts an eKonsulta encrypted XML (JSON envelope: iv, hash, doc) with the clinic's cipher key,
// then writes (1) the readable XML next to the original (keep it private!) and
// (2) a STRUCTURE-ONLY summary with all values masked, safe to share.
// Usage: node decrypt-ekonsulta.js "C:\path\file.xml"   (asks for the cipher key; nothing is sent anywhere)
const fs = require("fs"), crypto = require("crypto"), path = require("path"), readline = require("readline");
const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.log('Usage: node decrypt-ekonsulta.js "C:\\path\\to\\file.xml"'); process.exit(1); }
const env = JSON.parse(fs.readFileSync(file, "utf8"));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.stdoutMuted = false; rl._writeToOutput = (s) => { if (!rl.stdoutMuted) rl.output.write(s); else rl.output.write("*"); };
rl.question("Enter your eKonsulta cipher key (typing is hidden): ", (key) => {
  rl.close(); console.log("");
  const iv = Buffer.from(env.iv, "base64"), data = Buffer.from(env.doc, "base64");
  const tries = [
    ["SHA-256 of key, AES-256-CBC", crypto.createHash("sha256").update(key, "utf8").digest(), "aes-256-cbc"],
    ["raw key, AES-256-CBC", Buffer.from(key.padEnd(32, "\0").slice(0, 32), "utf8"), "aes-256-cbc"],
    ["raw key, AES-128-CBC", Buffer.from(key.padEnd(16, "\0").slice(0, 16), "utf8"), "aes-128-cbc"],
    ["MD5 of key, AES-128-CBC", crypto.createHash("md5").update(key, "utf8").digest(), "aes-128-cbc"],
  ];
  let xml = null, how = "";
  for (const [label, k, alg] of tries) {
    try { const d = crypto.createDecipheriv(alg, k, iv); const out = Buffer.concat([d.update(data), d.final()]).toString("utf8");
      if (out.includes("<")) { xml = out; how = label; break; } } catch (e) {}
  }
  if (!xml) { console.log("Could not decrypt. Check the cipher key (it is case-sensitive)."); process.exit(2); }
  const h = crypto.createHash("sha256").update(xml, "utf8").digest("hex");
  const base = file.replace(/\.xml$/i, "");
  fs.writeFileSync(base + "_DECRYPTED_PRIVATE.xml", xml);
  // structure summary: every tag path, attribute names, masked sample value, counts
  const seen = new Map(), cnt = new Map(), stack = [];
  const mask = (v) => v.replace(/[0-9]/g, "9").replace(/[A-Za-z\u00C0-\u024F]/g, "a").slice(0, 16);
  const re = /<(\/?)([A-Za-z_][\w.\-]*)([^>]*?)(\/?)>/g; let m;
  while ((m = re.exec(xml))) {
    const [, close, tag, attrs, self] = m;
    if (tag === "xml") continue;
    if (close) { stack.pop(); continue; }
    stack.push(tag); const p = stack.join("/"); cnt.set(p, (cnt.get(p) || 0) + 1);
    const d = seen.get(p) || new Map(); seen.set(p, d);
    const ar = /([\w:.\-]+)\s*=\s*"([^"]*)"/g; let a;
    while ((a = ar.exec(attrs))) if (!d.get(a[1])) d.set(a[1], mask(a[2]));
    if (self) stack.pop();
  }
  const lines = [`eKonsulta XML structure (values masked: 9=digit, a=letter)`, `decryption: ${how}; hash check: ${h === env.hash ? "MATCH" : h.toUpperCase() === env.hash.toUpperCase() ? "MATCH (case)" : "no match (" + env.hash.slice(0, 8) + "…)"}`, `root starts: ${mask(xml.slice(0, 60))}`, ""];
  for (const [p, d] of seen) lines.push(`${p}  x${cnt.get(p)}\n    ` + [...d].map(([k, v]) => `${k}=${v}`).join(", "));
  fs.writeFileSync(base + "_STRUCTURE_SAFE_TO_SHARE.txt", lines.join("\n"));
  console.log("Done.\n  Readable XML (PRIVATE, do not share): " + base + "_DECRYPTED_PRIVATE.xml\n  Structure summary (safe to send to Claude): " + base + "_STRUCTURE_SAFE_TO_SHARE.txt");
});
