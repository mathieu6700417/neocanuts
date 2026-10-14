// Chapitres des pages longues (src/chapitres) : chargement, validation et
// repérage du passage cité. Utilisé par le build, `check` et `verify`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { dateIso } from "./validation.js";
import { normaliser } from "./verify.js";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DOSSIER_CHAPITRES = path.join(racine, "src", "chapitres");
const FICHIER_MANQUANTES = path.join(racine, "src", "_data", "pages_manquantes.json");

const vide = (v) => v === undefined || v === null || String(v).trim() === "";
const estUrl = (v) => /^https?:\/\/\S+$/.test(String(v));

// Bornes d'un passage repéré, remplacées au rendu par <mark> et </mark>.
export const DEBUT = "";
export const FIN = "";

// Lit src/chapitres : un fichier <slug>.md, et <slug>.original.md quand l'œuvre n'est pas en français.
export function chargerChapitres(dossier = DOSSIER_CHAPITRES) {
  const chapitres = new Map();
  const erreurs = [];
  if (!fs.existsSync(dossier)) return { chapitres, erreurs };
  const fichiers = fs.readdirSync(dossier).filter((f) => f.endsWith(".md")).sort();
  for (const fichier of fichiers.filter((f) => !f.endsWith(".original.md"))) {
    const slug = fichier.slice(0, -3);
    let lu;
    try {
      lu = matter(fs.readFileSync(path.join(dossier, fichier), "utf8"));
    } catch (e) {
      erreurs.push(`chapitres/${fichier} : en-tête YAML illisible (${e.reason || e.message})`);
      continue;
    }
    const fichierOriginal = path.join(dossier, `${slug}.original.md`);
    const original = fs.existsSync(fichierOriginal) ? fs.readFileSync(fichierOriginal, "utf8").normalize("NFC").trim() : null;
    chapitres.set(slug, { fichier, data: lu.data, corps: lu.content.normalize("NFC").trim(), original });
  }
  for (const fichier of fichiers.filter((f) => f.endsWith(".original.md"))) {
    if (!chapitres.has(fichier.slice(0, -".original.md".length))) erreurs.push(`chapitres/${fichier} : aucun chapitre français correspondant`);
  }
  return { chapitres, erreurs };
}

export function chargerManquantes() {
  return fs.existsSync(FICHIER_MANQUANTES) ? JSON.parse(fs.readFileSync(FICHIER_MANQUANTES, "utf8")) : [];
}

// Forme normalisée d'un texte Markdown, avec pour chaque caractère retenu sa position
// dans la source. Les marques Markdown (\ * _) sont ignorées ; `sansTirets` tolère les césures.
function formeIndexee(texte, sansTirets = false) {
  let forme = "";
  const positions = [];
  let i = 0;
  for (const car of texte) {
    if (!/[\\*_]/.test(car)) {
      let n = normaliser(car);
      if (sansTirets) n = n.replace(/-/g, "");
      for (const c of n) {
        forme += c;
        positions.push(i);
      }
    }
    i += car.length;
  }
  return { forme, positions };
}

// Encadre chaque passage de l'extrait (séparés par […]) dans le chapitre, par DEBUT et FIN,
// en refermant et rouvrant la marque à chaque changement de paragraphe.
// Renvoie le Markdown marqué, ou null si un passage est introuvable.
export function marquerPassage(chapitre, extrait) {
  for (const sansTirets of [false, true]) {
    const cible = formeIndexee(chapitre, sansTirets);
    const plages = [];
    let position = 0;
    let trouve = true;
    for (const passage of extrait.normalize("NFC").split(/\[(?:…|\.\.\.)\]/)) {
      const morceau = formeIndexee(passage, sansTirets).forme;
      if (!morceau) continue;
      const k = cible.forme.indexOf(morceau, position);
      if (k === -1) {
        trouve = false;
        break;
      }
      position = k + morceau.length;
      const fin = cible.positions[position - 1];
      plages.push([cible.positions[k], fin + String.fromCodePoint(chapitre.codePointAt(fin)).length]);
    }
    if (!trouve || !plages.length) continue;
    let sortie = "";
    let curseur = 0;
    for (const [debut, fin] of plages) {
      const dedans = chapitre.slice(debut, fin).replace(/\n[ \t]*\n\s*/g, (saut) => `${FIN}${saut}${DEBUT}`);
      sortie += chapitre.slice(curseur, debut) + DEBUT + dedans + FIN;
      curseur = fin;
    }
    return sortie + chapitre.slice(curseur);
  }
  return null;
}

