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

## Restitution à compléter par le binôme

Pour chaque membre : scénarios effectivement vérifiés, acquis qu'il peut expliquer, difficultés restantes. Ces informations ne sont pas connues de l'agent.

Modèle indiqué par l'environnement : GPT-6. La consommation exacte de tokens de cette session n'est pas disponible dans ces outils ; aucun nombre inventé. Le binôme peut relever les données affichées par son outil/compte et comparer les modèles sur des tests représentatifs ; aucune recommandation de tarification ou de modèle non vérifiée n'est ajoutée.

## Git

Travail exclusivement sur main. original existe et reste inchangé. Les snapshots et pushes réalisés seront consignés après chaque étape ; aucun TP n'est annoncé intégralement validé avec une preuve navigateur manquante.
