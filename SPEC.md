# Néocanuts — Spécification

Spécification établie le 14 octobre 2026 avec Mathieu. Copie du doc Claude
<https://claude.ai/code/artifact/5bb5bb03-b144-4625-9750-ffadaba1903a> ; en cas
de divergence, le doc fait foi tant que cette copie n'a pas été resynchronisée.

## Objet

Néocanuts est un site statique en une seule page : une frise chronologique
d'environ cinquante voix qui se sont opposées aux machines, à la technique ou
au mécanisme comme vision du monde, de l'Antiquité à aujourd'hui. Chaque voix
est présentée par un paragraphe tiré de ses écrits, en français, avec
l'original affichable d'un geste. Le site est construit à partir de fichiers
Markdown et conçu pour la lecture sans distraction, sur ordinateur comme sur
téléphone.

Cette spécification est le point d'entrée de la session de développement.

## Décisions prises

Onze questions ont été posées et tranchées le 14 octobre 2026.

| Question | Décision |
| --- | --- |
| Périmètre | Large : critique concrète des machines et de la technique, critique philosophique du mécanisme, fables et textes anciens |
| Langue des extraits | Français par défaut, texte original affichable à la demande |
| Structure | Une seule page longue, facile à naviguer |
| Contenu d'une entrée | Nom, dates, année du texte, notice courte, extrait, référence précise, lien vers le texte intégral, un mot-clé thématique |
| Rigueur | Stricte : aucun extrait publié sans vérification mot à mot contre une source en ligne |
| Outillage | Un fichier Markdown par auteur, Eleventy, HTML pur, aucun JavaScript |
| Hébergement | GitHub Pages, déploiement par GitHub Actions à chaque push sur `main` |
| Apparence | Sobre : colonne étroite, police à empattements, clair ou sombre selon le système, frise verticale discrète |
| Titre | « Néocanuts » à l'affichage, `neocanuts` comme identifiant technique |
| Corpus | Liste choisie par l'assistant à partir des incontournables validés, ajustée ensuite par Mathieu |
| Dépôt | Dépôt GitHub public `neocanuts` à créer depuis le dossier local |

## Périmètre éditorial

La frise retient trois familles de textes, triées par l'année du texte cité et
non par la naissance de l'auteur.

- **Critique concrète de la machine et de la technique** : luddites, canuts,
  Butler, Mumford, Ellul, Illich, Anders, Kaczynski, Pièces et Main d'Œuvre.
- **Critique philosophique du mécanisme comme vision du monde** : Pascal,
  Goethe contre Newton, romantiques allemands, Bergson, Heidegger.
- **Fables et textes anciens** : le jardinier de Han Yin dans le Zhuangzi,
  Platon sur l'écriture, Sénèque sur les inventions.

**Époques du sommaire** : Antiquité · Renaissance et âge classique
(XVIe–XVIIIe) · 1800–1850 · 1850–1900 · 1900–1945 · 1945–1980 · Depuis 1980.

**Règles de composition** :

- Cible de cinquante entrées pour la v1, quarante au minimum pour publier, pas
  de maximum.
