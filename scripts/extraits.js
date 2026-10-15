// Changements d'extrait de la frise (src/extraits/<slug>.json) : chargement, validation,
// actions du site local (proposer un passage, demander une précision, abandonner) et report
// dans l'entrée (`node scripts/extraits.js appliquer <slug>`, lancé par /notes).
//
// Une demande par entrée : { passage, commentaire, etat, fil, proposition, date }.
// `passage` est le texte français sélectionné sur la page longue ; `fil` garde l'échange
// ({ auteur, type, texte, date }) ; `proposition` ({ extrait, original, notice, oeuvre }) est ce que
// /notes a préparé (état « prête »). `appliquer` la reporte dans src/auteurs/<slug>.md et
// supprime la demande, sans validation de Mathieu.
import fs from "node:fs";
import matter from "gray-matter";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chargerEntrees, compterMots, dateIso, DOSSIER_AUTEURS, MOTS_MAX, MOTS_MIN } from "./validation.js";
import { chargerChapitres, compterOccurrences, trouverPlages } from "./chapitres.js";
import { lireCorps } from "./notes.js";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DOSSIER_EXTRAITS = path.join(racine, "src", "extraits");

export const ETATS = ["en attente", "prête", "sans extrait"];
const AUTEURS = ["Mathieu", "Claude"];
const TYPES = ["demande", "réponse", "précision"];

const vide = (v) => v === undefined || v === null || String(v).trim() === "";
const aujourdhui = () => new Date().toLocaleDateString("sv-SE");

export function chargerExtraits(dossier = DOSSIER_EXTRAITS) {
  const extraits = new Map();
  const erreurs = [];
  if (!fs.existsSync(dossier)) return { extraits, erreurs };
  for (const fichier of fs.readdirSync(dossier).filter((f) => f.endsWith(".json")).sort()) {
    try {
      extraits.set(fichier.slice(0, -5), JSON.parse(fs.readFileSync(path.join(dossier, fichier), "utf8")));
    } catch (e) {
      erreurs.push(`extraits/${fichier} : JSON illisible (${e.message})`);
    }
  }
  return { extraits, erreurs };
}

function ecrireExtrait(slug, demande) {
  fs.mkdirSync(DOSSIER_EXTRAITS, { recursive: true });
  fs.writeFileSync(path.join(DOSSIER_EXTRAITS, `${slug}.json`), JSON.stringify(demande, null, 2) + "\n");
}

export const compterExtraitsEnAttente = (extraits) => [...extraits.values()].filter((d) => d.etat === "en attente").length;

// Contrôle chaque demande contre son entrée et son chapitre. Une proposition doit pouvoir
// remplacer l'extrait tel quel : un paragraphe, la bonne longueur, présent dans le chapitre,
// et son original présent dans le chapitre original.
export function validerExtraits(entrees, chapitres) {
  const { extraits, erreurs } = chargerExtraits();
  const parSlug = new Map(entrees.map((e) => [e.data.slug, e]));
  for (const [slug, demande] of extraits) {
    const fautif = (champ, message) => erreurs.push(`extraits/${slug}.json : champ « ${champ} » ${message}`);
    const entree = parSlug.get(slug);
    const chapitre = chapitres.get(slug);
    if (!entree || !chapitre) {
      erreurs.push(`extraits/${slug}.json : aucune entrée avec page longue « ${slug} »`);
      continue;
    }
    if (!ETATS.includes(demande.etat)) fautif("etat", `hors liste (${ETATS.join(", ")})`);
    if (vide(demande.passage)) fautif("passage", "manquant");
    else if (!trouverPlages(chapitre.corps, demande.passage)) fautif("passage", "introuvable dans le chapitre");
    if (!Array.isArray(demande.fil) || !demande.fil.length) fautif("fil", "vide");
    else {
      for (const tour of demande.fil) {
        if (!AUTEURS.includes(tour.auteur) || !TYPES.includes(tour.type) || vide(tour.texte)) fautif("fil", "attend { auteur, type, texte, date } valides");
      }
      const dernier = demande.fil.at(-1);
      if (demande.etat === "en attente" && dernier.auteur !== "Mathieu") fautif("etat", "« en attente » alors que Claude a répondu");
      if (demande.etat !== "en attente" && dernier.auteur !== "Claude") fautif("etat", `« ${demande.etat} » alors que la dernière demande attend sa réponse`);
    }
    if (demande.etat !== "prête") continue;
    const p = demande.proposition;
    if (!p || vide(p.extrait)) {
      fautif("proposition.extrait", "manquant");
      continue;
    }
    if (/\n\s*\n/.test(p.extrait.trim())) fautif("proposition.extrait", "en plusieurs paragraphes (un seul attendu)");
    const mots = compterMots(p.extrait);
    if (mots < MOTS_MIN || mots > MOTS_MAX) fautif("proposition.extrait", `de ${mots} mots (attendu : ${MOTS_MIN} à ${MOTS_MAX})`);
    if (!trouverPlages(chapitre.corps, p.extrait)) fautif("proposition.extrait", "introuvable dans le chapitre");
    if (entree.data.original) {
      if (vide(p.original)) fautif("proposition.original", "manquant : l'entrée a un original");
      else if (chapitre.original && !trouverPlages(chapitre.original, p.original)) fautif("proposition.original", "introuvable dans le chapitre original");
    }
    for (const champ of ["notice", "oeuvre"]) {
      if (p[champ] !== undefined && p[champ] !== null && vide(p[champ])) fautif(`proposition.${champ}`, "vide (omettre le champ s'il ne change pas)");
    }
    if (!dateIso(demande.date)) fautif("date", "n'est pas une date AAAA-MM-JJ");
  }
  return { extraits, erreurs };
}

