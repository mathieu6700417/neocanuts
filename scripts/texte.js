// `node scripts/texte.js <url>` : affiche le texte brut d'une page, tel que `verify` le lit.
// Sert à repérer un passage et à le copier sans le retaper.
import { lirePage, texteDe } from "./verify.js";

console.log(texteDe(lirePage(process.argv[2])).replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n"));
