# Pagination, upload, audio : missions 2 et 3

`TracksPageComponent.load(requestedPage)` dans `tracks-page.ts` → `TrackService.list(page, 5)` dans `track.service.ts` → `HttpClient.get('/api/tracks', {params: {page, limit}})` → `authInterceptor` → `backend/src/app.js` route GET protégée → filtre `ownerId: req.auth.sub`, Mongoose `skip((page-1)*limit).limit(limit)` et `countDocuments` → `Page<Track>`. Les Signals reçoivent items/page/pages ; chaque changement de page fait un nouveau GET.

Choix du fichier : `TracksPageComponent.choose()` → `audioFileError()` vérifie présence, taille et MIME. `upload()` revalide avant HTTP, empêche un double envoi → `TrackService.upload()` construit exactement **audio** et **title** dans FormData → `HttpClient.post()` → intercepteur JWT → Express `auth`, `upload.single('audio')` (Multer) → contrôle fichier présent, titre fourni ou nom original → `Track.create()` → 201. Le navigateur pose le Content-Type et la boundary : Angular ne les force pas.

Contrôles serveur existants : `MAX_FILE_SIZE = 25 * 1024 * 1024`, Set `allowed` de six MIME, `limits.fileSize` et `fileFilter` dans `backend/src/app.js`, absence de req.file → 400. Le client utilise la même liste. Le frontend aide l'utilisateur ; un client malveillant peut le contourner, donc Multer et Mongoose restent indispensables.

Lecture : `TracksPageComponent.play(track)` → `TrackService.audio(id)` → `HttpClient.get(..., {responseType: 'blob'})` → Bearer par `authInterceptor` → GET `/api/tracks/:id/audio` → middleware JWT et `Track.findOne({_id,ownerId})` → `res.type()`/`res.sendFile()` → Blob reçu → `URL.createObjectURL(blob)` → Signal audioUrl → `[src]` du lecteur. `stopAudio()` annule la requête antérieure et révoque l'URL ; `ngOnDestroy()` révoque la dernière. `audioFailed()` traite une erreur de décodage HTMLMediaElement.

Une URL HTTP directement mise dans `<audio src>` est chargée par le navigateur, hors du pipeline Angular HttpClient : notre intercepteur ne peut pas lui ajouter Authorization. Ici la requête authentifiée précède la création de l'URL locale blob: ; le token n'est jamais mis dans une URL.

## Mémoire, buffering et streaming

1. Le serveur utilise `res.sendFile()` : il peut transférer progressivement depuis le disque, sans charger tout le fichier dans un gros Buffer explicite. MongoDB contient les métadonnées, pas les octets audio.
2. Avec `responseType: 'blob'` et l'observation de la réponse finale, le composant reçoit normalement le Blob après téléchargement complet. Ce mécanisme n'offre pas une lecture au fur et à mesure du réseau.
3. Une bibliothèque de 100 pistes n'entraîne pas le téléchargement de 100 fichiers audio. `list()` ne charge que 5 métadonnées par page ; `audio()` est appelé uniquement dans `play()` sur action explicite.
4. Avec 100 lecteurs HTTP directs, le navigateur pourrait faire plusieurs requêtes selon `preload`, les interactions et son buffering ; ce n'est pas forcément 100 téléchargements complets, mais la stratégie et l'authentification changeraient.
5. Une ObjectURL maintient une référence au Blob. La révocation libère cette référence quand le lecteur n'en a plus besoin ; sinon les anciens fichiers peuvent rester retenus en mémoire.

Le buffering concerne les données dont le lecteur dispose pour décoder/lire. Le streaming serveur concerne le transfert par morceaux depuis le disque. Le téléchargement complet du Blob côté Angular peut donc coexister avec un transfert progressif côté Express.
