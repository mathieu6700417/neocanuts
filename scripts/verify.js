// `npm run verify [slug…]` : vérification mot à mot des extraits.
// Télécharge `source_url` et `original_url` de chaque entrée et contrôle que
// l'extrait français (sauf traduction Néocanuts) et l'original s'y trouvent,
// lettre pour lettre, aux espaces et variantes typographiques près.
// Les passages séparés par […] doivent apparaître dans l'ordre.
import { execFileSync } from "node:child_process";
import { chargerEntrees } from "./validation.js";
import { chargerChapitres } from "./chapitres.js";
import { chargerNotes } from "./notes.js";

const AGENT = "Mozilla/5.0 (compatible; neocanuts-verify/1.0)";
const pages = new Map();

const ENTITES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»", hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", oelig: "œ", OElig: "Œ", shy: "" };

// Télécharge une page et la décode : UTF-8 si possible, sinon Windows-1252 (vieux sites en latin-1).
export function lirePage(url) {
  const octets = execFileSync("curl", ["-sSL", "--compressed", "--max-time", "60", "-A", AGENT, url], {
    maxBuffer: 256 * 1024 * 1024,
  });
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(octets);
  } catch {
    return new TextDecoder("windows-1252").decode(octets);
  }
}

function telecharger(url) {
  if (!pages.has(url)) pages.set(url, texteDe(lirePage(url)));
  return pages.get(url);
}

const ACCENTS = { acute: "\u0301", grave: "\u0300", circ: "\u0302", uml: "\u0308", cedil: "\u0327", tilde: "\u0303", ring: "\u030a" };
const LIGATURES = { aelig: "æ", AElig: "Æ", szlig: "ß", oslash: "ø", Oslash: "Ø" };

function entite(tout, nom) {
  if (nom in ENTITES) return ENTITES[nom];
  if (nom in LIGATURES) return LIGATURES[nom];
  const accent = /^([a-zA-Z])(acute|grave|circ|uml|cedil|tilde|ring)$/.exec(nom);
  return accent ? (accent[1] + ACCENTS[accent[2]]).normalize("NFC") : tout;
}

// Un exposant qui n'est qu'un appel de note : « 1 », « (2) », « [a] », « * ».
const APPEL_DE_NOTE = /^\s*(\[[^\]]{1,5}\]|\(?\d+\)?|[*†‡])\s*$/;

// HTML → texte brut : sans scripts, styles, appels de note, numéros de page, de vers ni de verset.
export function texteDe(html) {
  return html
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<sup\b([^>]*)>([\s\S]*?)<\/sup>/gi, (tout, attributs, contenu) =>
      /reference|footnote|note|verset-num/i.test(attributs) || APPEL_DE_NOTE.test(contenu.replace(/<[^>]+>/g, "")) ? "" : contenu,
    )
    .replace(/<span[^>]*class="[^"]*(pagenum|ws-noexport|mw-editsection|reference|zeilennummer|linenum|line-number)[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "")
    // Wikisource grec : numéros de vers (id="v45") et repères Stephanus (id="p322b").
    .replace(/<span[^>]*\bid="(v\d+|p\d+[a-e]?)"[^>]*>[\s\S]*?<\/span>/gi, "")
    // Mechon Mamre : numéros de versets en lettres hébraïques, en gras (« כב », ou « ב,ח » sur la page d'un livre entier).
    .replace(/<b>([\u05d0-\u05ea]{1,3},)?[\u05d0-\u05ea]{1,3}<\/b>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-zA-Z]+);/g, entite);
}

// Neutralise ce qui n'est pas un mot : espaces, forme des guillemets, apostrophes et tirets (maqaf hébreu compris).
export function normaliser(texte) {
  return texte
    .normalize("NFKC")
    .replace(/[­​-‍﻿]/g, "")
    .replace(/[’‘ʼ′`]/g, "'")
    .replace(/[«»“”„‟]/g, '"')
    .replace(/[‐‑‒–—―\u05be]/g, "-")
    .replace(/…/g, "...")
    .replace(/[\s   ]+/g, "");
}

const sansMarkdown = (md) => md.replace(/\\\n/g, "\n").replace(/\\([*_\[\]])/g, "$1").replace(/(^|[^\\])[*_]/g, "$1");

// Renvoie le premier passage introuvable, ou null si tout l'extrait est dans la page.
// `sansTirets` ignore tirets et traits d'union : tolère les césures de fin de ligne d'un OCR.
export function chercher(extrait, page, sansTirets = false) {
  const forme = (t) => (sansTirets ? normaliser(t).replace(/-/g, "") : normaliser(t));
  const cible = forme(page);
  let position = 0;
  for (const passage of extrait.split(/\[(?:…|\.\.\.)\]/)) {
    const morceau = forme(passage);
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
  // La présence d'un début est monotone : recherche dichotomique, utile pour un chapitre entier.
  let n = 0;
  let haut = morceau.length;
  while (n < haut) {
    const milieu = Math.ceil((n + haut) / 2);
    if (cible.includes(morceau.slice(0, milieu))) n = milieu;
    else haut = milieu - 1;
  }
  return `concorde sur ${n} caractères, puis diverge à « ${morceau.slice(Math.max(0, n - 30), n)}▮${morceau.slice(n, n + 40)} »`;
}

if (process.argv[1] && process.argv[1].endsWith("verify.js")) {
  const voulus = process.argv.slice(2);
  const { entrees } = chargerEntrees();
  const { chapitres } = chargerChapitres();
  const { notes } = chargerNotes();
  let echecs = 0;
  for (const { data, corps } of entrees) {
    if (voulus.length && !voulus.includes(data.slug)) continue;
    const controles = [];
    const maison = /traduction Néocanuts/i.test(data.traduction || "");
    if (!maison) controles.push(["français", sansMarkdown(corps), data.source_url]);
    if (data.original) controles.push(["original", data.original, data.original_url || data.source_url]);
    const chapitre = chapitres.get(data.slug);
    if (chapitre) {
      if (!/traduction Néocanuts/i.test(chapitre.data.traduction || "")) controles.push(["chapitre", sansMarkdown(chapitre.corps), chapitre.data.source_url]);
      if (chapitre.original) controles.push(["chapitre original", sansMarkdown(chapitre.original), chapitre.data.original_url || chapitre.data.source_url]);
    }
    // Citations des notes de lecture : la version en cours et la version publiée.
    for (const note of notes.get(data.slug) || []) {
      const citations = new Map([...(note.publiee?.citations || []), ...(note.citations || [])].map((c) => [c.texte + c.source_url, c]));
      for (const c of citations.values()) controles.push([`note ${note.id}`, c.texte, c.source_url]);
    }
    for (const [quoi, texte, url] of controles) {
      let manque;
      let note = "";
      try {
        const page = telecharger(url);
        manque = chercher(texte, page);
        if (manque && !chercher(texte, page, true)) {
          manque = null;
          note = " (aux césures et tirets près)";
        }
        if (manque) manque = ecart(manque, page);
      } catch (e) {
        manque = `téléchargement impossible (${e.message.split("\n")[0]})`;
      }
      if (manque) echecs++;
      console.log(`${manque ? "ÉCHEC" : "ok   "} ${data.slug} · ${quoi}${note} · ${url}${manque ? `\n      ${manque}` : ""}`);
    }
  }
  if (echecs) {
    console.error(`\n${echecs} contrôle(s) en échec.`);
    process.exit(1);
  }
}
