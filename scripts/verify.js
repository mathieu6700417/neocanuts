// `npm run verify [slug…]` : vérification mot à mot des extraits.
// Télécharge `source_url` et `original_url` de chaque entrée et contrôle que
// l'extrait français (sauf traduction Néocanuts) et l'original s'y trouvent,
// lettre pour lettre, aux espaces et variantes typographiques près.
// Les passages séparés par […] doivent apparaître dans l'ordre.
import { execFileSync } from "node:child_process";
import { chargerEntrees } from "./validation.js";

const AGENT = "Mozilla/5.0 (compatible; neocanuts-verify/1.0)";
const pages = new Map();

const ENTITES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»", hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", oelig: "œ", OElig: "Œ", shy: "" };

function telecharger(url) {
  if (!pages.has(url)) {
    const html = execFileSync("curl", ["-sSL", "--compressed", "--max-time", "60", "-A", AGENT, url], {
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
    });
    pages.set(url, texteDe(html));
  }
  return pages.get(url);
}

// HTML → texte brut : sans scripts, styles, appels de note ni numéros de page.
export function texteDe(html) {
  return html
    .replace(/<(script|style|sup|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<span[^>]*class="[^"]*(pagenum|ws-noexport|mw-editsection|reference)[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-zA-Z]+);/g, (m, nom) => ENTITES[nom] ?? m);
}

// Neutralise ce qui n'est pas un mot : espaces, forme des guillemets, apostrophes et tirets.
export function normaliser(texte) {
  return texte
    .normalize("NFKC")
    .replace(/[­​-‍﻿]/g, "")
    .replace(/[’‘ʼ′`]/g, "'")
    .replace(/[«»“”„‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/…/g, "...")
    .replace(/[\s   ]+/g, "");
}

const sansMarkdown = (md) => md.replace(/\\\n/g, "\n").replace(/\\([*_\[\]])/g, "$1").replace(/(^|[^\\])[*_]/g, "$1");

// Renvoie le premier passage introuvable, ou null si tout l'extrait est dans la page.
export function chercher(extrait, page) {
  const cible = normaliser(page);
  let position = 0;
  for (const passage of extrait.split(/\[(?:…|\.\.\.)\]/)) {
    const morceau = normaliser(passage);
    if (!morceau) continue;
    const trouve = cible.indexOf(morceau, position);
    if (trouve === -1) return passage.trim();
    position = trouve + morceau.length;
  }
  return null;
}

// Plus long début du passage présent dans la page, pour situer l'écart.
function ecart(passage, page) {
  const cible = normaliser(page);
  const morceau = normaliser(passage);
  let n = morceau.length;
  while (n > 0 && !cible.includes(morceau.slice(0, n))) n--;
  return `concorde sur ${n} caractères, puis diverge à « ${morceau.slice(Math.max(0, n - 30), n)}▮${morceau.slice(n, n + 40)} »`;
}

if (process.argv[1] && process.argv[1].endsWith("verify.js")) {
  const voulus = process.argv.slice(2);
  const { entrees } = chargerEntrees();
  let echecs = 0;
  for (const { data, corps } of entrees) {
    if (voulus.length && !voulus.includes(data.slug)) continue;
    const controles = [];
    const maison = /traduction Néocanuts/i.test(data.traduction || "");
    if (!maison) controles.push(["français", sansMarkdown(corps), data.source_url]);
    if (data.original) controles.push(["original", data.original, data.original_url || data.source_url]);
    for (const [quoi, texte, url] of controles) {
      let manque;
      try {
        const page = telecharger(url);
        manque = chercher(texte, page);
        if (manque) manque = `${ecart(manque, page)}`;
      } catch (e) {
        manque = `téléchargement impossible (${e.message.split("\n")[0]})`;
      }
      if (manque) echecs++;
      console.log(`${manque ? "ÉCHEC" : "ok   "} ${data.slug} · ${quoi} · ${url}${manque ? `\n      ${manque}` : ""}`);
    }
  }
  if (echecs) {
    console.error(`\n${echecs} contrôle(s) en échec.`);
    process.exit(1);
  }
}
