// `npm run links` : vérifie que les URL externes des entrées répondent. Lancé à la main.
import { execFileSync } from "node:child_process";
import { chargerEntrees } from "./validation.js";

const AGENT = "Mozilla/5.0 (compatible; neocanuts-links/1.0)";
const { entrees } = chargerEntrees();
const urls = new Map();
for (const { data } of entrees) {
  for (const champ of ["source_url", "original_url", "texte_integral_url"]) {
    if (data[champ]) urls.set(data[champ], [...(urls.get(data[champ]) || []), `${data.slug}.${champ}`]);
  }
}

let echecs = 0;
for (const [url, origines] of urls) {
  let code;
  try {
    code = execFileSync("curl", ["-sSL", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "40", "-A", AGENT, url], { encoding: "utf8" });
  } catch {
    code = "000";
  }
  const ok = code.startsWith("2");
  if (!ok) echecs++;
  console.log(`${ok ? "ok   " : "ÉCHEC"} ${code} ${url}${ok ? "" : ` (${origines.join(", ")})`}`);
}
console.log(`\n${urls.size} URL, ${echecs} en échec.`);
process.exit(echecs ? 1 : 0);
