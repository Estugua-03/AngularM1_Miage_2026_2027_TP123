# Connexion : flux annoté (mission 0)

```mermaid
sequenceDiagram
  actor Etudiant
  participant Page as LoginPageComponent (login-page.ts/html)
  participant Auth as AuthService (auth.service.ts)
  participant HTTP as HttpClient + authInterceptor
  participant API as Express (backend/src/app.js)
  participant Model as User (backend/src/models/User.js)
  participant DB as MongoDB
  Etudiant->>Page: Se connecter (ngSubmit)
  Page->>Page: submit() : validation Reactive Forms
  Page->>Auth: login(email, password)
  Auth->>HTTP: POST /api/auth/login, JSON {email,password}
  Note over HTTP: Route publique : aucun Bearer nécessaire
  HTTP->>API: express.json() puis handler POST
  API->>Model: findOne({email}).select('+passwordHash')
  Model->>DB: Recherche utilisateur
  DB-->>Model: Document ou absence
  API->>Model: verifyPassword() avec bcrypt
  alt Identifiants valides
    API-->>HTTP: 200 {token,user public}
    HTTP-->>Auth: Observable AuthResponse
    Auth->>Auth: tap → storeAuthentication()
    Note over Auth: localStorage persiste le JWT ; Signals token/currentUser actualisent l'UI
    Auth-->>Page: subscribe next
    Page->>Page: navigation /tracks
  else Identifiants incorrects
    API-->>Page: 401 (Observable error via service)
    Page->>Page: message compréhensible, aucune donnée sensible journalisée
  end
```

## Carte du starter

Racine : `frontend-starter/src/app/components/app/app.ts` (`AppComponent`, `RouterOutlet`). Routes : `src/app/routes.ts`. Enregistrement de `HttpClient` : `src/main.ts`, `provideHttpClient(withInterceptors([authInterceptor]))`. Modèles : `src/app/shared/models/`. Pages : `src/app/components/`. Services : `src/app/shared/services/`. Guard : `shared/guards/auth.guard.ts`. Intercepteur : `shared/interceptors/auth.interceptor.ts`.

Routes publiques : GET `/api/health`, POST `/api/auth/register`, POST `/api/auth/login`. Routes protégées : GET/PUT `/api/users/me`, GET/POST `/api/tracks`, GET `/api/tracks/:id/audio`, DELETE `/api/tracks/:id`.

Profil : `ProfilePageComponent.load()`/`save()` → `AuthService.profile()`/`update()` → `HttpClient.get()`/`put()` → intercepteur Bearer → middleware `auth` dans `backend/src/app.js` (`jwt.verify`) → `User.findById()`/`findByIdAndUpdate()` → MongoDB. La mise à jour utilise `runValidators: true` et renvoie `toPublic()` ; le `tap` du service actualise `currentUser`.

Le guard améliore la navigation mais ne valide pas la signature du JWT. Le backend reste responsable de l'authentification et des droits. Un 401 d'une route protégée nettoie la session et ramène au login. Un 401 de login signifie que les identifiants sont refusés.

Un Signal est un état réactif en mémoire : le template suit ses changements. `localStorage` persiste après rechargement mais ne déclenche pas à lui seul les mises à jour Angular. Le profil n'y est pas stocké : il est relu via l'API. Aucun mot de passe n'est persisté.
