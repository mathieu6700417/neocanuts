import markdownIt from "markdown-it";
import { chargerEntrees, dateIso, epoques } from "./scripts/validation.js";
import { DEBUT, FIN, finaliser, inserer, trouverPlages, validerChapitres } from "./scripts/chapitres.js";
import { chargerNotes, compterEnAttente, intergicielNotes, poserNotes, validerNotes } from "./scripts/notes.js";

// Site local (`npm run dev`) : toutes les notes, avec leur fil et les actions d'édition.
// Site public : les seules notes validées, sans script d'édition.
const LOCAL = process.env.NEOCANUTS_LOCAL === "1";

// Espaces insécables du français : avant ; : ! ? » et après «.
// « J.-C. » ne se coupe pas au trait d'union (gluon U+2060).
const insecables = (texte) =>
  String(texte)
    .replace(/ ([;:!?»])/g, "\u00a0$1")
    .replace(/« /g, "«\u00a0")
    .replace(/\b(av|apr)\. J\.-C\./g, "$1.\u00a0J.-\u2060C.")
    .replace(/\bv\. (?=\d)/g, "v.\u00a0");

export default function (eleventyConfig) {
  const md = markdownIt({ html: false, typographer: true, quotes: ["«\u00a0", "\u00a0»", "‹\u00a0", "\u00a0›"] });
  md.core.ruler.push("insecables", (state) => {
    for (const bloc of state.tokens) {
      for (const jeton of bloc.children || []) if (jeton.type === "text") jeton.content = insecables(jeton.content);
    }
  });
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addFilter("insecables", insecables);

  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addGlobalData("local", LOCAL);
  if (LOCAL) {
    eleventyConfig.addPassthroughCopy("src/js");
    eleventyConfig.addWatchTarget("./src/notes/");
    eleventyConfig.addGlobalData("notesEnAttente", () => compterEnAttente(chargerNotes().notes));
    eleventyConfig.setServerOptions({ middleware: [intergicielNotes] });
  }

  // La frise : les époques non vides, chacune avec ses entrées triées par année du texte.
  // Le build s'arrête si une entrée viole le modèle.
  eleventyConfig.addCollection("frise", (collectionApi) => {
    const { erreurs } = chargerEntrees();
    if (erreurs.length) {
      throw new Error("Entrées invalides :\n" + erreurs.map((e) => `  - ${e}`).join("\n"));
    }
    const entrees = collectionApi
      .getFilteredByGlob("src/auteurs/*.md")
      .sort((a, b) => a.data.annee - b.data.annee || a.inputPath.localeCompare(b.inputPath));
    return epoques
      .map((epoque) => ({ ...epoque, entrees: entrees.filter((e) => String(e.data.epoque) === epoque.cle) }))
      .filter((epoque) => epoque.entrees.length);
  });

  // Une note rendue dans le texte : la note de marge (en <span>, pour rester dans le paragraphe)
  // au début du passage, l'appel numéroté à la fin. En ligne, la version publiée seule ; en
  // local, l'état, le dernier message utile et les actions.
  const echapper = md.utils.escapeHtml;
  // « 14 octobre 2026 »
  const dateFr = (v) =>
    new Date(`${dateIso(v)}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const rendreSources = (sources) =>
    sources?.length ? `<span class="note-sources">Sources : ${sources.map((x) => `<a href="${echapper(x.url)}">${md.renderInline(x.titre)}</a>`).join(", ")}.</span>` : "";
  const rendreAppel = ({ numero }, id) => `<sup class="appel"><a href="#${id}" id="appel-${id}" aria-label="Note ${numero}">${numero}</a></sup>`;
  const rendreNote = ({ note, numero }, id) => {
    if (!LOCAL) {
      const p = note.publiee;
      return `<span class="note" id="${id}" role="note"><span class="note-numero">${numero}.</span> ${md.renderInline(p.texte)} ${rendreSources(p.sources)} <span class="note-signature">Note Néocanuts, ${dateFr(p.date)}.</span></span>`;
    }
    // Le fil reste dans le fichier. On n'en montre que le dernier message quand il n'y a pas
    // de note à lire : la question en attente, ou l'explication de Claude (« sans note »).
    const fil = note.fil
      .slice(-1)
      .filter(() => ["en attente", "sans note"].includes(note.etat))
      .map((t) => `<span class="tour tour-${t.auteur === "Claude" ? "claude" : "mathieu"}"><b>${t.auteur === "Claude" ? "Claude" : "Vous"}${t.type === "précision" ? " (précision)" : ""} :</b> ${echapper(t.texte)}</span>`)
      .join("");
    const reponse = note.note ? `<span class="note-corps">${md.renderInline(note.note)} ${rendreSources(note.sources)}</span>` : "";
    const enLigne = note.publiee && note.etat !== "validée" ? '<span class="note-info">Une version validée reste en ligne.</span>' : "";
    const actions = [
      note.etat === "à relire" ? `<button type="button" data-action="valider" data-id="${note.id}">Valider</button>` : "",
      note.etat !== "en attente" ? `<button type="button" data-action="precision" data-id="${note.id}">Demander une précision</button>` : "",
    ].join(" ");
    return `<span class="note note-locale" id="${id}" role="note" data-etat="${note.etat}"><span class="note-tete">${numero}${note.etat === "validée" ? "" : ` · ${note.etat}`}</span>${fil ? `<span class="note-fil">${fil}</span>` : ""}${reponse}${enLigne}<span class="note-actions">${actions}</span></span>`;
  };

  // Rend un texte (français ou original) : passage cité dans un <mark>, notes posées.
  const rendreTexte = (markdown, extrait, ancre, notes, texte) => {
    const passage = trouverPlages(markdown, extrait).map(([debut, fin]) => ({ debut, fin, ouvre: DEBUT, ferme: FIN }));
    const { poses, notes: placees } = poserNotes(markdown, notes, texte, (n) => LOCAL || n.publiee);
    const prefixe = texte === "original" ? "note-o" : "note-f";
    const html = md.render(inserer(markdown, [...passage, ...poses]));
    return finaliser(html, {
      ancre,
      rendreAppel: (n) => rendreAppel(placees[n - 1], `${prefixe}${n}`),
      rendreCorps: (n) => rendreNote(placees[n - 1], `${prefixe}${n}`),
    });
  };

  // Les pages longues, dans l'ordre de la frise : le chapitre rendu avec le passage cité
  // dans un <mark>, l'original de même, les notes, et les voisins qui ont aussi une page.
  // Le build s'arrête si un chapitre ne contient pas le paragraphe de la frise, ou si une
  // note ne retrouve pas son passage.
  eleventyConfig.addCollection("pagesLongues", () => {
    const { entrees, erreurs } = chargerEntrees();
    const { chapitres, erreurs: erreursChapitres } = validerChapitres(entrees);
    const { notes, erreurs: erreursNotes } = validerNotes(chapitres);
    erreurs.push(...erreursChapitres, ...erreursNotes);
    if (erreurs.length) {
      throw new Error("Pages longues invalides :\n" + erreurs.map((e) => `  - ${e}`).join("\n"));
    }
    const pages = entrees
      .filter((e) => chapitres.has(e.data.slug))
      .map(({ data, corps }) => {
        const chapitre = chapitres.get(data.slug);
        const liste = notes.get(data.slug) || [];
        return {
          slug: data.slug,
          entree: data,
          chapitre: chapitre.data,
          html: rendreTexte(chapitre.corps, corps, "passage", liste, "francais"),
          htmlOriginal: chapitre.original ? rendreTexte(chapitre.original, data.original, "passage-original", liste, "original") : null,
        };
      });
    return pages.map((p, i) => ({ ...p, precedent: pages[i - 1]?.entree, suivant: pages[i + 1]?.entree }));
  });
  eleventyConfig.addFilter("aUnePage", (pages, slug) => pages.some((p) => p.slug === slug));

  eleventyConfig.addFilter("dateIso", dateIso);

  eleventyConfig.addFilter("dateFr", dateFr);

  // Valeur de l'attribut datetime d'un <time> : année à quatre chiffres, vide avant l'an 1.
  eleventyConfig.addFilter("anneeIso", (annee) => (annee > 0 ? String(annee).padStart(4, "0") : ""));

  // « 1623–1662 », « 369–286 av. J.-C. », « 4 av. J.-C. – 65 », « 1934– ».
  eleventyConfig.addFilter("dates", (naissance, mort) => {
    const an = (a) => (a < 0 ? `${-a} av. J.-C.` : String(a));
    const connu = (a) => Number.isInteger(a);
    if (connu(naissance) && connu(mort)) {
      if (naissance < 0 && mort < 0) return `${-naissance}–${-mort} av. J.-C.`;
      return naissance < 0 ? `${an(naissance)} – ${an(mort)}` : `${naissance}–${mort}`;
    }
    if (connu(naissance)) return `${an(naissance)}–`;
    if (connu(mort)) return `†\u00a0${an(mort)}`;
    return "";
  });

  return {
    dir: { input: "src", output: "_site" },
    pathPrefix: process.env.PATH_PREFIX || "/",
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
