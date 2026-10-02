# Vérifications réelles à effectuer localement

L'agent n'a accès à aucun navigateur. Rien ci-dessous n'est déclaré réussi sans observation ou retour de l'utilisateur. Les tests jsdom utilisent des réponses simulées, pas MongoDB.

## Configuration locale

D'après `backend/.env.example` : renseigner **MONGODB_URI**, **JWT_SECRET** et **PORT** dans votre fichier local `backend/.env`. Ne jamais transmettre ce fichier. L'utilisateur a confirmé que `/api/health` répond 200. Vérifier soi-même les collections et le compte de test dans Atlas. Le proxy frontend vise `http://localhost:3000` ; adapter seulement le port si nécessaire.

Terminaux distincts : `cd backend` puis `npm.cmd start` ; `cd frontend-starter` puis `npm.cmd start`. Ouvrir `http://localhost:4200`. Les logs backend sont dans le terminal ayant lancé Node ; ne pas en copier une erreur pouvant contenir une URI.

## TP1

1. Ouvrir DevTools → Network → Fetch/XHR. Vérifier qu'un formulaire vide ou un email incorrect n'envoie aucune requête.
2. Connexion avec le compte de test local : POST `/api/auth/login`, JSON avec email/password, statut 200 ; réponse contenant user/token ; aucun Authorization. **Ne jamais capturer le corps ni la réponse contenant les secrets.** Navigation vers `/tracks`.
3. Déconnexion : retour `/login`, navigation privée protégée, session locale nettoyée. Connexion refusée : POST login → 401 et message visible.
4. Inscription avec un email de test distinct, nom ≥ 2 caractères et mot de passe ≥ 8 : POST register → 201, redirection `/profile`. Email déjà utilisé → 409. Nom composé d'espaces et mot de passe trop court : aucune requête.
5. Profil : GET `/api/users/me` à l'ouverture, 200 ; changement de nom : PUT même URL, corps `{name}`, 200 ; nom actualisé à l'écran. Recharger la page : GET recharge le profil. Présence du header Authorization à constater sans le copier.
6. Session invalide : Application → Local Storage → remplacer **localement** `gpc_token` par `invalid-test-value`, recharger `/profile` : GET → 401, suppression session et retour `/login`. Pour une expiration réelle, attendre l'expiration (2 h dans le backend) et refaire GET. Ne pas partager le jeton.
7. Faire une capture de la **liste Network uniquement** (nom requête, méthode, statut), sans panneau Payload/Response/Headers/Application et sans données privées. Sauver dans `evidence/tp1/network-auth.png` puis ajouter le lien dans le rapport. Relire visuellement la capture avant Git.

## TP2

1. Avec plus de 5 pistes : première liste GET `/api/tracks?page=1&limit=5`, Suivant → page=2, Précédent → page=1 ; bornes désactivées. Aucune découpe locale de toutes les pistes.
2. Sans fichier, mauvais MIME ou > 25 × 1024² octets : erreur locale sans POST. Tester MP3/WAV/OGG/M4A reconnus par le navigateur. Certains fichiers ont un MIME vide : ils sont refusés explicitement plutôt que de deviner un type que le backend n'accepterait pas.
3. Upload valide : POST `/api/tracks`, multipart avec **audio** et **title** (boundary laissé au navigateur), 201 ; contrôles désactivés et double clic sans doublon ; succès, formulaire vidé, liste rechargée page 1.
4. Pour vérifier le contrôle serveur indépendamment du frontend : reproduire **localement** un POST avec un fichier texte via l'outil HTTP de votre choix, avec votre authentification locale (ne jamais exporter la requête ou le JWT). Attendu : 400, aucune piste créée. Vérifier aussi le comportement après coupure du backend.
5. Lire une piste : GET `/api/tracks/:id/audio`, Authorization présent, type audio, 200 (transfert Blob complet), lecteur `blob:` et titre courant. Passer rapidement A → B : B reste courant ; quitter la page/déconnexion : lecteur détruit, URL révoquée (tests unitaires pour cette révocation).
6. Avec deux comptes de test : demander avec le second compte l'id d'une piste du premier → 404 (le backend masque l'absence de propriété). Ne pas recopier de jeton ; manipuler uniquement votre environnement local.
7. Captures expurgées liste Network pagination/upload dans `evidence/tp2/network-library.png`, lecteur visible dans `evidence/tp2/player.png` ; relier au rapport.

## TP3

1. Annuler la confirmation Supprimer : aucun DELETE. Confirmer sur une **piste de test jetable** : DELETE `/api/tracks/:id` → 204 ; bouton bloqué pendant la requête ; SnackBar ; GET recharge la page.
2. Dernière piste d'une page > 1 supprimée : retour à la dernière page existante. Supprimer la piste en cours : lecteur et URL libérés.
3. Supprimer une piste déjà supprimée dans un autre onglet → 404, message et liste rafraîchie. Id autre propriétaire → 404 ; si 403, message d'accès refusé. Erreur 500 : message sans faux succès.
4. DevTools → throttling réseau : envoyer un fichier audio assez grand (< 25 Mo) ; progression 0..100 quand total connu, puis « traitement serveur » jusqu'au 201. Sans total, état indéterminé. Envoi et erreurs bloquent/débloquent correctement les contrôles. Reconnexion après 401 si nécessaire.
5. Captures expurgées liste Network DELETE/upload dans `evidence/tp3/network-delete-upload.png` et progression visible dans `evidence/tp3/upload-progress.png`. Vérifier console sans erreur inattendue ni secret.

## Compte rendu humain

Pour chaque TP, indiquer les scénarios réellement essayés, les statuts observés et les éventuels échecs. Les phrases « nous avons compris » et les acquis de chaque membre sont à remplir par le binôme, jamais par l'agent.
