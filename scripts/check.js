// `npm run check` : valide les entrées, les chapitres des pages longues, les notes de lecture
// et les ancres internes, sans rendu.
// `npm run check -- --complet` exige en plus que chaque entrée ait un chapitre ou figure
// dans pages_manquantes.json : c'est la condition de fusion de la branche pages-longues.
import { chargerEntrees, epoques } from "./validation.js";
import { validerChapitres } from "./chapitres.js";
import { compterEnAttente, validerNotes } from "./notes.js";

const complet = process.argv.includes("--complet");
const { entrees, erreurs } = chargerEntrees();
const pages = validerChapitres(entrees, { complet });
erreurs.push(...pages.erreurs);
const lecture = validerNotes(pages.chapitres);
erreurs.push(...lecture.erreurs);
if (erreurs.length) {
  console.error(`${erreurs.length} erreur(s) :\n` + erreurs.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
const parEpoque = epoques
  .map((e) => `${e.libelle} : ${entrees.filter((x) => String(x.data.epoque) === e.cle).length}`)
  .join(" · ");
console.log(`${entrees.length} entrées valides. ${parEpoque}`);
const toutes = [...lecture.notes.values()].flat();
console.log(`Notes : ${toutes.filter((n) => n.publiee).length} publiée(s), ${toutes.filter((n) => n.etat === "à relire").length} à relire, ${compterEnAttente(lecture.notes)} question(s) en attente.`);
console.log(`Pages longues : ${pages.chapitres.size} chapitre(s), ${pages.manquantes.length} page(s) manquante(s), ${pages.aTraiter.length} entrée(s) à traiter.`);
