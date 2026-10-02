import { audioFileError, MAX_AUDIO_SIZE } from './audio-file.validator';

describe('Validation upload avant HTTP', () => {
  it('refuse absence, fichier vide, mauvais MIME et dépassement 25 Mo', () => {
    expect(audioFileError(undefined)).toContain('Choisissez');
    expect(audioFileError(new File([], 'empty.mp3', { type: 'audio/mpeg' }))).toContain('vide');
    expect(audioFileError(new File(['text'], 'text.txt', { type: 'text/plain' }))).toContain('Format refusé');
    expect(audioFileError(new File([new Uint8Array(MAX_AUDIO_SIZE + 1)], 'big.mp3', { type: 'audio/mpeg' }))).toContain('25 Mo');
  });
  it('accepte la limite exacte et les six MIME acceptés par Multer', () => {
    expect(audioFileError(new File([new Uint8Array(MAX_AUDIO_SIZE)], 'limit.mp3', { type: 'audio/mpeg' }))).toBe('');
    for (const type of ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']) {
      expect(audioFileError(new File(['audio fixture'], 'fixture', { type }))).toBe('');
    }
  });
});
