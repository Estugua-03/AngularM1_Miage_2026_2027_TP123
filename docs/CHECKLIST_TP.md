# Checklist obligatoire TP1 → TP2 → TP3

Les cases ne sont cochées qu'après vérification. Les tests HTTP simulés ne constituent pas une preuve Network réelle.

## TP1 — missions 0 et 1

- [x] Lire les sujets, contrat, rapport et instructions des deux projets ; inspecter le starter avant édition.
- [x] Vérifier Git : main propre au départ, original = 3d1080c (enseignant), origin personnel confirmé par l'utilisateur.
- [x] Identifier versions et commandes disponibles (voir rapport).
- [x] Produire le [flux login annoté](FLUX_LOGIN.md).
- [x] Formulaires réactifs validés, inscription/connexion, stockage JWT sans logs, Signal utilisateur, navigation (code et HTTP simulé).
- [x] Déconnexion et nettoyage ; GET/PUT profil ; traitement 401 protégé (HTTP simulé).
- [x] Tests et build ; compte rendu avec preuves automatisées.
- [x] Vérifications Chrome/API réelles et capture du relevé Network expurgé : connexion acceptée/refusée, GET/PUT profil, inscription/409, JWT invalide.

## TP2 — missions 2 et 3 (le sujet ne contient pas de mission 4)

- [x] Pagination serveur page/limit ; Signals tracks/page/pages/loading/error ; @if/@for/@empty ; bornes.
- [x] Validation fichier présent, formats MIME backend et limite 25 × 1024² octets avant HTTP.
- [x] Upload multipart audio/title, chargement, anti-double envoi, erreurs/succès, reset et page 1.
- [x] Cards responsives/accessibles ; morceau courant et erreur audio.
- [x] Blob authentifié, ObjectURL remplacée et révoquée à la destruction ; annulation des requêtes obsolètes.
- [x] Explications mémoire/buffering/streaming, tests/build, rapport/preuves.
- [x] Network réel pagination/upload/lecture ; validation serveur 400 ; accès autre propriétaire refusé.

## TP3 — missions 5 à 7

- [x] DELETE via TrackService après confirmation ; anti-double clic ; SnackBar succès/erreur ; rechargement.
- [x] Ressource disparue/interdite, dernière page vide et piste en lecture supprimée traitées (HTTP simulé et Chrome réel pour 404/204).
- [x] Événements HTTP upload : repos, envoi, pourcentage ou total inconnu, succès, échec ; contrôles désactivés.
- [x] 22 tests frontend significatifs, indépendants du backend et de MongoDB.
- [x] Tests frontend/backend et build ; rapport des résultats ; Network réel DELETE/upload ; aucune erreur JavaScript non gérée dans le scénario Chrome.

## Git et livrables

- [x] original local et distant déjà présents, intacts.
- [x] TP1 : commit relu 290b686, snapshot TP1 et push main/TP1 réalisés.
- [x] TP2 : commit relu 056e374, snapshot TP1+2 et push main/TP1+2 réalisés.
- [ ] TP3 : commit relu, snapshot TP1+2+3 et push main/TP1+2+3.

Aucune extension facultative (paginator Material, plugin Mongoose, filtres, couvertures) n'est prévue. Suppression et progression deviennent obligatoires dans TP3.
