// Notes de lecture des pages longues (src/notes/<slug>.json) : chargement, validation,
// pose dans le texte et actions du site local (question, validation, demande de précision).
//
// Une note : { id, texte: "francais" | "original", passage, etat, fil, note, sources,
// citations, date, publiee }. `fil` garde l'échange ({ auteur, type, texte, date }) ;
// `note`, `sources` et `citations` sont la réponse en cours ; `publiee` est la version
// validée par Mathieu, la seule que montre le site public.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compterMots, dateIso } from "./validation.js";
import { ANNOTE, FIN_ANNOTE, appel, chargerChapitres, corpsNote, compterOccurrences, trouverPlages } from "./chapitres.js";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DOSSIER_NOTES = path.join(racine, "src", "notes");

export const ETATS = ["en attente", "à relire", "sans note", "validée"];
const TEXTES = ["francais", "original"];
const AUTEURS = ["Mathieu", "Claude"];
const TYPES = ["question", "réponse", "précision"];
const MOTS_MIN = 30;
const MOTS_MAX = 150;

const vide = (v) => v === undefined || v === null || String(v).trim() === "";
const estUrl = (v) => /^https?:\/\/\S+$/.test(String(v));
const aujourdhui = () => new Date().toLocaleDateString("sv-SE");

export function chargerNotes(dossier = DOSSIER_NOTES) {
  const notes = new Map();
  const erreurs = [];
  if (!fs.existsSync(dossier)) return { notes, erreurs };
  for (const fichier of fs.readdirSync(dossier).filter((f) => f.endsWith(".json")).sort()) {
    try {
      notes.set(fichier.slice(0, -5), JSON.parse(fs.readFileSync(path.join(dossier, fichier), "utf8")));
    } catch (e) {
      erreurs.push(`notes/${fichier} : JSON illisible (${e.message})`);
    }
  }
  return { notes, erreurs };
}

function ecrireNotes(slug, liste) {
  fs.mkdirSync(DOSSIER_NOTES, { recursive: true });
  fs.writeFileSync(path.join(DOSSIER_NOTES, `${slug}.json`), JSON.stringify(liste, null, 2) + "\n");
}

// Texte du chapitre visé par une note : le français ou l'original.
const texteVise = (chapitre, texte) => (texte === "original" ? chapitre.original : chapitre.corps);

// Une note « en attente » attend une réponse de Claude.
export const enAttente = (note) => note.etat === "en attente";
export const compterEnAttente = (notes) => [...notes.values()].flat().filter(enAttente).length;

function validerReponse(fautif, quoi, { texte, sources, citations, date }) {
  if (vide(texte)) return fautif(`${quoi}.texte`, "manquant");
  const mots = compterMots(texte);
  if (mots < MOTS_MIN || mots > MOTS_MAX) fautif(`${quoi}.texte`, `de ${mots} mots (attendu : ${MOTS_MIN} à ${MOTS_MAX})`);
  if (!Array.isArray(sources) || !sources.length) fautif(`${quoi}.sources`, "manquant : au moins une source en ligne");
  else for (const s of sources) if (vide(s.titre) || !estUrl(s.url)) fautif(`${quoi}.sources`, "attend { titre, url } pour chaque source");
  for (const c of citations || []) {
    if (vide(c.texte) || !estUrl(c.source_url)) fautif(`${quoi}.citations`, "attend { texte, source_url } pour chaque citation");
    else if (!texte.includes(c.texte)) fautif(`${quoi}.citations`, `« ${c.texte.slice(0, 30)}… » absente du texte de la note`);
  }
  if (!dateIso(date)) fautif(`${quoi}.date`, "n'est pas une date AAAA-MM-JJ");
}

// Contrôle chaque fichier de notes contre son chapitre.
export function validerNotes(chapitres) {
  const { notes, erreurs } = chargerNotes();
  for (const [slug, liste] of notes) {
    const chapitre = chapitres.get(slug);
    if (!chapitre) {
      erreurs.push(`notes/${slug}.json : aucun chapitre « ${slug} »`);
      continue;
    }
    if (!Array.isArray(liste)) {
      erreurs.push(`notes/${slug}.json : une liste de notes est attendue`);
      continue;
    }
    const ids = new Set();
    for (const note of liste) {
      const fautif = (champ, message) => erreurs.push(`notes/${slug}.json, note ${note.id ?? "?"} : champ « ${champ} » ${message}`);
      if (vide(note.id)) fautif("id", "manquant");
      else if (ids.has(note.id)) fautif("id", "en double");
      ids.add(note.id);
      if (!TEXTES.includes(note.texte)) fautif("texte", `hors liste (${TEXTES.join(", ")})`);
      if (!ETATS.includes(note.etat)) fautif("etat", `hors liste (${ETATS.join(", ")})`);
      if (vide(note.passage)) fautif("passage", "manquant");
      else if (TEXTES.includes(note.texte)) {
        const texte = texteVise(chapitre, note.texte);
        if (!texte || !trouverPlages(texte, note.passage)) fautif("passage", "introuvable dans le chapitre");
      }
      if (!Array.isArray(note.fil) || !note.fil.length) fautif("fil", "vide");
      else {
        for (const tour of note.fil) {
          if (!AUTEURS.includes(tour.auteur) || !TYPES.includes(tour.type) || vide(tour.texte)) fautif("fil", "attend { auteur, type, texte, date } valides");
        }
        const dernier = note.fil.at(-1);
        if (note.etat === "en attente" && dernier.auteur !== "Mathieu") fautif("etat", "« en attente » alors que Claude a répondu");
        if (note.etat !== "en attente" && dernier.auteur !== "Claude") fautif("etat", `« ${note.etat} » alors que la dernière question attend sa réponse`);
      }
      if (["à relire", "validée"].includes(note.etat)) validerReponse(fautif, "note", { texte: note.note, sources: note.sources, citations: note.citations, date: note.date });
      if (note.etat === "validée" && !note.publiee) fautif("publiee", "manquant pour une note validée");
      if (note.publiee) validerReponse(fautif, "publiee", note.publiee);
    }
  }
  return { notes, erreurs };
}