- Un auteur, une entrée, un seul extrait. Un collectif ou un anonyme (le
  « général Ludd », L'Écho de la Fabrique) compte comme un auteur.
- Incontournables validés par Mathieu : Zhuangzi, les luddites, les canuts,
  Bernanos, Simone Weil, Thoreau, Ruskin, Butler, Ellul, Illich, Anders,
  Kaczynski, Pièces et Main d'Œuvre. Ils n'entrent que s'ils passent la règle
  de rigueur ; sinon ils figurent dans la liste des absents avec la raison.
- Pas de quota par époque, mais au moins cinq entrées avant 1800 et au moins
  huit après 1945, pour que le XIXe siècle anglais n'écrase pas le reste.
- La notice situe l'auteur et le texte, elle ne juge pas et ne milite pas.
  L'extrait parle seul.
- Les dates approximatives sont permises et affichées comme telles
  (« IVe siècle av. J.-C. »).

## Règle de rigueur

Aucun extrait n'est publié sans avoir été vérifié mot à mot contre une source
en ligne consultable. C'est la règle qui protège le site : une citation
inventée ou déformée le ruinerait.

1. **Source de vérification obligatoire.** Chaque entrée consigne l'URL où le
   texte a été lu (Wikisource, Gallica, Gutenberg, archive.org, ctext.org,
   Perseus, site de l'auteur ou de l'éditeur, archive de presse) et la date de
   la vérification. Le build rejette toute entrée sans URL ni date.
2. **Traduction française.** Priorité à une traduction publiée, libre de
   droits et en ligne. À défaut, quand l'original est libre de droits,
   traduction maison signée « traduction Néocanuts » et vérifiée contre
   l'original en ligne ; l'original reste affichable.
3. **Auteurs sous droits** (morts depuis moins de 70 ans). Ils n'entrent que
   si le texte cité, en français ou dans l'original, est publié en ligne de
   façon vérifiable. L'extrait reste une citation courte, un paragraphe
   d'environ 150 mots au plus, avec référence complète.
4. **Longueur.** Un seul paragraphe, de 60 à 200 mots en français.
5. **Fidélité.** Pas de coupe interne sans crochets, pas de modernisation de
   l'orthographe sans le signaler dans la référence.
6. **Pas d'apocryphe.** Les mots seulement « attribués » (la réponse
   d'Élisabeth Ire à William Lee, par exemple) sont exclus, ou présentés comme
   une tradition rapportée par une source nommée.
7. **Liste des absents.** Une section en bas de page nomme les auteurs écartés
   par cette règle et pourquoi, afin que Mathieu puisse fournir une édition et
   les faire entrer plus tard.
8. **Droits et licences.** Sur la frise, textes du domaine public ou
   citations courtes ; sur les pages longues, chapitres entiers, auteurs sous
   droits compris, par choix assumé de Mathieu ; traductions Néocanuts sous CC BY-SA 4.0 ; code sous MIT. Le colophon le dit.

## Modèle d'une entrée

Une entrée est un fichier `src/auteurs/<slug>.md` : les métadonnées en
en-tête YAML, l'extrait français dans le corps. Le tri se fait sur le champ
`annee`, jamais sur le nom du fichier.

```yaml
---
nom: Zhuangzi
slug: zhuangzi
naissance: -369           # entier, vide si inconnu
mort: -286
annee: -300               # année du texte cité, entier, sert au tri
date_affichee: "IVe siècle av. J.-C."
epoque: antiquite         # clé d'une époque du sommaire
oeuvre: "Zhuangzi, chapitre 12, « Ciel et Terre »"
langue: zh                # code ISO de l'original
traduction: "Léon Wieger, Les Pères du système taoïste, 1913"
theme: ame                # un seul mot-clé, liste fermée
source_url: https://fr.wikisource.org/...      # où l'extrait a été vérifié
original_url: https://ctext.org/zhuangzi/heaven-and-earth
texte_integral_url: https://fr.wikisource.org/...
verifie: 2026-10-20       # date de la vérification mot à mot
notice: >
  Deux ou trois lignes qui situent l'auteur et le contexte du texte.
original: |
  Le paragraphe dans sa langue d'origine, vide si l'original est en français.
---
Le paragraphe cité en français, en Markdown, sans guillemets d'encadrement.
```

**Mots-clés thématiques** (liste fermée, un par entrée) : `ame`, `travail`,
`nature`, `savoir`, `pouvoir`, `progres`, `beaute`, `liberte`.

**Clés d'époque** : `antiquite`, `classique`, `1800`, `1850`, `1900`, `1945`,
`1980`. Leurs libellés et bornes vivent dans `src/_data/epoques.json`.

**Champs obligatoires** : `nom`, `slug`, `annee`, `date_affichee`, `epoque`,
`oeuvre`, `langue`, `theme`, `source_url`, `verifie`, `notice`, le corps.
`original` et `original_url` sont obligatoires dès que `langue` n'est pas
`fr`. `traduction` est obligatoire dès que `langue` n'est pas `fr` et vaut
« traduction Néocanuts » pour une traduction maison.

## Navigation et apparence

La page se lit comme un livre : une colonne de texte, une frise en marge, un
sommaire toujours à portée de main, et rien d'autre.

**Ordre de la page** : en-tête (titre, sous-titre d'une phrase, lien vers la
méthode) · sommaire · frise · section « Absents » · colophon (sources,
licences, lien vers le dépôt).

**Sommaire**

- Sur écran large (≥ 900 px) : colonne gauche fixe listant les époques ; sous
  l'époque en cours de lecture, la liste des noms. Chaque nom est une ancre
  `#<slug>`.
- Sur mobile : barre supérieure fine qui affiche l'époque courante et un
  bouton « Sommaire » ouvrant la liste des époques et des noms. Réalisé avec
  `<details>`, sans JavaScript.
- En fin de chaque époque, un lien discret « Sommaire » ramène en haut.

**Une entrée dans la frise** : année en marge gauche sur écran large,
au-dessus du nom sur mobile ; nom et dates ; notice ; extrait dans un
`<blockquote>` ; référence en petit corps ; `<details><summary>Texte
original</summary>` portant l'attribut `lang` de l'original ; liens « Texte
intégral » et « Source de l'extrait ».

**Frise** : un trait vertical fin dans la marge gauche de la colonne, un point
par entrée, un repère à chaque changement d'époque. Sur mobile, le trait reste
mais s'amincit.

**Typographie** : police à empattements auto-hébergée en woff2 (EB Garamond ou
Literata, licence OFL) avec repli sur la pile serif du système ; corps de
19 px sur écran large et 17 px sur mobile, interligne 1,6 ; colonne de 38 em
au plus, gouttières de 16 px sur mobile ; titres dans la même famille ;
chiffres tabulaires pour les années.

**Couleurs** : papier `#faf8f3` et encre `#1d1d1b` en clair ; `#15151a` et
`#e6e3dc` en sombre ; un accent ocre atténué pour les liens et la frise.
Bascule automatique par `prefers-color-scheme`, sans bouton en v1.

**Interdits** : images, icônes, animations, requêtes externes (polices
comprises), scripts, cookies, mesure d'audience.

**Souhaitable** : feuille de style d'impression qui masque la frise et déplie
les originaux.

## Technique

Eleventy 3 génère une page HTML et une feuille de style à partir des fichiers
Markdown ; le build échoue si une entrée viole le modèle.

**Pile** : Node 20 LTS, npm, Eleventy 3.x, gabarits Nunjucks, markdown-it avec
l'option `typographer` et les guillemets français « ». Aucune dépendance
d'exécution côté navigateur.

**Arborescence**

```text
neocanuts/
  .github/workflows/deploy.yml
  eleventy.config.js
  package.json
  README.md            # comment ajouter une entrée
  SPEC.md              # ce document
  src/
    index.njk          # la page unique
    _includes/
      layout.njk
      entree.njk       # une entrée de la frise
    _data/
      site.json        # titre, description, URL
      epoques.json     # clés, libellés, bornes
      themes.json      # clés et libellés des mots-clés
    auteurs/           # un .md par auteur
    css/style.css      # une seule feuille, moins de 300 lignes
    fonts/             # woff2 auto-hébergés
  _site/               # généré, ignoré par git
```

**Contrôles de build** : la collection `auteurs` valide chaque fichier avant
rendu. Champ obligatoire manquant, `theme` ou `epoque` hors liste, `annee`
non entier, `source_url` absente ou `verifie` absent, `original` vide pour
une langue autre que `fr` : le build s'arrête en nommant le fichier et le
champ fautif. Un slug en double est aussi une erreur.

**Scripts npm** : `dev` (serveur local avec rechargement), `build`
(production), `check` (validation des entrées et des liens internes sans
rendu), `links` (vérification des URL externes, lancé à la main).

**Préfixe de chemin** : la config lit `PATH_PREFIX` dans l'environnement ;
vide en local, `/neocanuts/` sur GitHub Pages. Tous les liens internes passent
par le filtre `url` d'Eleventy.

**Accessibilité** : HTML sémantique (`<nav>` pour le sommaire, un `<article>`
par entrée, `<blockquote cite>` pour l'extrait, `<time>` pour les années),
lien d'évitement vers la frise, contraste AA, focus visible, `lang="fr"` sur
la racine et `lang` de l'original sur chaque bloc dépliable. Tout fonctionne
sans script puisqu'il n'y en a pas.

**Performance** : page de moins de 300 Ko hors polices ; polices en
sous-ensemble latin ; score Lighthouse mobile d'au moins 95 sur les quatre
axes.

**Référencement minimal** : `title`, `meta description`, lien canonique,
balises Open Graph textuelles, `robots.txt` permissif. Pas de sitemap
nécessaire pour une page.

**Intégration continue** : `npm run check`, `npm run build` et une validation
HTML (`html-validate`) sur chaque push ; le déploiement n'a lieu que si tout
passe.

## Publication

Le site vit dans un dépôt GitHub public nommé `neocanuts` et se déploie sur
GitHub Pages à chaque push sur `main`.

**Dépôt** : créé depuis le dossier local après le premier commit, avec
`gh repo create neocanuts --public --source=. --remote=origin --push`.
Branche unique `main`. Le dossier local peut garder son nom actuel
`luddistes`, seul le dépôt distant s'appelle `neocanuts`.

**Workflow** `.github/workflows/deploy.yml` :

- Déclenché par un push sur `main` et à la main (`workflow_dispatch`).
- Travail `build` : checkout, `actions/setup-node` en Node 20 avec cache npm,
  `npm ci`, `npm run check`, `npm run build` avec `PATH_PREFIX=/neocanuts/`,
  puis `actions/upload-pages-artifact` sur `_site`.
- Travail `deploy` : `actions/deploy-pages`, avec les permissions
  `pages: write` et `id-token: write`.
- Source Pages réglée sur « GitHub Actions » dans les paramètres du dépôt
  (`gh api` ou interface).

**Adresse** : `https://<compte>.github.io/neocanuts/`. Un domaine personnalisé
est hors v1 ; s'il arrive, `PATH_PREFIX` repasse à `/`.

**Licences** : code MIT ; textes cités dans le domaine public ou en citation
courte sur la frise, chapitres entiers sur les pages longues (voir Pages
longues) ; traductions Néocanuts en CC BY-SA 4.0. Fichier `LICENSE` pour le
code, mention des deux autres dans le colophon et le README.

## Plan de travail

Cinq étapes, chacune livrée et vérifiable avant la suivante. Le corpus se
construit par lots de dix pour que le site soit lisible tôt.

1. **Squelette.** Initialiser npm et Eleventy, écrire le gabarit, la feuille
   de style et les trois fichiers de données, créer trois entrées d'essai
   réellement vérifiées (Zhuangzi, une lettre luddite, Bernanos), brancher la
   validation. Critère : `npm run dev` affiche une page correcte à 360 px et à
   1440 px, en clair et en sombre.
2. **Dépôt et déploiement.** Premier commit, création du dépôt, workflow,
   activation de Pages. Critère : l'adresse publique répond avec les trois
   entrées.
3. **Corpus.** Pour chaque candidat de la liste ci-dessous : trouver la source
   en ligne, vérifier mot à mot, écrire la notice, l'extrait, l'original et
   les références, lancer `npm run check`. Un commit par lot de dix, dans
   l'ordre chronologique. Critère : quarante entrées au moins, aucune sans
   `source_url` ni `verifie`.
4. **Absents, colophon, README.** Section des absents avec la raison de chaque
   exclusion, colophon avec licences et méthode, README qui explique comment
   ajouter une entrée.
5. **Revue finale.** Relecture typographique, vérification des liens externes,
   validation HTML, Lighthouse mobile, lecture au lecteur d'écran VoiceOver
   sur deux entrées.

Mathieu ajuste la liste des auteurs à tout moment, par un commentaire sur le
doc ou directement dans le dépôt.

## Hors périmètre v1

Ces idées sont notées pour ne pas être perdues, mais rien ne doit être
construit pour les préparer.

- Pages individuelles par auteur au-delà des pages longues (biographie,
  bibliographie).
- Filtre par thème : le mot-clé est affiché mais pas cliquable.
- Recherche plein texte.
- Bascule manuelle clair/sombre.
- Portraits ou toute image.
- Commentaires, lettre d'information, flux RSS.
- Interface en d'autres langues que le français.
- Domaine personnalisé.
- Interface d'édition : on ajoute une entrée en écrivant un fichier Markdown.

## Pages longues

Chaque paragraphe de la frise devient un lien vers une page qui donne le
chapitre entier dont il est extrait, avec le passage cité mis en évidence.
Décidé le 14 octobre 2026, en dix questions ; le travail se fait sur une
branche et part en ligne d'un coup.

| # | Question | Décision |
| --- | --- | --- |
| 1 | Quel texte long | Un passage élargi de la même œuvre que l'extrait |
| 2 | Publication | Tout en ligne, auteurs sous droits compris (choix assumé de Mathieu) ; la règle 8 est révisée |
| 3 | Longueur | Le chapitre entier, sans plafond |
| 4 | Source | Recherche en ligne par Claude, en français ou dans l'original, vérifiée mot à mot par `npm run verify` |
| 5 | Repérage | La page s'ouvre au début du chapitre ; passage cité mis en évidence ; lien « Aller au passage cité » en haut |
| 6 | Langue | Traduction publiée si elle existe, sinon traduction Néocanuts du chapitre « à relire par Mathieu » ; bascule vers l'original |
| 7 | Clic sur la frise | Tout le paragraphe est un lien |
| 8 | Mise en place | Tout d'un coup, quand les 58 entrées sont traitées |
| 9 | Chapitre introuvable | L'entrée reste sur la frise, non cliquable, et figure dans la liste des pages manquantes |
| 10 | Contenu de la page | En-tête, repères, pied de source et navigation ci-dessous |

**Sources.** Claude cherche le chapitre lui-même : Wikisource, Gallica,
Gutenberg, archive.org, ctext.org, Perseus, zeno.org, marxists.org, sites
d'auteurs, d'éditeurs ou de revues. Aucune bibliothèque pirate ni dépôt de
scans illicites. Le texte est copié depuis `node scripts/texte.js <url>`,
jamais retapé. Si seul l'original est trouvé, le français est une traduction
Néocanuts faite depuis cet original.

**Fichier d'un chapitre.** `src/chapitres/<slug>.md`, même slug que l'entrée.
En-tête YAML : `chapitre` (titre affiché, par exemple « Lettre XC »),
`source_url` (où le français a été vérifié), `original_url`, `traduction`
(« traduction Néocanuts, à relire » le cas échéant), `verifie` (date). Corps :
le chapitre en français, en Markdown. L'original va dans
`src/chapitres/<slug>.original.md`, inutile si `langue: fr`. Les métadonnées
d'auteur et d'œuvre restent dans l'entrée et ne sont pas recopiées.

**Passage cité.** Aucun balisage manuel : le build retrouve le paragraphe de
la frise dans le chapitre, après la normalisation de `verify`, et l'enveloppe
dans un `<mark>` avec l'ancre `#passage`. Paragraphe introuvable dans le
chapitre = build en échec. C'est ce qui garantit que la frise et la page
longue disent la même chose.

**Pages manquantes.** `src/_data/pages_manquantes.json` liste les slugs sans
chapitre et la raison (« chapitre non publié en ligne », « édition en ligne
différente de l'extrait »…). `npm run check` exige que chaque entrée ait un
chapitre ou figure dans cette liste, jamais les deux.

**Sur la frise.** Quand un chapitre existe, le `<blockquote>` de l'extrait est
enveloppé dans un lien vers `<slug>/`, souligné au survol, avec un intitulé
accessible « Lire le chapitre : <œuvre> ». La bascule de l'original reste hors
du lien. Sans chapitre, rien ne change.

**La page longue.**

- Adresse : `/neocanuts/<slug>/`.
- En-tête : nom et dates de l'auteur, œuvre, chapitre, année, puis la notice
  de l'entrée.
- Repères : lien « Aller au passage cité » (`#passage`), bascule français /
  original, mention de la traduction.
- Corps : colonne de lecture étroite (environ 65 caractères), typographie et
  couleurs du site.
- Pied : source précise et lien, date de vérification, lien vers le texte
  intégral.
- Navigation : « ← Retour à la frise » vers `/neocanuts/#<slug>`, et auteur
  précédent / suivant dans l'ordre chronologique, parmi les entrées qui ont
  une page.

**Vérification.** `npm run verify <slug>` contrôle aussi le chapitre : le
français contre `source_url`, l'original contre `original_url`. Comme pour la
frise, une traduction Néocanuts n'est contrôlée que côté original.
`npm run links` et `npm run validate` couvrent les nouvelles pages.

**Mise en place.** Branche `pages-longues`. On commence par le gabarit, le
lien sur la frise et les contrôles, sur trois entrées d'essai (Zhuangzi, le
Général Ludd, Bernanos). On traite ensuite le corpus par lots de dix dans
l'ordre chronologique, un commit par lot. Fusion dans `main` quand les 58
entrées ont un chapitre ou figurent dans les pages manquantes, et que `check`,
`verify`, `build` et `validate` passent. Restent à Mathieu : relire les
traductions Néocanuts des chapitres.

**Avancement.** Le 14 octobre 2026, à la demande de Mathieu, le gabarit a
été essayé sur les cinq premières entrées dans l'ordre chronologique
(Platon, Laozi, Zhuangzi, Sénèque, Plutarque) plutôt que sur les trois
entrées d'essai. Choix faits à l'implémentation :

- `npm run check` signale les entrées encore à traiter sans échouer ;
  `npm run check -- --complet` en fait des erreurs et sert de condition de
  fusion.
- L'original du chapitre est lui aussi contrôlé : il doit contenir
  l'original de la frise, mis en évidence de la même façon (`#passage-original`).
- La bascule français / original se fait sans script, par l'ancre
  `#original` (`:target`).
- Sur la frise, l'intitulé « Lire le chapitre : <œuvre> » est un texte
  visuellement masqué au début du lien, et non un `aria-label`, qui aurait
  caché l'extrait aux lecteurs d'écran.
- Le Phèdre n'a pas de chapitres : la page longue donne la fin du dialogue,
  de 274b à 279c (la critique de l'écriture). Pour Plutarque, le chapitre 14
  correspond à quatre paragraphes de Pierron, qui ne numérote pas.
- Les notes des traducteurs (Julien, Wieger, Baillard) ne sont pas reprises.

## Candidats au corpus

Soixante-dix candidats de mémoire, à vérifier un par un ; la cinquantaine
retenue sortira de ceux qui passent la règle de rigueur. Le statut de droits
est estimé à partir de l'année de mort (70 ans, règle française) et les pistes
de sources sont des points de départ, pas des garanties.

**Antiquité**

| Auteur | Texte (année) | Langue | Où vérifier | Statut |
| --- | --- | --- | --- | --- |
| Laozi | Daodejing, ch. 80, les instruments qu'on n'utilise pas (IVe s. av. J.-C.) | zh | trad. Stanislas Julien 1842 sur Wikisource ; ctext.org | Domaine public, traduction libre en ligne |
| Zhuangzi | Ch. 12 « Ciel et Terre », le jardinier de Han Yin refuse le puits à balancier (IVe s. av. J.-C.) | zh | trad. Léon Wieger 1913 sur Wikisource ; ctext.org | Domaine public, traduction libre en ligne ; incontournable |
| Platon | Phèdre, 274c–275b, le mythe de Theuth et l'écriture (v. 370 av. J.-C.) | grc | trad. Cousin ou Chambry sur Wikisource ; Perseus | Domaine public, traduction libre en ligne |
| Sénèque | Lettres à Lucilius, 90, les inventions ne sont pas l'œuvre des sages (v. 64) | la | trad. Baillard sur Wikisource ; thelatinlibrary.com | Domaine public, traduction libre en ligne |
| Plutarque | Vie de Marcellus, 14, Platon reproche à Archytas et Eudoxe la mécanique (v. 100) | grc | trad. Ricard sur Wikisource ; Perseus | Domaine public, traduction libre en ligne |
| Qohélet | Ecclésiaste 7, 29, « ils ont cherché beaucoup de détours » (IIIe s. av. J.-C.) | he | Segond ou Crampon sur Wikisource | Domaine public ; marginal, à discuter |

**Renaissance et âge classique**

| Auteur | Texte (année) | Langue | Où vérifier | Statut |
| --- | --- | --- | --- | --- |
| Élisabeth Ire | Réponse rapportée à William Lee et son métier à tricoter (1589) | en | aucune source primaire connue | Douteux, exclu sauf comme tradition rapportée |
| Pascal | Pensées, fragment sur Descartes, « composer la machine, cela est ridicule » (v. 1660) | fr | Wikisource, éd. Brunschvicg | Domaine public |
| Jonathan Swift | Voyages de Gulliver, III, l'Académie de Lagado (1726) | en | trad. Desfontaines 1727 sur Wikisource ; Gutenberg | Domaine public, traduction libre en ligne |
| Rousseau | Discours sur l'origine de l'inégalité, 2e partie, métallurgie et agriculture (1755) | fr | Wikisource | Domaine public |
| Schiller | Lettres sur l'éducation esthétique, lettre VI, l'homme rouage (1795) | de | Wikisource de ; trad. Régnier 1859 sur Gallica | Domaine public, traduction libre probable |
| Novalis | La Chrétienté ou l'Europe, le moulin qui se moud lui-même (1799) | de | zeno.org | Domaine public, traduction maison |

**1800–1850**

| Auteur | Texte (année) | Langue | Où vérifier | Statut |
| --- | --- | --- | --- | --- |
| William Blake | Jérusalem, planche 65, les arts de la vie changés en arts de la mort (1804–1820) | en | Blake Archive | Domaine public, traduction maison |
| Wordsworth | The Excursion, livre VIII, les manufactures (1814) | en | Gutenberg | Domaine public, traduction maison |
| « Général Ludd » | Lettre aux patrons de Huddersfield (1812) | en | Binfield, Writings of the Luddites ; marxists.org | Domaine public, traduction maison ; incontournable, source en ligne à trouver |
| Lord Byron | Discours à la Chambre des lords contre le Frame Work Bill (27 février 1812) | en | Hansard en ligne ; Wikisource en | Domaine public, traduction maison |
| Mary Shelley | Frankenstein (1818) | en | trad. Saladin 1821 sur Wikisource | Domaine public ; marginal, création plus que machine |
| Goethe | Les Années de voyage de Wilhelm Meister, III, 13, le machinisme qui gagne (1829) | de | zeno.org ; trad. Porchat sur Gallica | Domaine public, traduction libre probable |
| Thomas Carlyle | « Signs of the Times », l'Âge mécanique (1829) | en | Wikisource en | Domaine public, traduction maison |
| L'Écho de la Fabrique | Articles des canuts sur les « mécaniques » (1831–1834) | fr | echo-fabrique.ens-lyon.fr | Domaine public, source en ligne ; incontournable |
| Leopardi | Palinodie au marquis Gino Capponi (1835) | it | Wikisource it | Domaine public, traduction maison, vers |
| Alfred de Vigny | « La Maison du berger », le taureau de fer (1844) | fr | Wikisource | Domaine public |
| John Stuart Mill | Principes d'économie politique, IV, 6, les inventions n'ont allégé le labeur de personne (1848) | en | Gutenberg ; trad. Dussard et Courcelle-Seneuil 1861 sur Gallica | Domaine public, traduction libre à vérifier |

**1850–1900**

| Auteur | Texte (année) | Langue | Où vérifier | Statut |
| --- | --- | --- | --- | --- |
| Ruskin | Les Pierres de Venise, « La nature du gothique » (1853) | en | Gutenberg ; trad. Crémieux 1906 sur Gallica | Domaine public, traduction libre à vérifier ; incontournable |
| Thoreau | Walden, « Économie », le chemin de fer qui nous monte dessus (1854) | en | trad. Fabulet 1922 sur Wikisource ; Gutenberg | Domaine public, traduction libre en ligne ; incontournable |
| Dickens | Les Temps difficiles, Coketown (1854) | en | Wikisource fr ; Gutenberg | Domaine public, traduction libre à vérifier |
| Eugène Huzar | La Fin du monde par la science (1855) | fr | Gallica ; archive.org | Domaine public |
| Herman Melville | « The Tartarus of Maids », la papeterie (1855) | en | Gutenberg | Domaine public, traduction maison ; optionnel |
| Baudelaire | Fusées, XXII, « la mécanique nous aura tellement américanisés » (v. 1862) | fr | Wikisource | Domaine public |
| Marx | Le Capital, I, ch. XV « Machinisme et grande industrie » (1867) | de | trad. Roy 1872 sur Wikisource ; marxists.org | Domaine public ; ambivalent, à discuter |
| Samuel Butler | Erewhon, « Le Livre des machines » (1872) ou « Darwin among the Machines » (1863) | en | Gutenberg | Domaine public, traduction maison (Larbaud sous droits jusqu'en 2028) ; incontournable |
| Nietzsche | Le Voyageur et son ombre, § 218 « La machine comme institutrice » (1880) | de | trad. Henri Albert sur Wikisource | Domaine public, traduction libre en ligne |
| William Morris | « Useful Work versus Useless Toil » (1884) ou Nouvelles de nulle part (1890) | en | marxists.org ; Gutenberg | Domaine public, traduction maison |
| Tolstoï | Que devons-nous faire ? (1886) | ru | trad. Bienstock sur Wikisource ; ru.wikisource | Domaine public, traduction libre à vérifier |

**1900–1945**

| Auteur | Texte (année) | Langue | Où vérifier | Statut |
| --- | --- | --- | --- | --- |
| Bergson | L'Évolution créatrice (1907) ou Les Deux Sources, le « supplément d'âme » (1932) | fr | classiques.uqac.ca ; Wikisource | Domaine public |
| Gandhi | Hind Swaraj, ch. XIX « Machinery » (1909) | en | archive.org ; gandhiheritageportal.org | Domaine public, traduction maison |
| E. M. Forster | « The Machine Stops » (1909) | en | archive.org | Sous droits en France (mort 1970), citation courte, traduction maison |
| Charles Péguy | L'Argent, le travail d'avant (1913) | fr | Wikisource | Domaine public |
| Rilke | Sonnets à Orphée, I, 18 et II, 10, la machine (1922) | de | Wikisource de | Domaine public, traduction maison, vers |
| G. K. Chesterton | The Outline of Sanity (1926) | en | Gutenberg Australia | Domaine public, traduction maison |
| D. H. Lawrence | « The Triumph of the Machine » (1929) | en | à trouver | Domaine public, traduction maison, à vérifier |
| Georges Duhamel | Scènes de la vie future (1930) | fr | aucune source libre connue | Sous droits (mort 1966), probablement exclu |
| Freud | Malaise dans la civilisation, III, le « dieu prothétique » (1930) | de | Gutenberg-DE ; archive.org | Domaine public, traduction maison ; ambivalent |
| Spengler | L'Homme et la Technique (1931) | de | Gutenberg-DE ; archive.org | Domaine public, traduction maison |
| Ortega y Gasset | Méditation sur la technique (1933) | es | à trouver | Domaine public depuis 2026, à vérifier |
| Simone Weil | Réflexions sur les causes de la liberté et de l'oppression sociale (1934) ou La Condition ouvrière | fr | classiques.uqac.ca | Domaine public, source en ligne ; incontournable |
| Orwell | Le Quai de Wigan, ch. 12, le culte de la machine (1937) | en | Gutenberg Australia ; orwell.ru | Domaine public dans l'UE, traduction maison |
| Walter Benjamin | Sur le concept d'histoire, thèses IX et XI (1940) | de | archive.org | Domaine public, traduction maison ; marginal |

**1945–1980**

| Auteur | Texte (année) | Langue | Où vérifier | Statut |
| --- | --- | --- | --- | --- |
| Bernanos | La France contre les robots (1947) | fr | Wikisource ou sites de réédition | Domaine public depuis 2019, source à vérifier ; incontournable |
| Heidegger | La Question de la technique (1953) | de | aucune source libre connue | Sous droits, probablement exclu |
| Ellul | La Technique ou l'enjeu du siècle (1954), ou un article | fr | site de l'association Ellul, archives de presse | Sous droits, chercher un texte publié en ligne par les ayants droit ; incontournable |
| Anders | L'Obsolescence de l'homme (1956), « Thèses pour l'âge atomique » | de | à trouver | Sous droits, probablement exclu ; incontournable |
| Arendt | Condition de l'homme moderne, prologue (1958) | en | aucune source libre connue | Sous droits, probablement exclu |
| Lanza del Vasto | Les Quatre Fléaux (1959) | fr | à trouver | Sous droits, optionnel |
| Mumford | Le Mythe de la machine (1967) ou Technics and Civilization (1934) | en | archive.org en prêt | Sous droits, citation courte, traduction maison |
| Charbonneau | Le Jardin de Babylone (1969), Le Système et le Chaos (1973) | fr | site La Grande Mue | Sous droits, à vérifier |
| Illich | La Convivialité (1973), Énergie et équité (1973) | en, fr | à trouver | Sous droits, à vérifier ; incontournable |
| E. F. Schumacher | Small is Beautiful (1973) | en | à trouver | Sous droits, optionnel |
| Pasolini | Écrits corsaires, la mutation anthropologique (1973–1975) | it | archives du Corriere della Sera | Sous droits, citation courte, traduction maison |
| Jerry Mander | Four Arguments for the Elimination of Television (1978) | en | à trouver | Sous droits, optionnel |

**Depuis 1980**

| Auteur | Texte (année) | Langue | Où vérifier | Statut |
| --- | --- | --- | --- | --- |
| Langdon Winner | « Do Artifacts Have Politics? » (1980) | en | PDF universitaire en ligne | Sous droits, citation courte |
| Wendell Berry | « Why I Am Not Going to Buy a Computer » (1987) | en | Harper's et réimpressions en ligne | Sous droits, citation courte, traduction maison |
| Chellis Glendinning | « Notes toward a Neo-Luddite Manifesto » (1990) | en | Utne Reader en ligne | Sous droits, citation courte |
| Neil Postman | Technopoly (1992) | en | archive.org | Sous droits, optionnel |
| Theodore Kaczynski | La Société industrielle et son avenir (1995) | en | theanarchistlibrary.org en français et en anglais ; Washington Post | Texte largement publié en ligne ; incontournable |
| Kirkpatrick Sale | Rebels Against the Future (1995) | en | à trouver | Sous droits, optionnel |
| Jaime Semprun | L'Abîme se repeuple (1997) | fr | à trouver | Sous droits, à vérifier |
| Nicholas Carr | « Is Google Making Us Stupid? » (2008) | en | theatlantic.com | Texte publié en ligne, optionnel |
| Pièces et Main d'Œuvre | Aujourd'hui le nanomonde (2008) ou Manifeste des chimpanzés du futur (2017) | fr | piecesetmaindoeuvre.com | Texte publié en ligne par l'auteur ; incontournable |
| Groupe Marcuse | La Liberté dans le coma (2013) | fr | lundi.am ou site de l'éditeur | Sous droits, à vérifier |
| Pape François | Laudato si', § 106–114, le paradigme technocratique (2015) | la, it | vatican.va en français | Texte publié en ligne |
| Célia Izoard | Articles dans Reporterre (2016–2024) | fr | reporterre.net | Texte publié en ligne |

**Pistes non listées** : rien entre Sénèque et Pascal ; chercher un texte
médiéval (statut de corporation, chroniqueur, moraliste) pour ne pas laisser un
trou de quinze siècles.
