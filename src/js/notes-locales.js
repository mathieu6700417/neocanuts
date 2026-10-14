// Site local seulement (`npm run dev`) : surligner un passage d'une page longue pour poser
// une question, valider une note, demander une précision. Chaque action écrit dans
// src/notes/<slug>.json par le serveur de développement, qui reconstruit et recharge la page.
const API = document.currentScript.dataset.api;
const lecture = document.querySelector("#lecture[data-slug]");

function envoyer(action, donnees) {
  return fetch(API + action, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: lecture.dataset.slug, ...donnees }),
  }).then(async (r) => {
    const reponse = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(reponse.erreur || `erreur ${r.status}`);
  });
}

// Panneau fixe en bas de page : le passage, un champ, Envoyer / Annuler.
const panneau = document.createElement("form");
panneau.className = "panneau-note";
panneau.hidden = true;
panneau.innerHTML = `
  <p class="panneau-titre"></p>
  <blockquote class="panneau-passage"></blockquote>
  <label class="visuellement-cache" for="panneau-texte">Votre question</label>
  <textarea id="panneau-texte" rows="3" required></textarea>
  <p class="panneau-actions"><button type="submit">Envoyer</button> <button type="button" data-annuler>Annuler</button> <span class="panneau-etat" role="status"></span></p>`;
document.body.append(panneau);
const champ = panneau.querySelector("textarea");
const etat = panneau.querySelector(".panneau-etat");
let enCours = null;

function ouvrir(titre, passage, envoi) {
  panneau.querySelector(".panneau-titre").textContent = titre;
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

// Bouton flottant près de la sélection.
const bouton = document.createElement("button");
bouton.type = "button";
bouton.className = "bouton-question";
bouton.textContent = "Poser une question";
bouton.hidden = true;
document.body.append(bouton);
let selection = null;

// Le texte sélectionné, sans les appels ni les notes qu'il traverse.
function texteSelectionne(plage) {
  const fragment = plage.cloneContents();
  fragment.querySelectorAll(".appel, .note").forEach((n) => n.remove());
  fragment.querySelectorAll("br").forEach((n) => n.replaceWith("\n"));
  return fragment.textContent.replace(/[ \t]+/g, " ").trim();
}

document.addEventListener("selectionchange", () => {
  const sel = getSelection();
  const plage = sel.rangeCount && !sel.isCollapsed ? sel.getRangeAt(0) : null;
  const conteneur = plage && plage.commonAncestorContainer.parentElement?.closest("[data-texte]");
  const dansUneNote = plage && plage.commonAncestorContainer.parentElement?.closest(".note");
  if (!conteneur || dansUneNote || !panneau.hidden) {
    bouton.hidden = true;
    return;
  }
  selection = { texte: conteneur.dataset.texte, passage: texteSelectionne(plage) };
  const r = plage.getBoundingClientRect();
  bouton.style.top = `${window.scrollY + r.bottom + 6}px`;
  bouton.style.left = `${Math.max(8, window.scrollX + r.left)}px`;
  bouton.hidden = !selection.passage;
});

bouton.addEventListener("mousedown", (e) => e.preventDefault());
bouton.addEventListener("click", () => {
  const { texte, passage } = selection;
  bouton.hidden = true;
  ouvrir("Question sur ce passage", passage, (question) => envoyer("question", { texte, passage, question }));
});

// Actions des notes : Valider, Demander une précision.
document.addEventListener("click", (e) => {
  const cible = e.target.closest("button[data-action]");
  if (!cible) return;
  const id = cible.dataset.id;
  if (cible.dataset.action === "valider") {
    cible.disabled = true;
    envoyer("valider", { id }).catch((err) => {
      cible.disabled = false;
      cible.textContent = err.message;
    });
  } else {
    ouvrir("Demander une précision sur cette note", "", (question) => envoyer("precision", { id, question }));
  }
});
