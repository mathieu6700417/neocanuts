import markdownIt from "markdown-it";
import { chargerEntrees, dateIso, epoques } from "./scripts/validation.js";

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

  eleventyConfig.addFilter("dateIso", dateIso);

  // « 14 octobre 2026 »
  eleventyConfig.addFilter("dateFr", (v) =>
    new Date(`${dateIso(v)}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
  );

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
