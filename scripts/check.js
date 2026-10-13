// `npm run check` : valide les entrées et les ancres internes, sans rendu.
import { chargerEntrees, epoques } from "./validation.js";

const { entrees, erreurs } = chargerEntrees();
if (erreurs.length) {
  console.error(`${erreurs.length} erreur(s) :\n` + erreurs.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
const parEpoque = epoques
  .map((e) => `${e.libelle} : ${entrees.filter((x) => String(x.data.epoque) === e.cle).length}`)
  .join(" · ");
console.log(`${entrees.length} entrées valides. ${parEpoque}`);
