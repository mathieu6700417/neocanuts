// `node scripts/texte.js <url>` : affiche le texte brut d'une page, tel que `verify` le lit.
// Sert à repérer un passage et à le copier sans le retaper.
import { execFileSync } from "node:child_process";
import { texteDe } from "./verify.js";

const html = execFileSync("curl", ["-sSL", "--compressed", "--max-time", "60", "-A", "Mozilla/5.0 (compatible; neocanuts-verify/1.0)", process.argv[2]], {
  encoding: "utf8",
  maxBuffer: 256 * 1024 * 1024,
});
console.log(texteDe(html).replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n"));
