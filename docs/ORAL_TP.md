# Préparer la soutenance

Ces questions sont des exercices, pas une affirmation que le binôme maîtrise déjà les réponses.

## TP1

- Suivre le clic « Se connecter » : `login-page.html` déclenche submit(), `login-page.ts` valide ; AuthService.login() construit POST JSON, HttpClient l'envoie, Express vérifie avec User/bcrypt, tap() met à jour le Signal puis le composant navigue. Pourquoi le composant ne connaît-il pas MongoDB ?
- Le Signal actualise l'UI en mémoire ; localStorage conserve le JWT après rechargement. Pourquoi currentUser est-il initialement null malgré un token stocké ? Pourquoi profile() doit-il lire le serveur ?
- Montrer `authInterceptor` : header ajouté uniquement aux routes privées de notre API. Expliquer catchError, nettoyage et propagation de l'erreur. Pourquoi un 401 de login ne signifie-t-il pas forcément « ancienne session expirée » ?
- Montrer le nom trim/minlength dans User.js et nameValidator. Où le nouveau nom est-il réellement enregistré ?
- Pourquoi le guard ne peut-il pas sécuriser l'API ? Qui vérifie signature et expiration du JWT ?

## TP2

- Tracer load() → TrackService.list() → HttpClient params → skip/limit/count côté API. Quel GET change après « Suivant » ? Pourquoi ne pas faire slice() ?
- Où les champs audio/title sont-ils ajoutés au FormData ? Pourquoi ne pas définir soi-même multipart Content-Type ?
- Où se trouvent les deux validations fichier ? Comment un client contournerait-il Angular ? Pourquoi le backend doit-il toujours contrôler MIME/taille/propriété ?
- Tracer play() → audio() → GET Blob authentifié → createObjectURL → audio [src]. Pourquoi un src HTTP direct échappe-t-il à l'intercepteur ?
- Définir streaming serveur, téléchargement complet Blob, buffering et révocation. Montrer stopAudio()/ngOnDestroy() ; qu'arrive-t-il si on clique rapidement A puis B ?

## TP3 et tests

- Tracer remove() → confirmation → TrackService.delete() → DELETE → middleware auth → requête Mongoose {_id,ownerId}. Pourquoi les données d'un autre utilisateur sont-elles masquées par 404 ?
- Expliquer deletingId et finalize. Que devient la page si on supprime sa dernière piste ? Que fait le code sur 500 après suppression des métadonnées côté serveur ?
- Expliquer Math.round(100 * loaded / total). Pourquoi total peut-il manquer ? Pourquoi 100 % d'octets envoyés ne signifie-t-il pas succès serveur ?
- Montrer observe:'events', reportProgress:true et withXhr() (Fetch est le défaut Angular 22). Quels événements next reçoit-il ? Quand vide-t-on le formulaire ?
- Ouvrir track.service.spec.ts : expectOne sélectionne une requête ; assertions méthode/URL/params/body ; event simule la progression ; flush simule la réponse ; verify détecte les requêtes inattendues. Pourquoi MongoDB n'est-il pas nécessaire ?
- Différencier test unitaire HTTP simulé, composant jsdom et test navigateur Chrome + API réelle. Quel défaut le test navigateur d'upload a-t-il découvert que le test de méthode avait manqué ?
- Pourquoi substituer MatSnackBar dans un test composant ? Montrer le test qui vérifie le feedback sans dépendre d'animations réelles.

## Exercice sans l'agent

1. Dessiner la connexion et la lecture audio sans consulter les schémas.
2. Prévoir l'état de chaque Signal pendant un POST 400, une progression sans total et un DELETE 404.
3. Changer temporairement le nom d'un champ multipart dans un brouillon local et expliquer quel test doit échouer ; rétablir avant commit.
4. Expliquer une assertion des tests et ce qu'un faux positif aurait laissé passer.
5. Reproduire dans DevTools deux GET de pages différentes et un DELETE annulé/confirmé, sans exporter secrets.
