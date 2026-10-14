---
name: notes
description: Traite les notes de lecture de Néocanuts. Publie d'abord les notes que Mathieu a validées sur le site local (contrôles, commit, push, vérification en ligne), puis répond aux questions et aux demandes de précision en attente dans src/notes/*.json, avec des sources en ligne. Utiliser quand Mathieu lance « /notes », « réponds aux questions » ou « traite les notes ».
---

# /notes — notes de lecture des pages longues

Mathieu surligne un passage d'une page longue sur le site local (`npm run dev`) et pose une
question ; elle s'enregistre dans `src/notes/<slug>.json`. Il valide les notes ou demande une
précision depuis le même site. Ce skill fait le reste. Modèle et règles : `SPEC.md`, section
« Notes de lecture ».

## 1. Publier ce que Mathieu a validé

1. `git status --short src/notes` et `git diff src/notes` : repérer les notes passées à
   `"etat": "validée"` (avec `publiee`) depuis le dernier commit, et les nouvelles questions.
2. S'il y a des validations : `npm run check`, `npm run verify <slugs concernés>`,
   `PATH_PREFIX=/neocanuts/ npm run build`, `npm run validate`. Tout doit passer.
3. Commiter **tout** `src/notes/` (questions comprises : le fil fait partie du dépôt) sur
   `main`, message « Notes : <n> publiée(s) (<slugs>) », puis `git push origin main`.
   Mathieu a autorisé ce push une fois pour toutes dans la spec : ne pas redemander.
4. Attendre la fin du déploiement (`gh run watch`), puis vérifier en ligne que chaque note
   publiée apparaît : `curl -s https://mathieu6700417.github.io/neocanuts/<slug>/ | grep`.

S'il n'y a aucune validation, passer directement à l'étape 2.

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

## 3. Récapitulatif

Finir par un tableau court : notes publiées (avec le lien), notes rédigées à relire, notes
« sans note » et pourquoi. Rappeler que le site local (`npm run dev`) les montre.
