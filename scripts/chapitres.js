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

// Repères posés dans le Markdown avant le rendu, remplacés ensuite par du HTML :
// passage cité (<mark>), passage annoté (<span class="annote">), appel de note n° N.
export const DEBUT = "\ue000";
export const FIN = "\ue001";
export const ANNOTE = "\ue002";
export const FIN_ANNOTE = "\ue003";
export const appel = (n) => `\ue004${n}\ue005`;
export const corpsNote = (n) => `\ue006${n}\ue007`;

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

// Plages [début, fin[ du chapitre où se trouvent les passages de l'extrait (séparés par […]),
// dans l'ordre, ou null si l'un d'eux manque. Tolère les césures si le texte exact échoue.
export function trouverPlages(chapitre, extrait) {
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
    if (trouve && plages.length) return plages;
  }
  return null;
}

// Nombre d'occurrences d'un passage (sans coupe) dans le chapitre, après normalisation.
export function compterOccurrences(chapitre, passage) {
  const cible = formeIndexee(chapitre).forme;
  const morceau = formeIndexee(passage.normalize("NFC")).forme;
  if (!morceau) return 0;
  let n = 0;
  for (let k = cible.indexOf(morceau); k !== -1; k = cible.indexOf(morceau, k + 1)) n++;
  return n;
}

// Insère des repères autour de plages du Markdown : `avant` puis `ouvre` au début, `ferme`
// puis `apres` à la fin, et `ferme` / `ouvre` de part et d'autre de chaque changement de paragraphe.
export function inserer(chapitre, poses) {
  const points = [];
  for (const { debut, fin, ouvre, ferme, avant = "", apres = "" } of poses) {
    points.push({ pos: debut, rang: 2, texte: avant + ouvre });
    for (const saut of chapitre.slice(debut, fin).matchAll(/\n[ \t]*\n\s*/g)) {
      points.push({ pos: debut + saut.index, rang: 0, texte: ferme });
      points.push({ pos: debut + saut.index + saut[0].length, rang: 2, texte: ouvre });
    }
    points.push({ pos: fin, rang: 0, texte: ferme + apres });
  }
  points.sort((x, y) => x.pos - y.pos || x.rang - y.rang);
  let sortie = "";
  let curseur = 0;
  for (const { pos, texte } of points) {
    sortie += chapitre.slice(curseur, pos) + texte;
    curseur = pos;
  }
  return sortie + chapitre.slice(curseur);
}

// Encadre l'extrait de la frise par DEBUT et FIN ; null s'il est introuvable.
export function marquerPassage(chapitre, extrait) {
  const plages = trouverPlages(chapitre, extrait);
  return plages && inserer(chapitre, plages.map(([debut, fin]) => ({ debut, fin, ouvre: DEBUT, ferme: FIN })));
}

// Remplace une paire de repères par des balises dans le HTML rendu. Les plages qui se
// chevauchent sont fusionnées ; la balise ne couvre que du texte et se referme et se
// rouvre autour de chaque balise existante, pour rester bien imbriquée.
function baliser(html, ouvre, ferme, ouvrante, fermante) {
  let profondeur = 0;
  let plat = "";
  for (const car of html) {
    if (car === ouvre) {
      if (++profondeur === 1) plat += ouvre;
    } else if (car === ferme) {
      if (--profondeur === 0) plat += ferme;
    } else plat += car;
  }
  let rang = 0;
  return plat
    .replace(new RegExp(`${ouvre}([\\s\\S]*?)${ferme}`, "g"), (_, dedans) => ouvre + dedans.replace(/<[^>]+>/g, (balise) => ferme + balise + ouvre) + ferme)
    .replace(new RegExp(`${ouvre}(\\s*)${ferme}`, "g"), "$1")
    .replaceAll(ouvre, () => ouvrante(rang++))
    .replaceAll(ferme, fermante);
}

// HTML final d'un texte rendu : passages annotés, passage cité (la première marque porte
// `ancre`), puis appels et corps de note, sortis des marques et des soulignés qui les entourent.
export function finaliser(html, { ancre, rendreAppel = () => "", rendreCorps = () => "" }) {
  let sortie = baliser(html, ANNOTE, FIN_ANNOTE, () => '<span class="annote">', "</span>");
  sortie = baliser(sortie, DEBUT, FIN, (i) => (i === 0 ? `<mark id="${ancre}">` : "<mark>"), "</mark>");
  const pile = [];
  sortie = sortie.replace(/<mark\b[^>]*>|<\/mark>|<span class="annote">|<\/span>|([\ue004\ue006])(\d+)[\ue005\ue007]/g, (jeton, genre, n) => {
    if (n === undefined) {
      if (jeton.startsWith("</")) pile.pop();
      else pile.push(jeton.startsWith("<mark") ? "mark" : "annote");
      return jeton;
    }
    const fermer = [...pile].reverse().map((t) => (t === "mark" ? "</mark>" : "</span>")).join("");
    const rouvrir = pile.map((t) => (t === "mark" ? "<mark>" : '<span class="annote">')).join("");
    return fermer + (genre === "\ue004" ? rendreAppel : rendreCorps)(Number(n)) + rouvrir;
  });
  return sortie.replace(/<mark>(\s*)<\/mark>|<span class="annote">(\s*)<\/span>/g, "$1$2");
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
