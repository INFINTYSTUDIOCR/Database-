const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..");
const olds = [
  "../Infinity_Diagnostic_Tool%20(7).html",
  "../Infinity_Diagnostic_Tool (7).html",
  "Infinity_Diagnostic_Tool%20(7).html",
  "Infinity_Diagnostic_Tool (7).html",
];
const neu = "diagnostico.html";

let n = 0;
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith(".html")) continue;
  const p = path.join(dir, f);
  let t = fs.readFileSync(p, "utf8");
  const before = t;
  for (const o of olds) t = t.split(o).join(neu);
  if (t !== before) {
    fs.writeFileSync(p, t);
    n++;
    console.log("patched", f);
  }
}

for (const script of ["generate-commercial-pages.js", "generate-tool-landings.js", "generate-site-pages.js"]) {
  const p = path.join(__dirname, script);
  if (!fs.existsSync(p)) continue;
  let t = fs.readFileSync(p, "utf8");
  const before = t;
  for (const o of olds) t = t.split(o).join(neu);
  t = t.replace(/const DIAG = ['"][^'"]+['"]/, "const DIAG = 'diagnostico.html'");
  if (t !== before) {
    fs.writeFileSync(p, t);
    console.log("patched", script);
  }
}

console.log("done", n, "html files");
