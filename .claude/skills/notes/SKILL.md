---
name: notes
description: Traite les notes de lecture et les changements d'extrait de Néocanuts. Publie d'abord les notes validées par Mathieu et les nouveaux extraits déjà appliqués (contrôles, commit, push, vérification en ligne), puis répond aux questions en attente dans src/notes/*.json et prépare puis applique les extraits demandés dans src/extraits/*.json. Utiliser quand Mathieu lance « /notes », « réponds aux questions », « traite les notes » ou « change l'extrait ».
---

# /notes — notes de lecture des pages longues

Mathieu surligne un passage d'une page longue sur le site local (`npm run dev`) et pose une
question ; elle s'enregistre dans `src/notes/<slug>.json`. Il valide les notes ou demande une
précision depuis le même site. Il peut aussi sélectionner un passage du texte français d'une
page longue et le proposer comme nouvel extrait de la frise ; la demande s'enregistre dans
`src/extraits/<slug>.json`. Ce skill fait le reste. Modèle et règles : `SPEC.md`, sections
« Notes de lecture » et « Changer d'extrait ».

## 1. Publier ce que Mathieu a validé

1. `git status --short src/notes` et `git diff src/notes` : repérer les notes passées à
   `"etat": "validée"` (avec `publiee`) depuis le dernier commit, et les nouvelles questions.
   Repérer aussi les entrées `src/auteurs/*.md` modifiées : ce sont les extraits que
   l'étape 3 d'un `/notes` précédent a appliqués. Vérifier ce diff : seuls l'extrait,
   `original`, `notice`, `oeuvre` et `verifie` doivent changer.
2. S'il y a des validations (notes ou extraits) : `npm run check`, `npm run verify <slugs concernés>`,
   `PATH_PREFIX=/neocanuts/ npm run build`, `npm run validate`. Tout doit passer.
3. Commiter **tout** `src/notes/` et `src/extraits/` (demandes comprises : le fil fait
   partie du dépôt), ainsi que les entrées modifiées, sur `main`, message « Notes : <n>
   publiée(s) (<slugs>) » ou « Extraits : <slugs> », les deux si besoin, puis
   `git push origin main`.
   Mathieu a autorisé ce push une fois pour toutes dans la spec : ne pas redemander.
4. Attendre la fin du déploiement (`gh run watch`), puis vérifier en ligne que chaque note
   publiée apparaît : `curl -s https://mathieu6700417.github.io/neocanuts/<slug>/ | grep`,
   et que chaque nouvel extrait figure sur la frise :
   `curl -s https://mathieu6700417.github.io/neocanuts/ | grep`.

S'il n'y a aucune validation ni entrée modifiée, passer directement à l'étape 2.

## 2. Répondre aux notes « en attente »

Pour chaque note `"etat": "en attente"` (question neuve, ou `précision` en fin de `fil`) :

1. Lire le passage dans son contexte : `src/chapitres/<slug>.md` (ou `.original.md` si
   `"texte": "original"`), l'entrée `src/auteurs/<slug>.md`, et tout le `fil`.
2. Chercher la réponse **en ligne**, dans les sources permises par le projet (Wikisource,
   Gallica, Gutenberg, archive.org, Perseus, ctext, Wikipédia pour les faits établis, sites
   d'éditeurs ou d'institutions). Jamais de bibliothèque pirate, jamais de mémoire seule :
   chaque fait de la note doit se lire dans une source consultée avec
   `node scripts/texte.js <url>`.
3. Si la réponse est sûre, mettre à jour la note :
   - `fil` : ajouter `{ "auteur": "Claude", "type": "réponse", "texte": <ce que j'ai trouvé,
     mes doutes, ce qui a changé>, "date": <AAAA-MM-JJ> }`. Ce compte rendu reste dans le
     fichier mais n'est pas affiché : Mathieu ne voit que ses questions et la note ;
   - `note` : la réponse publiable, **réécrite en entier** si c'est une précision (elle
     intègre la précision ; la question n'y figure pas). 30 à 150 mots, Markdown en ligne
     (*italique* seulement). Elle explique et situe, ne juge pas l'auteur ;
   - `sources` : `[{ "titre", "url" }]`, au moins une, chaque URL réellement consultée ;
   - `citations` : `[{ "texte", "source_url" }]` pour toute citation d'un texte entre
     guillemets, copiée depuis la source ; `verify` la contrôle mot à mot ;
   - `date` : aujourd'hui ; `etat` : `"à relire"`. Ne jamais toucher `publiee` : la
     version en ligne reste celle que Mathieu a validée.
4. Si je ne trouve pas de réponse sûre : ajouter au `fil` une réponse, adressée à Mathieu et
   affichée sur le site local, qui dit ce que j'ai cherché et pourquoi je ne conclus pas, sans écrire de `note`, et passer `etat` à
   `"sans note"`. Mathieu peut relancer par une demande de précision.
5. `npm run check` puis `npm run verify <slug>` : les deux doivent passer.

Ne pas commiter à cette étape : les réponses attendent la relecture de Mathieu, et seront
commitées avec ses validations au prochain `/notes`. Les fichiers restent dans le dépôt local.

## 3. Préparer les extraits « en attente »

Pour chaque `src/extraits/<slug>.json` en `"etat": "en attente"` (demande neuve, ou
`précision` en fin de `fil`) :

1. Lire `passage` (le texte français choisi par Mathieu sur la page longue), `commentaire`,
   tout le `fil`, l'entrée `src/auteurs/<slug>.md` et le chapitre `src/chapitres/<slug>.md`
   (et `.original.md`).
2. Écrire `proposition.extrait` : le passage, en **un seul paragraphe** (joindre les
   paragraphes sélectionnés), de 60 à 200 mots, recopié du chapitre au caractère près
   (Markdown compris). Ne couper ou allonger que si la longueur l'impose ou si Mathieu le
   demande, et signaler toute coupe par `[…]`. Le passage doit rester retrouvable dans le
   chapitre : `check` le contrôle.
3. Si l'entrée a un `original` : écrire `proposition.original`, le passage correspondant du
   chapitre original, recopié au caractère près, mêmes coupes, ni plus ni moins de texte.
4. Relire la notice. Si elle décrit l'ancien extrait (« il résume ici… », « dans ce
   passage… ») et ne colle plus, écrire `proposition.notice`, retouchée au minimum, avec
   les règles des notices. Sinon, ne pas mettre de champ `notice`.
   De même pour la référence : si `oeuvre` donne des vers, paragraphes ou pages qui ne
   correspondent plus au nouveau passage, écrire `proposition.oeuvre` corrigée ; sinon,
   ne pas mettre ce champ.
5. Ajouter au `fil` une réponse `{ "auteur": "Claude", "type": "réponse", "texte": <ce que
   j'ai fait : coupes, alignement de l'original, notice, référence>, "date" }` ; `date` :
   aujourd'hui ; `etat` : `"prête"`.
6. `npm run check` puis `npm run verify <slug>` (qui contrôle aussi l'extrait et l'original
   proposés) : les deux doivent passer.
7. `node scripts/extraits.js appliquer <slug>` : reporte la proposition dans
   `src/auteurs/<slug>.md` sans autre validation de Mathieu (il l'a demandé), en ne
   touchant que ces champs, et supprime la demande. Le site local montre aussitôt le
   nouvel extrait. Relancer `npm run check` et `npm run verify <slug>`.
8. Si la demande ne peut pas aboutir (original introuvable, passage impossible à ramener à
   la bonne longueur sans le trahir) : réponse au `fil` qui explique pourquoi, pas de
   `proposition`, `etat` : `"sans extrait"`. Mathieu peut relancer par une précision.

Ne pas commiter à cette étape : l'entrée modifiée sera publiée au prochain `/notes`,
avec le reste, sauf si Mathieu demande de publier tout de suite.

## 4. Récapitulatif

Finir par un tableau court : notes publiées (avec le lien), notes rédigées à relire, notes
« sans note » et pourquoi, extraits publiés, extraits appliqués au site local (à
publier au prochain `/notes`), extraits « sans extrait » et pourquoi. Rappeler que le site local (`npm run dev`) les montre.
