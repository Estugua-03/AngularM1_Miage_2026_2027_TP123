export const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const allowedMimeTypes = new Set([
  'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a',
]);

/** Même liste MIME et limite que Multer. Le serveur reste la validation de confiance. */
export function audioFileError(file: File | undefined): string {
  if (!file) return 'Choisissez un fichier audio.';
  if (!file.size) return 'Le fichier est vide.';
  if (file.size > MAX_AUDIO_SIZE) return 'Le fichier dépasse la limite de 25 Mo.';
  if (!allowedMimeTypes.has(file.type)) {
    return 'Format refusé : choisissez un MP3, WAV, OGG ou M4A avec un type audio reconnu.';
  }
  return '';
}
