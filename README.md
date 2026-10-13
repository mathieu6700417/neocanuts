# Néocanuts

Frise chronologique de voix qui se sont opposées aux machines, à la technique
et au mécanisme, de l'Antiquité à aujourd'hui. Une page statique, un
paragraphe par auteur, en français, avec l'original affichable.

Site : <https://mathieu6700417.github.io/neocanuts/> · Spécification :
[SPEC.md](SPEC.md)

## Lancer le site

```sh
npm install
npm run dev      # serveur local avec rechargement
npm run build    # production, dans _site/
```

| Script | Rôle |
| --- | --- |
| `npm run check` | Valide les entrées et les ancres, sans rendu |
| `npm run verify [slug…]` | Vérifie mot à mot les extraits contre leurs sources en ligne |
| `npm run links` | Vérifie que les URL externes répondent |
| `npm run validate` | Valide le HTML généré (après `build`) |

## Ajouter une entrée

1. Trouver le texte **en ligne** (Wikisource, Gallica, Gutenberg,
   archive.org, site de l'auteur ou de l'éditeur). Sans source consultable,
   pas d'entrée : l'auteur va dans `src/_data/absents.json` avec la raison.
2. Créer `src/auteurs/<slug>.md` en copiant le passage depuis la source, sans
   le retaper. `node scripts/texte.js <url>` affiche le texte brut d'une page.

   ```yaml
   ---
   nom: Zhuangzi
   slug: zhuangzi            # identique au nom du fichier
   naissance: -369           # entier, vide si inconnu
   mort: -286
   dates_affichees: "v. 369–286 av. J.-C."   # facultatif, remplace naissance–mort
   annee: -300               # année du texte cité, sert au tri
   date_affichee: "IVe siècle av. J.-C."
   epoque: antiquite         # antiquite, classique, 1800, 1850, 1900, 1945, 1980
   oeuvre: "Zhuangzi, chapitre 12, « Ciel et Terre »"
   langue: zh                # code ISO de l'original
   traduction: "traduction de Léon Wieger, 1913"   # ou « traduction Néocanuts »
   theme: ame                # ame, travail, nature, savoir, pouvoir, progres, beaute, liberte
   source_url: https://…     # où l'extrait français a été vérifié
   original_url: https://…   # où l'original a été vérifié
   texte_integral_url: https://…
   verifie: 2026-10-14       # date de la vérification mot à mot
   notice: >
     Deux ou trois lignes qui situent l'auteur et le texte, sans juger.
   original: |
     Le paragraphe dans sa langue d'origine (inutile si langue: fr).
   ---
   Le paragraphe en français, sans guillemets d'encadrement.
   ```

3. Lancer `npm run check` puis `npm run verify <slug>`. Les deux doivent
   passer avant tout commit.

### Règles

- Un auteur, une entrée, un seul paragraphe de 60 à 200 mots (150 au plus
  pour un auteur sous droits).
- Une coupe se signale par `[…]` ; `verify` contrôle chaque passage, dans
  l'ordre.
- Un retour à la ligne dans un poème ou un dialogue s'écrit avec `\` en fin
  de ligne.
- `original`, `original_url` et `traduction` sont obligatoires dès que
  `langue` n'est pas `fr`.
- Pour une traduction publiée, `verify` contrôle le français contre
  `source_url` et l'original contre `original_url`. Pour une « traduction
  Néocanuts », seul l'original est contrôlé : la traduction se relit à la
  main.
- Pas de mots seulement « attribués ».

Le build et `check` s'arrêtent en nommant le fichier et le champ fautif.

## Licences

Code sous licence MIT ([LICENSE](LICENSE)). Textes cités : domaine public ou
citation courte. Traductions Néocanuts : CC BY-SA 4.0. Police EB Garamond :
SIL Open Font License.