// Pose les notes d'un texte dans son Markdown : corps de la note au début du passage annoté
// (la note de marge s'aligne ainsi sur sa première ligne), appel numéroté à la fin.
// `garder` choisit les notes affichées. Renvoie le Markdown et les notes dans l'ordre du texte.
export function poserNotes(markdown, liste, texte, garder) {
  const placees = liste
    .filter((n) => n.texte === texte && garder(n))
    .map((note) => ({ note, plages: trouverPlages(markdown, note.passage) }))
    .filter((p) => p.plages)
    .sort((a, b) => a.plages[0][0] - b.plages[0][0])
    .map((p, i) => ({ ...p, numero: i + 1 }));
  const poses = placees.flatMap(({ plages, numero }) =>
    plages.map(([debut, fin], k) => ({
      debut,
      fin,
      ouvre: ANNOTE,
      ferme: FIN_ANNOTE,
      avant: k === 0 ? corpsNote(numero) : "",
      apres: k === plages.length - 1 ? appel(numero) : "",
    })),
  );
  return { poses, notes: placees.map(({ note, numero }) => ({ note, numero })) };
}

// --- Actions du site local (servies par le serveur de développement) ---

function lireCorps(req) {
  return new Promise((resoudre, rejeter) => {
    let corps = "";
    req.on("data", (morceau) => {
      corps += morceau;
      if (corps.length > 100_000) rejeter(new Error("requête trop longue"));
    });
    req.on("end", () => {
      try {
        resoudre(JSON.parse(corps || "{}"));
      } catch {
        rejeter(new Error("JSON invalide"));
      }
    });
  });
}

function agir(action, donnees) {
  const { slug } = donnees;
  const chapitre = chargerChapitres().chapitres.get(slug);
  if (!chapitre) throw new Error(`aucune page longue « ${slug} »`);
  const liste = chargerNotes().notes.get(slug) || [];
  const date = aujourdhui();

  if (action === "question") {
    const { texte, passage, question } = donnees;
    if (!TEXTES.includes(texte)) throw new Error("texte inconnu");
    if (vide(question)) throw new Error("la question est vide");
    const vise = texteVise(chapitre, texte);
    const n = vise ? compterOccurrences(vise, String(passage || "")) : 0;
    if (n === 0) throw new Error("passage introuvable dans le chapitre : sélectionnez du texte sans franchir une note");
    if (n > 1) throw new Error(`ce passage apparaît ${n} fois : sélectionnez-en un peu plus`);
    const id = `n${Math.max(0, ...liste.map((x) => Number(String(x.id).slice(1)) || 0)) + 1}`;
    liste.push({ id, texte, passage: passage.trim(), etat: "en attente", fil: [{ auteur: "Mathieu", type: "question", texte: question.trim(), date }] });
  } else {
    const note = liste.find((x) => x.id === donnees.id);
    if (!note) throw new Error(`aucune note « ${donnees.id} »`);
    if (action === "valider") {
      if (note.etat !== "à relire") throw new Error(`une note « ${note.etat} » ne se valide pas`);
      note.publiee = { texte: note.note, sources: note.sources, citations: note.citations || [], date };
      note.etat = "validée";
    } else if (action === "precision") {
      if (vide(donnees.question)) throw new Error("la demande est vide");
      note.fil.push({ auteur: "Mathieu", type: "précision", texte: donnees.question.trim(), date });
      note.etat = "en attente";
    } else throw new Error(`action inconnue « ${action} »`);
  }
  ecrireNotes(slug, liste);
}

// Intergiciel du serveur de développement : POST /api/notes/<action>, JSON en entrée et en sortie.
// Le fichier écrit déclenche la reconstruction et le rechargement de la page.
export async function intergicielNotes(req, res, next) {
  const route = /^\/(?:[^/]+\/)?api\/notes\/(question|valider|precision)$/.exec(req.url.split("?")[0]);
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
