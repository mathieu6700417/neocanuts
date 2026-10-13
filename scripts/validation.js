// Validation des entrées de src/auteurs : utilisée par le build Eleventy
// et par `npm run check`. Chaque erreur nomme le fichier et le champ fautif.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DOSSIER_AUTEURS = path.join(racine, "src", "auteurs");

const lireJson = (nom) =>
  JSON.parse(fs.readFileSync(path.join(racine, "src", "_data", nom), "utf8"));

export const epoques = lireJson("epoques.json");
export const themes = lireJson("themes.json");

const OBLIGATOIRES = [
  "nom", "slug", "annee", "date_affichee", "epoque", "oeuvre",
  "langue", "theme", "source_url", "verifie", "notice",
];
const URLS = ["source_url", "original_url", "texte_integral_url"];
const IDS_RESERVES = ["sommaire", "frise", "absents", "colophon"];
const MOTS_MIN = 60;
const MOTS_MAX = 200;

const vide = (v) => v === undefined || v === null || String(v).trim() === "";
const estUrl = (v) => /^https?:\/\/\S+$/.test(String(v));

export function dateIso(v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : null;
}

export function compterMots(markdown) {
  const texte = markdown.replace(/[\\*_>#]/g, " ").replace(/[«»“”"(),.;:!?…—–\[\]]/g, " ");
  return texte.split(/\s+/).filter(Boolean).length;
}

function validerEntree(fichier, data, corps) {
  const erreurs = [];
  const fautif = (champ, message) => erreurs.push(`${fichier} : champ « ${champ} » ${message}`);

  for (const champ of OBLIGATOIRES) if (vide(data[champ])) fautif(champ, "manquant");
  if (vide(corps)) fautif("corps", "vide : l'extrait français manque");

  if (!vide(data.slug)) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug)) fautif("slug", "invalide (minuscules, chiffres, tirets)");
    if (`${data.slug}.md` !== fichier) fautif("slug", "différent du nom du fichier");
    if (IDS_RESERVES.includes(data.slug) || String(data.slug).startsWith("epoque-")) fautif("slug", "réservé à une ancre de la page");
  }
  for (const champ of ["annee", "naissance", "mort"]) {
    if (!vide(data[champ]) && !Number.isInteger(data[champ])) fautif(champ, "non entier");
  }
  const epoque = epoques.find((e) => e.cle === String(data.epoque));
  if (!vide(data.epoque) && !epoque) fautif("epoque", `hors liste (${epoques.map((e) => e.cle).join(", ")})`);
  if (epoque && Number.isInteger(data.annee)) {
    const avant = epoque.debut !== null && data.annee < epoque.debut;
    const apres = epoque.fin !== null && data.annee > epoque.fin;
    if (avant || apres) fautif("epoque", `incohérent avec l'année ${data.annee}`);
  }
  if (!vide(data.theme) && !(data.theme in themes)) fautif("theme", `hors liste (${Object.keys(themes).join(", ")})`);
  for (const champ of URLS) {
    if (!vide(data[champ]) && !estUrl(data[champ])) fautif(champ, "n'est pas une URL http(s)");
  }
  if (!vide(data.verifie) && !dateIso(data.verifie)) fautif("verifie", "n'est pas une date AAAA-MM-JJ");
  if (!vide(data.langue) && data.langue !== "fr") {
    for (const champ of ["original", "original_url", "traduction"]) {
      if (vide(data[champ])) fautif(champ, `obligatoire quand la langue est « ${data.langue} »`);
    }
  }
  if (!vide(corps)) {
    if (/\n\s*\n/.test(corps.trim())) fautif("corps", "en plusieurs paragraphes (un seul attendu)");
    const mots = compterMots(corps);
    if (mots < MOTS_MIN || mots > MOTS_MAX) fautif("corps", `de ${mots} mots (attendu : ${MOTS_MIN} à ${MOTS_MAX})`);
  }
  return erreurs;
}

// Lit et valide toutes les entrées ; renvoie les entrées triées par année et les erreurs.
export function chargerEntrees(dossier = DOSSIER_AUTEURS) {
  const erreurs = [];
  const entrees = [];
  const slugs = new Map();
  const fichiers = fs.readdirSync(dossier).filter((f) => f.endsWith(".md")).sort();
  for (const fichier of fichiers) {
    let lu;
    try {
      lu = matter(fs.readFileSync(path.join(dossier, fichier), "utf8"));
    } catch (e) {
      erreurs.push(`${fichier} : en-tête YAML illisible (${e.reason || e.message})`);
      continue;
    }
    erreurs.push(...validerEntree(fichier, lu.data, lu.content));
    if (slugs.has(lu.data.slug)) erreurs.push(`${fichier} : champ « slug » en double avec ${slugs.get(lu.data.slug)}`);
    else if (!vide(lu.data.slug)) slugs.set(lu.data.slug, fichier);
    entrees.push({ fichier, data: lu.data, corps: lu.content.trim() });
  }
  entrees.sort((a, b) => a.data.annee - b.data.annee || a.fichier.localeCompare(b.fichier));
  return { entrees, erreurs };
}
