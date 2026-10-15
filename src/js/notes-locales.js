// Site local seulement (`npm run dev`) : surligner un passage d'une page longue pour poser
// une question ou le proposer comme extrait de la frise, valider une note, demander une
// précision. Chaque action écrit dans src/notes/<slug>.json ou
// src/extraits/<slug>.json par le serveur de développement, qui reconstruit et recharge la page.
const API = document.currentScript.dataset.api;
const API_EXTRAITS = document.currentScript.dataset.apiExtraits;
const lecture = document.querySelector("#lecture[data-slug]");
// Bornes de l'extrait de la frise, en mots (scripts/validation.js).
const MOTS_MIN = 60;
const MOTS_MAX = 200;

function envoyer(action, donnees, base = API) {
  return fetch(base + action, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: lecture?.dataset.slug, ...donnees }),
  }).then(async (r) => {
    const reponse = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(reponse.erreur || `erreur ${r.status}`);
  });
}

// Comme compterMots de scripts/validation.js.
const compterMots = (texte) =>
  texte.replace(/[\\*_>#]/g, " ").replace(/[«»“”"(),.;:!?…—–\[\]]/g, " ").split(/\s+/).filter(Boolean).length;

// Panneau fixe en bas de page : le passage, un champ, Envoyer / Annuler.
const panneau = document.createElement("form");
panneau.className = "panneau-note";
panneau.hidden = true;
panneau.innerHTML = `
  <p class="panneau-titre"></p>
  <blockquote class="panneau-passage"></blockquote>
  <p class="panneau-avis"></p>
  <label class="visuellement-cache" for="panneau-texte">Votre question</label>
  <textarea id="panneau-texte" rows="3" required></textarea>
  <p class="panneau-actions"><button type="submit">Envoyer</button> <button type="button" data-annuler>Annuler</button> <span class="panneau-etat" role="status"></span></p>`;
document.body.append(panneau);
const champ = panneau.querySelector("textarea");
const etat = panneau.querySelector(".panneau-etat");
let enCours = null;

// `options` : { avis, facultatif, indication } pour la proposition d'extrait.
function ouvrir(titre, passage, envoi, { avis = "", facultatif = false, indication = "" } = {}) {
  panneau.querySelector(".panneau-titre").textContent = titre;
  panneau.querySelector(".panneau-avis").textContent = avis;
  panneau.querySelector(".panneau-avis").hidden = !avis;
  panneau.querySelector("label").textContent = facultatif ? "Commentaire" : "Votre question";
  champ.required = !facultatif;
  champ.placeholder = indication;
  panneau.querySelector(".panneau-passage").textContent = passage || "";
  panneau.querySelector(".panneau-passage").hidden = !passage;
  champ.value = "";
  etat.textContent = "";
  enCours = envoi;
  panneau.hidden = false;
  champ.focus();
}
const fermer = () => {
  panneau.hidden = true;
  enCours = null;
};
panneau.querySelector("[data-annuler]").addEventListener("click", fermer);
panneau.addEventListener("submit", (e) => {
  e.preventDefault();
  etat.textContent = "Envoi…";
  enCours(champ.value)
    .then(() => (etat.textContent = "Enregistré. La page va se recharger."))
    .catch((err) => (etat.textContent = err.message));
});

// Boutons flottants près de la sélection. « Proposer comme extrait » : texte français seulement.
const bouton = document.createElement("div");
bouton.className = "bouton-question";
bouton.hidden = true;
bouton.innerHTML = `<button type="button" data-choix="question">Poser une question</button><button type="button" data-choix="extrait">Proposer comme extrait</button>`;
document.body.append(bouton);
const boutonExtrait = bouton.querySelector('[data-choix="extrait"]');
let selection = null;

// Le texte sélectionné, sans les appels ni les notes qu'il traverse.
function texteSelectionne(plage) {
  const fragment = plage.cloneContents();
  fragment.querySelectorAll(".appel, .note").forEach((n) => n.remove());
  fragment.querySelectorAll("br").forEach((n) => n.replaceWith("\n"));
  fragment.querySelectorAll("p").forEach((n) => n.append("\n\n"));
  return fragment.textContent.replace(/[ \t]+/g, " ").trim();
}

document.addEventListener("selectionchange", () => {
  const sel = getSelection();
  const plage = sel.rangeCount && !sel.isCollapsed ? sel.getRangeAt(0) : null;
  // Sur plusieurs paragraphes, l'ancêtre commun est le bloc [data-texte] lui-même, pas un nœud texte.
  const ancetre = plage && plage.commonAncestorContainer;
  const element = ancetre && (ancetre.nodeType === Node.ELEMENT_NODE ? ancetre : ancetre.parentElement);
  const conteneur = element?.closest("[data-texte]");
  const dansUneNote = element?.closest(".note");
  if (!conteneur || dansUneNote || !panneau.hidden) {
    bouton.hidden = true;
    return;
  }
  selection = { texte: conteneur.dataset.texte, passage: texteSelectionne(plage) };
  const r = plage.getBoundingClientRect();
  bouton.style.top = `${window.scrollY + r.bottom + 6}px`;
  bouton.style.left = `${Math.max(8, window.scrollX + r.left)}px`;
  boutonExtrait.hidden = selection.texte !== "francais";
  bouton.hidden = !selection.passage;
});

bouton.addEventListener("mousedown", (e) => e.preventDefault());
bouton.addEventListener("click", (e) => {
  const choix = e.target.closest("button[data-choix]")?.dataset.choix;
  if (!choix) return;
  const { texte, passage } = selection;
  bouton.hidden = true;
  if (choix === "question") {
    ouvrir("Question sur ce passage", passage, (question) => envoyer("question", { texte, passage, question }));
    return;
  }
  const mots = compterMots(passage);
  const avis =
    mots > MOTS_MAX ? `${mots} mots : l'extrait de la frise en compte ${MOTS_MAX} au plus. /notes devra le couper.`
    : mots < MOTS_MIN ? `${mots} mots : l'extrait de la frise en compte ${MOTS_MIN} au moins. /notes devra l'allonger.`
    : `${mots} mots.`;
  ouvrir("Proposer ce passage comme extrait de la frise", passage, (commentaire) => envoyer("proposer", { passage, commentaire }, API_EXTRAITS), {
    avis,
    facultatif: true,
    indication: "Facultatif : une consigne pour /notes, par exemple « couper la phrase du milieu par […] »",
  });
});

// Actions des notes : Valider, Demander une précision.
document.addEventListener("click", (e) => {
  const cible = e.target.closest("button[data-action]");
  if (!cible) return;
  const { id, action, slug } = cible.dataset;
  // Demandes d'extrait, sur la page d'accueil.
  if (action.endsWith("-extrait")) {
    const quoi = action.slice(0, -"-extrait".length);
    if (quoi === "precision") {
      ouvrir("Demander une précision sur cet extrait", "", (question) => envoyer("precision", { slug, question }, API_EXTRAITS));
      return;
    }
    if (quoi === "abandonner" && !confirm("Abandonner cette demande d'extrait ?")) return;
    cible.disabled = true;
    envoyer(quoi, { slug }, API_EXTRAITS).catch((err) => {
      cible.disabled = false;
      cible.textContent = err.message;
    });
    return;
  }
  if (action === "valider") {
    cible.disabled = true;
    envoyer("valider", { id }).catch((err) => {
      cible.disabled = false;
      cible.textContent = err.message;
    });
  } else {
    ouvrir("Demander une précision sur cette note", "", (question) => envoyer("precision", { id, question }));
  }
});