// Remplace la valeur d'une clé de l'en-tête YAML (sa ligne et ses lignes indentées) par `lignes`.
function remplacerCle(entete, cle, lignes) {
  const debut = entete.findIndex((l) => l.startsWith(`${cle}:`));
  if (debut === -1) throw new Error(`champ « ${cle} » absent de l'entrée`);
  let fin = debut + 1;
  while (fin < entete.length && /^\s/.test(entete[fin])) fin++;
  entete.splice(debut, fin - debut, ...lignes);
}

// Bloc YAML replié (`>`), lignes de 76 caractères au plus, comme les notices existantes.
function blocReplie(cle, texte) {
  const lignes = [];
  let ligne = "";
  for (const mot of texte.trim().split(/\s+/)) {
    if (ligne && ligne.length + 1 + mot.length > 76) {
      lignes.push(`  ${ligne}`);
      ligne = mot;
    } else ligne = ligne ? `${ligne} ${mot}` : mot;
  }
  return [`${cle}: >`, ...lignes, `  ${ligne}`];
}

// Reporte une proposition dans src/auteurs/<slug>.md en ne touchant que les champs concernés,
// puis relit le fichier pour s'assurer que chaque valeur est bien celle de la proposition.
function reporter(slug, p, date) {
  const chemin = path.join(DOSSIER_AUTEURS, `${slug}.md`);
  const source = fs.readFileSync(chemin, "utf8");
  const m = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!m) throw new Error(`en-tête YAML introuvable dans auteurs/${slug}.md`);
  const entete = m[1].split("\n");
  if (!vide(p.original)) remplacerCle(entete, "original", ["original: |", ...p.original.trim().split("\n").map((l) => `  ${l}`)]);
  if (!vide(p.notice)) remplacerCle(entete, "notice", blocReplie("notice", p.notice));
  if (!vide(p.oeuvre)) remplacerCle(entete, "oeuvre", [`oeuvre: ${JSON.stringify(p.oeuvre.trim())}`]);
  remplacerCle(entete, "verifie", [`verifie: ${date}`]);
  const resultat = `---\n${entete.join("\n")}\n---\n${p.extrait.trim()}\n`;
  const relu = matter(resultat);
  const pareil = (a, b) => String(a).replace(/\s+/g, " ").trim() === String(b).replace(/\s+/g, " ").trim();
  const ecarts = [
    !pareil(relu.content, p.extrait) && "extrait",
    !vide(p.original) && !pareil(relu.data.original, p.original) && "original",
    !vide(p.notice) && !pareil(relu.data.notice, p.notice) && "notice",
    !vide(p.oeuvre) && !pareil(relu.data.oeuvre, p.oeuvre) && "oeuvre",
  ].filter(Boolean);
  if (ecarts.length) throw new Error(`report impossible dans auteurs/${slug}.md (${ecarts.join(", ")}) : rien n'a été écrit`);
  fs.writeFileSync(chemin, resultat);
}

