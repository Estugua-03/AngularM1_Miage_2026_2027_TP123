import { HttpErrorResponse } from '@angular/common/http';

/** Ne pas afficher/loguer l'objet HTTP brut : il peut contenir des données privées. */
export function httpErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  switch (error.status) {
    case 0: return 'Serveur inaccessible. Vérifiez la connexion et réessayez.';
    case 401: return 'Authentification refusée ou session expirée. Reconnectez-vous.';
    case 403: return 'Vous ne pouvez pas accéder à cette ressource.';
    case 404: return 'Ressource introuvable ou inaccessible à votre compte.';
    case 409: return 'Cet email est déjà utilisé.';
    case 400: return 'Données refusées par le serveur. Vérifiez les champs et le format du fichier.';
    default: return fallback;
  }
}