// Remplace DEBUT et FIN dans le HTML rendu par <mark> et </mark>. La marque ne couvre que du
// texte : elle se referme et se rouvre autour de chaque balise, pour rester bien imbriquée.
// La première porte l'ancre.
export function baliserMarques(html, ancre) {
  let premier = true;
  return html
    .replace(new RegExp(`${DEBUT}([\\s\\S]*?)${FIN}`, "g"), (_, dedans) => DEBUT + dedans.replace(/<[^>]+>/g, (balise) => FIN + balise + DEBUT) + FIN)
    .replace(new RegExp(`${DEBUT}(\\s*)${FIN}`, "g"), "$1")
    .replaceAll(DEBUT, () => (premier ? ((premier = false), `<mark id="${ancre}">`) : "<mark>"))
    .replaceAll(FIN, "</mark>");
}

// Contrôle les chapitres contre les entrées : en-tête, original, passage cité,
// et exclusivité avec la liste des pages manquantes.
// `complet` exige en plus que chaque entrée ait un chapitre ou figure dans la liste.
export function validerChapitres(entrees, { complet = false } = {}) {
  const { chapitres, erreurs } = chargerChapitres();
  const manquantes = chargerManquantes();
  const parSlug = new Map(entrees.map((e) => [e.data.slug, e]));
  const aTraiter = [];

  for (const { slug, raison } of manquantes) {
    if (!parSlug.has(slug)) erreurs.push(`pages_manquantes.json : « ${slug} » ne correspond à aucune entrée`);
    if (vide(raison)) erreurs.push(`pages_manquantes.json : « ${slug} » sans raison`);
    if (chapitres.has(slug)) erreurs.push(`pages_manquantes.json : « ${slug} » a pourtant un chapitre`);
  }
  for (const [slug, { fichier, data, corps, original }] of chapitres) {
    const fautif = (champ, message) => erreurs.push(`chapitres/${fichier} : champ « ${champ} » ${message}`);
    const entree = parSlug.get(slug);
    if (!entree) {
      erreurs.push(`chapitres/${fichier} : aucune entrée « ${slug} »`);
      continue;
    }
    for (const champ of ["chapitre", "source_url", "verifie"]) if (vide(data[champ])) fautif(champ, "manquant");
    for (const champ of ["source_url", "original_url"]) if (!vide(data[champ]) && !estUrl(data[champ])) fautif(champ, "n'est pas une URL http(s)");
    if (!vide(data.verifie) && !dateIso(data.verifie)) fautif("verifie", "n'est pas une date AAAA-MM-JJ");
    if (vide(corps)) fautif("corps", "vide : le chapitre français manque");
    else if (!marquerPassage(corps, entree.corps)) fautif("corps", "ne contient pas le paragraphe de la frise");
    if (entree.data.langue !== "fr") {
      for (const champ of ["original_url", "traduction"]) if (vide(data[champ])) fautif(champ, `obligatoire quand la langue est « ${entree.data.langue} »`);
      if (!original) erreurs.push(`chapitres/${slug}.original.md : manquant (langue « ${entree.data.langue} »)`);
      else if (!marquerPassage(original, entree.data.original)) erreurs.push(`chapitres/${slug}.original.md : ne contient pas l'original de la frise`);
    }
  }
  for (const slug of parSlug.keys()) {
    if (!chapitres.has(slug) && !manquantes.some((m) => m.slug === slug)) aTraiter.push(slug);
  }
  if (complet) for (const slug of aTraiter) erreurs.push(`${slug} : ni chapitre ni place dans pages_manquantes.json`);
  return { chapitres, manquantes, aTraiter, erreurs };
}