// --- Actions du site local (servies par le serveur de développement) ---

function agir(action, donnees) {
  const { slug } = donnees;
  if (!/^[a-z0-9-]+$/.test(String(slug))) throw new Error("slug invalide");
  const chemin = path.join(DOSSIER_EXTRAITS, `${slug}.json`);
  const date = aujourdhui();

  if (action === "proposer") {
    const chapitre = chargerChapitres().chapitres.get(slug);
    if (!chapitre) throw new Error(`aucune page longue « ${slug} »`);
    const passage = String(donnees.passage || "").trim();
    const n = compterOccurrences(chapitre.corps, passage);
    if (n === 0) throw new Error("passage introuvable dans le chapitre : sélectionnez du texte sans franchir une note");
    if (n > 1) throw new Error(`ce passage apparaît ${n} fois : sélectionnez-en un peu plus`);
    const commentaire = String(donnees.commentaire || "").trim();
    const texte = commentaire || "Remplacer l'extrait de la frise par ce passage.";
    ecrireExtrait(slug, { passage, commentaire, etat: "en attente", fil: [{ auteur: "Mathieu", type: "demande", texte, date }] });
    return;
  }
  if (!fs.existsSync(chemin)) throw new Error(`aucune demande d'extrait pour « ${slug} »`);
  const demande = JSON.parse(fs.readFileSync(chemin, "utf8"));
  if (action === "precision") {
    if (vide(donnees.question)) throw new Error("la demande est vide");
    demande.fil.push({ auteur: "Mathieu", type: "précision", texte: donnees.question.trim(), date });
    demande.etat = "en attente";
  } else if (action === "abandonner") {
    fs.rmSync(chemin);
    return;
  } else throw new Error(`action inconnue « ${action} »`);
  ecrireExtrait(slug, demande);
}

// Intergiciel du serveur de développement : POST /api/extraits/<action>, JSON en entrée et en sortie.
export async function intergicielExtraits(req, res, next) {
  const route = /^\/(?:[^/]+\/)?api\/extraits\/(proposer|precision|abandonner)$/.exec(req.url.split("?")[0]);
  if (!route) return next();
  const repondre = (code, objet) => {
    res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(objet));
  };
  if (req.method !== "POST") return repondre(405, { erreur: "POST attendu" });
  try {
    agir(route[1], await lireCorps(req));
    repondre(200, { ok: true });
  } catch (e) {
    repondre(400, { erreur: e.message });
  }
}

// Reporte une demande « prête » dans son entrée, après les contrôles de `check`, et la supprime.
export function appliquer(slug, entrees, chapitres) {
  const { extraits, erreurs } = validerExtraits(entrees, chapitres);
  const demande = extraits.get(slug);
  if (!demande) throw new Error(`aucune demande d'extrait pour « ${slug} »`);
  if (demande.etat !== "prête") throw new Error(`demande « ${demande.etat} » : seule une demande « prête » s'applique`);
  const siennes = erreurs.filter((e) => e.startsWith(`extraits/${slug}.json`));
  if (siennes.length) throw new Error(siennes.join("\n"));
  reporter(slug, demande.proposition, aujourdhui());
  fs.rmSync(path.join(DOSSIER_EXTRAITS, `${slug}.json`));
}

if (process.argv[1] && process.argv[1].endsWith("extraits.js")) {
  const [commande, ...slugs] = process.argv.slice(2);
  if (commande !== "appliquer" || !slugs.length) {
    console.error("usage : node scripts/extraits.js appliquer <slug…>");
    process.exit(1);
  }
  const { entrees } = chargerEntrees();
  const { chapitres } = chargerChapitres();
  let echecs = 0;
  for (const slug of slugs) {
    try {
      appliquer(slug, entrees, chapitres);
      console.log(`ok    ${slug} : extrait reporté dans src/auteurs/${slug}.md, demande supprimée`);
    } catch (e) {
      echecs++;
      console.error(`ÉCHEC ${slug} : ${e.message}`);
    }
  }
  process.exit(echecs ? 1 : 0);
}
