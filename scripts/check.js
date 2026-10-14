// `npm run check` : valide les entrées, les chapitres des pages longues et les ancres internes, sans rendu.
// `npm run check -- --complet` exige en plus que chaque entrée ait un chapitre ou figure
// dans pages_manquantes.json : c'est la condition de fusion de la branche pages-longues.
import { chargerEntrees, epoques } from "./validation.js";
import { validerChapitres } from "./chapitres.js";

const complet = process.argv.includes("--complet");
const { entrees, erreurs } = chargerEntrees();
const pages = validerChapitres(entrees, { complet });
erreurs.push(...pages.erreurs);
if (erreurs.length) {
  console.error(`${erreurs.length} erreur(s) :\n` + erreurs.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
const parEpoque = epoques
  .map((e) => `${e.libelle} : ${entrees.filter((x) => String(x.data.epoque) === e.cle).length}`)
  .join(" · ");
console.log(`${entrees.length} entrées valides. ${parEpoque}`);
console.log(`Pages longues : ${pages.chapitres.size} chapitre(s), ${pages.manquantes.length} page(s) manquante(s), ${pages.aTraiter.length} entrée(s) à traiter.`);
