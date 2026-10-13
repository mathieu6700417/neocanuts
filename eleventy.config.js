import markdownIt from "markdown-it";
import { chargerEntrees, dateIso, epoques } from "./scripts/validation.js";

export default function (eleventyConfig) {
  eleventyConfig.setLibrary(
    "md",
    markdownIt({ html: false, typographer: true, quotes: ["« ", " »", "‹ ", " ›"] }),
  );

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
