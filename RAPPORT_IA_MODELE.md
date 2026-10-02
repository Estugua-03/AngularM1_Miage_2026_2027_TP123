# Rapport d'usage de l'IA — TP1, TP2, TP3

Date : 2 octobre 2026. Un seul agent Codex (GPT-6), accès workspace/terminal ; aucun sous-agent. [Prompt initial intégral réellement reçu](docs/PROMPT_INITIAL.md). Aucune affirmation sur les acquis personnels du binôme : la section humaine reste à compléter.

## État initial, instructions et périmètre

Dépôt trouvé dans `AngularM1_Miage_2026_2027_TP123/` (le dossier parent n'est pas un dépôt). Git propre sur main, commit 91f27e4 ; `original` local/distant = 3d1080c5d73fa3146799b0918ae325c983d454bc, dernier commit de l'enseignant micbuffa. Le commit personnel initial modifie uniquement les deux lockfiles. `git ls-remote --heads origin` confirme main/original. Origin : dépôt Estugua-03/AngularM1_Miage_2026_2027_TP123, propriété personnelle confirmée par « Oui et oui. » (la même réponse confirme health 200 **par l'utilisateur**).

Lus avant modification : README.md, les trois SUJET_ETUDIANT_TP*.md, API_CONTRACT.md, CONSEILS_POUR_UTIISER_ASSISTANT_AI.md, ce rapport initial, ATLAS_SETUP.md ; frontend-starter et backend : AGENTS.md, best-practices.md, CLAUDE.md, GEMINI.md. Aucun AGENTS ancêtre trouvé par les recherches ciblées. Lus : package.json, angular.json, tsconfig*.json, proxy.conf.json, gitignore, tous les composants/services/modèles/guard/intercepteur du starter ; backend/src/app.js, server.js, models/User.js, models/Track.js, test/api.test.js. Seul fichier de configuration d'environnement consulté : **backend/.env.example**, jamais le .env réel.

Versions installées au départ : Node 24.21.0, npm 11.19.0 ; Angular core/common/forms/router/compiler/platform-browser/compiler-cli 22.1.4, CLI/build 22.1.6, TypeScript 6.0.3, RxJS 7.8.2, tslib 2.8.1, Vitest 4.1.11. Backend : bcryptjs 3.0.3, cors 2.8.6, Express 5.2.1, jsonwebtoken 9.0.3, Mongoose 9.9.4, Multer 2.3.0 (`npm.cmd ls --depth=0`).

Commandes disponibles : frontend `npm.cmd start`, `npm.cmd run build`, `npm.cmd test` ; backend `npm.cmd start`, `npm.cmd run start:local`, `npm.cmd test`. Fonctionnalités déjà présentes inspectées, sans présumer leur succès navigateur : login/register/profile/update avec HttpClient et tap, Signals token/currentUser, guard de présence, pagination serveur et FormData audio/title, Blob et révocation à remplacement. Manques : 401 central, logout UI, validation et feedback, profil automatique, validation upload, erreurs/chargement, révocation finale, suppression/progression, suite frontend.

Plan communiqué avant édition : [checklist](docs/CHECKLIST_TP.md), [login annoté](docs/FLUX_LOGIN.md), corrections ciblées TP1 puis TP2 puis TP3, vérifications et snapshots successifs. Backend et contrat restent inchangés ; extensions facultatives exclues.

## TP1 — mission 0 : cartographie

**Objectif / prompt réel** : prompt initial, « Produce a checklist of mandatory requirements and the annotated login flow required by TP1 ». Aucun prompt intermédiaire inventé.
**Consultés** : documents et code listés ci-dessus, en particulier main.ts, routes.ts, app.ts, login-page.ts/html, auth.service.ts, auth.interceptor.ts, auth.guard.ts, backend app.js/User.js.
**Modifiés** : docs/CHECKLIST_TP.md, docs/FLUX_LOGIN.md, docs/PROMPT_INITIAL.md, docs/VERIFICATIONS_MANUELLES.md et ce rapport.
**Résultat** : chemin composant → service → HttpClient → Express → modèle → MongoDB tracé, routes publiques/privées identifiées, Signal versus localStorage expliqué. La cartographie a précédé l'édition du code.
**Preuve** : [schéma et explications](docs/FLUX_LOGIN.md). Aucun screenshot réseau fabriqué.

## TP1 — mission 1 : utilisateurs

**Objectif / prompt réel** : prompt initial, exigences TP1, architecture et gestion 401. Plan : compléter les pages/services existants, conserver API.
**Consultés** : login/register/profile/app (ts/html/css), auth.service.ts, auth.interceptor.ts, auth.guard.ts, modèles auth/user, User.js (nom trim/minlength 2), endpoints register/login/users/me de app.js, configs build/test.
**Modifiés** (préfixe frontend-starter/) :
- src/app/components/login-page/login-page.ts et .html : submit() valide, bloque double clic, états Signals, finalize et annulation à destruction, navigation, erreurs visibles, aucun mot de passe de démonstration prérempli.
- src/app/components/register-page/register-page.ts et .html : mêmes états, nom après trim ≥ 2, email, password ≥ 8, redirection profil.
- src/app/components/profile-page/profile-page.ts et .html : load() à ouverture, GET serveur, save() PUT, validation, feedback et blocage pendant requêtes.
- src/app/components/app/app.ts et .html : logout(), navigation selon session, nettoyage local et retour login.
- src/app/shared/services/auth.service.ts : réutilisation login/register/profile/update ; tap profil protégé contre une réponse d'une session devenue obsolète.
- src/app/shared/interceptors/auth.interceptor.ts : Bearer uniquement /api/users et /api/tracks ; 401 privé → logout/navigate ; erreur retransmise ; 401 public de login non intercepté comme expiration.
- src/app/shared/utils/http-error-message.ts et validators/name.validator.ts : messages sûrs selon statut, validation alignée Mongoose.
- src/app/shared/services/auth.service.spec.ts ; components/login-page/login-page.spec.ts : assertions sur contrat et états simulés.
- src/styles.css ; angular.json ; tsconfig.app.json ; tsconfig.spec.json ; .gitignore ; package.json/package-lock.json : focus/fieldset/accessibilité, isolation tests, jsdom ajouté.

**Flux** : submit() → AuthService.login()/register() → POST HttpClient → routes Express publiques → tap storeAuthentication() → localStorage et currentUser → navigation. load()/save() profil → profile()/update() → GET/PUT /api/users/me → intercepteur Bearer → middleware auth + Mongoose → tap currentUser. Voir [détail](docs/FLUX_LOGIN.md).

**Erreurs réellement rencontrées / résolution** :
1. Commandes Git au dossier parent : « not a git repository » ; utilisation du sous-dossier correct.
2. Sortie Get-Content initialement mal décodée ; relecture UTF-8 des contenus pertinents.
3. npm.ps1 bloqué par ExecutionPolicy ; npm.cmd, aucune modification de la politique.
4. Build sandbox : Access is denied sur résolution des répertoires ; relance autorisée hors sandbox → succès.
5. Test initial : DOM environment absent ; installation jsdom. Premier install réseau EACCES sandbox, relance autorisée hors sandbox.
6. ng test après jsdom : configuration gpc:build:development inexistante ; options test buildTarget gpc:build et tsconfig.spec.json.
7. Une tentative apply_patch delete/add du même chemin a été rejetée sans modification ; réécriture limitée des fichiers visés en UTF-8.
8. git ls-remote réseau sandbox refusé ; relance autorisée hors sandbox, main/original confirmés.
9. npm install a signalé 6 advisories (2 moderate, 2 high, 2 critical) et avertissements install-scripts. Aucun `npm audit fix` aveugle ni changement global de versions : liste non analysée ici, résultats build/tests consignés séparément.

**Vérifications automatisées observées** :
- `frontend-starter: npm.cmd run build` : code 0, bundle 299,04 kB. [Sortie réelle](evidence/tp1/tp1-build.txt).
- `frontend-starter: npm.cmd test` : code 0, **8 tests / 2 fichiers réussis**. [Sortie réelle](evidence/tp1/tp1-frontend-tests.txt).
- `backend: npm.cmd test` : code 0, **2 tests réussis**, health sans MongoDB et schémas. [Sortie réelle](evidence/tp1/tp1-backend-tests.txt).

Attendus/observés simulés : login POST/corps/session ; register POST 201 ; profil GET puis PUT/Bearer/currentUser ; 401 privé y compris Blob → logout/login ; 401 public sans nettoyage indu ; pas de Bearer externe ; guard UrlTree login puis logout ; composant invalide sans HTTP puis échec visible et anti-double envoi. Tous passent. Aucun backend/MongoDB utilisé par la suite frontend.

**Navigateur réel retrouvé après demande de l'utilisateur** : prompt supplémentaire réel « Peux tu trouver un moyen pour avoir accé à un navigateur ? ». Inventaire CUA vide ; Chrome trouvé à son chemin d'installation Windows ; @playwright/test 1.63.0 ajouté et playwright.config.ts/browser-tests/tp1.spec.ts créés. L'utilisateur a démarré le backend et autorisé explicitement « Oui, tests jetables autorisés ». Aucun .env ni JWT réel consulté par l'agent. Traces/HAR/vidéo/captures automatiques désactivés pour éviter les secrets. Le script n'enregistre que méthode, chemin et statut.

Chrome réel + API réelle : formulaire vide et guard, login refusé 401/accepté 200, GET profil 200, PUT profil 200 (nom demo restauré), JWT factice invalide → GET 401 puis login, logout ; inscription du compte jetable → 201 puis doublon → 409. Le compte reste dans Atlas comme annoncé. [Relevé HTTP réel](evidence/tp1/network-auth.json), [capture du relevé expurgé](evidence/tp1/network-auth.png), [formulaire réel](evidence/tp1/login-validation.png), [statuts inscription](evidence/tp1/registration-statuses.json). La capture Network est celle d'un relevé Playwright, **pas une capture DevTools**. Une expiration naturelle après 2 h n'a pas été attendue ; le traitement d'un 401 est testé et le backend vérifie exp dans jwt.verify(). Les étapes [manuelles](docs/VERIFICATIONS_MANUELLES.md) permettent de reproduire les contrôles et de compléter une capture DevTools si demandée à la soutenance.

## TP2 — mission 2 : bibliothèque paginée

**Prompt réel** : prompt initial, « Complete TP1, then TP2, then TP3 », pagination serveur et architecture imposée. Aucun nouveau prompt métier ; reprise séquentielle après commit/push TP1.
**Consultés** : sujet TP2, API_CONTRACT, consignes frontend, tracks-page.ts/html/css, TrackService.list(), modèles Track/Page, route GET tracks dans backend/src/app.js. **Modifiés** : frontend-starter/src/app/components/tracks-page/tracks-page.ts/html/css, tracks-page.spec.ts, browser-tests/tp2.spec.ts, docs/FLUX_AUDIO.md, checklist et rapport.
**Plan / résultat** : réutiliser list(page,limit), expliciter erreur Signal et bornes, annuler une liste obsolète ; chaque go() appelle load(page) → service → HttpClient GET page/limit → Mongoose skip/limit + count. @if loading, @for track.id, @empty seulement hors chargement/erreur. Cards sémantiques, boutons nommés et focus conservés.
**Preuves** : GET page=1 puis page=2 puis page=1 réellement observés dans [relevé](evidence/tp2/network-library.json) et [capture du relevé](evidence/tp2/network-library.png), [desktop/lecteur](evidence/tp2/player.png), [mobile](evidence/tp2/library-mobile.png). Les captures ont été inspectées ; champ fichier contenu dans la card après une correction CSS ciblée. Aucune option paginator Material ou plugin Mongoose.

## TP2 — mission 3 : upload et lecture

**Prompt réel** : prompt initial, réutiliser le mécanisme existant, vérifier validation/authenticated Blob/ObjectURL playback and cleanup. **Consultés** : mêmes fichiers, TrackService.upload()/audio(), authInterceptor, MIME/limite Multer/upload.single/audio/title/sendFile dans app.js. **Modifiés en plus** : shared/validators/audio-file.validator.ts et .spec.ts. TrackService et backend inchangés à ce stade.
**Résultat** : choose() valide MIME et taille, upload() revalide ; Reactive Form relié à ngSubmit ; Signals uploading/uploadError/uploadSuccess et finalize ; pas de double requête ; contrôles désactivés ; reset fichier/titre et load(1). play() annule l'ancien GET, Blob → ObjectURL → audio ; stopAudio() et ngOnDestroy() révoquent ; erreur réseau ou décodage expliquée, titre courant visible. [Flux et réponses aux cinq questions mémoire](docs/FLUX_AUDIO.md).
**Erreurs / corrections** : première exécution Chrome expirée à 60 s en attente du POST : form sans FormGroup ne déclenchait pas ngSubmit. Ajout uploadForm/[formGroup], test renforcé pour déclencher le submit DOM. Relance : succès. Avertissements HMR temporaires DatePipe/DecimalPipe inutilisés pendant l'écriture des fichiers ; aucun dans le build final. Capture desktop révélant champ fichier hors card : width:100%/min-width:0 et align-self:start, vérification de bornes dans Chrome, nouvelles captures. Aucun contournement de la validation backend.
**Vérifications attendues/observées** : 14 tests frontend passent (8 régressions TP1 + pagination, formulaire multipart/anti-double/reset, erreur liste, annulation/révocations Blob, deux validations taille/MIME). Chrome/API : six pistes jetables créées avec song1.mp3, POST 201 et reload ; lecture Blob 200, currentTime > 0, mobile sans débordement ; MIME multipart volontairement altéré dans le test → vrai serveur 400 ; second compte jetable → audio d'autrui 404. Pour afficher le bouton avec l'id d'autrui, seule la liste de ce scénario a été injectée par Playwright ; la requête audio et son contrôle propriétaire sont réels. Les comptes créés pour TP1 et TP2 restent dans Atlas, autorisés ; leurs mots de passe aléatoires ne sont pas conservés. Les [métadonnées des six pistes test](evidence/tp2/fixture-tracks.json) serviront au nettoyage TP3, sans toucher aux données existantes.
**Commandes / preuves** : frontend npm.cmd run build → code 0, 319,27 kB ([log](evidence/tp2/tp2-build.txt)); npm.cmd test → 14/14 ([log](evidence/tp2/tp2-frontend-tests.txt)); backend npm.cmd test → 2/2 ([log](evidence/tp2/tp2-backend-tests.txt)); npx.cmd playwright test browser-tests/tp2.spec.ts → scénario intégration réussi ([log](evidence/tp2/tp2-browser-tests.txt)); contrôle final layout seul après CSS, sans nouveau compte/upload → succès ([log](evidence/tp2/tp2-layout-tests.txt)). Ces tests navigateur ont été exécutés séparément : pas de prétention à une suite entière en une seule commande. Validation réelle multi-formats et attente de 2 h pour expiration restent reproductibles selon le guide manuel ; six MIME/limite exacte sont testés en simulation.

## TP3 — mission 5 : suppression

**Prompt réel** : prompt initial, suppression avec confirmation/SnackBar, conservation backend/API. Autorisation réelle supplémentaire : « Oui, tests jetables autorisés ». **Consultés** : SUJET TP3/contrat/consignes, tracks-page.ts/html/css, TrackService, routes DELETE/audio/auth dans backend app.js, tests existants. **Modifiés** : frontend-starter/src/app/shared/services/track.service.ts (delete), components/tracks-page/tracks-page.ts/html/css et .spec.ts, browser-tests/tp3.spec.ts, docs/FLUX_TP3.md/ORAL_TP.md, checklist/guide/rapport.
**Résultat** : remove() → confirmation native → verrou deletingId → service.delete() → HttpClient DELETE → intercepteur → auth JWT/filtre ownerId côté Express. 204 → SnackBar, arrêt/révocation de la piste courante, load() ; 403/404/500 → SnackBar erreur et relecture, sans faux succès. load() demande la dernière page valide si le serveur annonce moins de pages. Le backend et le contrat restent intacts. [Explication complète](docs/FLUX_TP3.md).
**Vérifié** : tests simulés annulation sans HTTP, DELETE unique, feedback, ObjectURL libérée, page 2 devenue vide corrigée vers page 1, erreurs 403/404/500. Chrome/API : annulation sans DELETE ; confirmations → 204 ; GET page 2 puis page 1 après suppression de la dernière piste de page 2 ; audio retiré ; piste disparue → 404 et feedback. Seule une liste périmée injectée par Playwright sert à montrer la card disparue : DELETE et refresh sont réels. [Network réel](evidence/tp3/network-delete-upload.json), [capture relevé](evidence/tp3/network-delete-upload.png), [SnackBar succès](evidence/tp3/delete-snackbar.png), [404 et liste vide](evidence/tp3/delete-missing.png). Les captures de SnackBar sont prises durant leur animation d'entrée ; elles constituent des observations, pas des mockups.
**Données de test** : six pistes TP2 + trois uploads de progression successifs (deux relances de test) supprimés par leurs ids autorisés. La dernière exécution réussie consigne sept suppressions 204 et un 404 dans browser-results/network ; les deux premiers essais ont supprimé chacun leur propre piste de progression avant d'échouer. Aucune piste préexistante touchée ; aucun upload runtime committé. Les deux comptes test autorisés demeurent dans Atlas ; mot de passe éphémère non conservé.

## TP3 — mission 6 : progression d'upload

**Prompt réel** : prompt initial, « verify ... upload progress », états/contrôles du sujet TP3. **Consultés** : TrackService.upload(), tracks-page, src/main.ts et types installés @angular/common/types/http.d.ts (withXhr documenté pour upload progress), Material snackbar.mjs/package.json. **Modifiés en plus** : src/main.ts ; src/styles.css (thème SnackBar), package.json/package-lock.json (Material/CDK 22.1.0).
**Résultat** : FormData audio/title conservé ; upload() du service observe events/reportProgress ; main.ts active withXhr() puisque FetchBackend est le défaut Angular 22. Le composant traite UploadProgress et Response distinctement ; pourcentage arrondi loaded/total, indéterminé si total absent ; 100 % n'entraîne pas de succès avant réponse finale. Signals idle/uploading/success/error ; fieldset désactivé, anti-double envoi, retry après erreur. SnackBar pour upload réussi/échoué également.
**Vérifié** : test simulé total connu 25 %, absent, 100 % avant réponse sans faux succès, erreur 400/retour contrôles, retry 201/reset/page 1. Chrome sous limitation réseau (256 Kio/s upload) : [progression réellement visible à 1 %](evidence/tp3/upload-progress.png), contrôles désactivés, POST 201 puis réactivation. [Résultats navigateur](evidence/tp3/browser-results.json) : échantillons observés 0 puis 1, pas une série artificielle jusqu'à 100 ; le 201 prouve la réponse finale.

## TP3 — mission 7 : tests et régressions

**Prompt réel** : prompt initial, au moins trois tests frontend indépendants API/MongoDB, assertions utiles, vérification après chaque étape. **Consultés** : suites TP1/TP2, configs test et exemples HttpTestingController disponibles localement. **Modifiés** : shared/services/track.service.spec.ts ; components/tracks-page/tracks-page.spec.ts. **Résultat** : 22 tests dans cinq fichiers frontend. Contrat login/register/profil, interceptor/guard/session ; TrackService list params, multipart/progression, GET Blob et DELETE ; validation MIME/taille ; UI erreurs/submission DOM/anti-double/cleanup ; suppression confirmée/annulée/403/404/500/page vide ; progression/erreur/retry. Mock SnackBar et HTTP testing : aucune dépendance API/MongoDB. Les deux tests backend d'origine conservés.
**Erreurs réelles et corrections** :
- Glob de chemin rg Windows http*.d.ts/snack-bar*.mjs invalide ; recherche dans le répertoire avec -g ou lecture du chemin exact, aucune modification nécessaire.
- Premier passage unit tests TP3 : 17/22 passent, mock SnackBar racine masqué par les providers du module importé ; overrideComponent retire MatSnackBarModule dans les tests isolés. Une assertion interrompait ensuite la fermeture des requêtes et le teardown, causant des erreurs en cascade ; finally rétablit mocks/reset TestBed même en échec. Relance : 22/22.
- Premier Chrome TP3 : progression et DELETE 204 réellement réussis, puis sélecteur SnackBar ambigu pendant l'animation (ancienne/nouvelle). Sélecteur filtré par texte.
- Deuxième Chrome TP3 : timeout pagination, test tentant Suivant avant le rendu du Signal (bouton encore activé puis devenu désactivé). Synchronisation sur numéro de page et aria-busy, attente de sortie de l'ancienne SnackBar. Troisième exécution complète : succès en 16,1 s.
- Aucune proposition de refonte backend/API ou extension facultative acceptée. Pas de correction automatique globale des advisories npm.

**Commandes finales et observations** : frontend npm.cmd run build → code 0, **473,02 kB** ([sortie](evidence/tp3/tp3-build.txt)); npm.cmd test → **22/22, cinq fichiers**, code 0 ([sortie](evidence/tp3/tp3-frontend-tests.txt)); backend npm.cmd test → **2/2**, code 0 ([sortie](evidence/tp3/tp3-backend-tests.txt)); npx.cmd playwright test browser-tests/tp3.spec.ts → scénario complet réussi ([sortie](evidence/tp3/tp3-browser-tests.txt)); régression Chrome TP1 ciblée sans nouvelle inscription → **2/2** ([sortie](evidence/tp3/tp3-auth-regression.txt)). Aucune erreur JavaScript non gérée (pageerror) dans le scénario TP3. La revue source confirme absence de logging de mots de passe/JWT/objets HTTP dans les pages modifiées ; les échecs HTTP intentionnels 401/400/404 peuvent apparaître dans la console navigateur. Ne pas confondre cela avec une validation exhaustive de tous les logs backend.

**À reproduire personnellement** : attente d'expiration naturelle 2 h, vérification Atlas, autres formats audio réels sur votre navigateur, captures DevTools si exigées et acquis personnels du binôme. [Procédure précise](docs/VERIFICATIONS_MANUELLES.md). Traitement 401, MIME et limite sont couverts aux niveaux indiqués ; aucune preuve ni acquis humain inventé. [Questions d'oral](docs/ORAL_TP.md).

## Restitution à compléter par le binôme

Pour chaque membre : scénarios effectivement vérifiés, acquis qu'il peut expliquer, difficultés restantes. Ces informations ne sont pas connues de l'agent.

Modèle indiqué par l'environnement : GPT-6. La consommation exacte de tokens de cette session n'est pas disponible dans ces outils ; aucun nombre inventé. Le binôme peut relever les données affichées par son outil/compte et comparer les modèles sur des tests représentatifs ; aucune recommandation de tarification ou de modèle non vérifiée n'est ajoutée.

## Git

Travail exclusivement sur main. original existe et reste inchangé. Les snapshots et pushes réalisés seront consignés après chaque étape ; aucun TP n'est annoncé intégralement validé avec une preuve navigateur manquante.

TP1 : commit 290b686, branche TP1 créée sans déplacement d'une branche existante ; git push origin main TP1 réussi vers le dépôt personnel. Premier push sandbox refusé par le réseau ; relance autorisée hors sandbox réussie. Revue de la liste staged, diff code/lockfile, diff --cached --check et inspection des captures avant commit. Aucun backend, contrat, .env, node_modules ou upload runtime inclus.

TP2 : commit 056e374, snapshot TP1+2 créé, git push origin main TP1+2 réussi vers le même origin personnel. Les trois snapshots existants restent intacts pendant TP3.

TP3 : commit **1f91eb3**, snapshot **TP1+2+3** créé, [push main/TP1+2+3 réussi](evidence/git/tp3-push.txt). [Vérification distante après ce push](evidence/git/branches-after-tp3.txt) : original = 3d1080c, TP1 = 290b686, TP1+2 = 056e374, TP1+2+3 = 1f91eb3 ; main = 1f91eb3 à cet instant. État propre, aucun diff des sources/tests backend ou du contrat par rapport à original. Tous les snapshots locaux et distants concordent, aucun force-push ni branche existante déplacée. Revue staged finale et recherche de motifs JWT/URI credential : aucun fichier interdit ni motif sensible détecté ; les captures ont été inspectées.

Cette clôture documentaire (rapport, checklist cochée, preuves Git) est ajoutée ensuite sur **main**, conformément à la poursuite du développement sur main ; les snapshots restent fixés aux commits ci-dessus. Le code TP3 et ses preuves de tests se trouvent déjà dans TP1+2+3. La preuve Git décrit son instant d'observation, sans prétendre contenir le hash du commit qui l'embarque.
