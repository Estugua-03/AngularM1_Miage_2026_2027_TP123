import { TestBed } from '@angular/core/testing';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TracksPageComponent } from './tracks-page';
import { Track } from '../../shared/models/track.model';

describe('Bibliothèque — réponses simulées', () => {
  const track: Track = { id: 'test-track', title: 'Blues', originalName: 'test.mp3', mimeType: 'audio/mpeg', size: 1024, createdAt: '2026-10-02' };
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: MatSnackBar, useValue: { open: vi.fn() } },
    ] });
    // Isoler le feedback : les providers du module importé ne doivent pas masquer notre mock.
    TestBed.overrideComponent(TracksPageComponent, { remove: { imports: [MatSnackBarModule] } });
    http = TestBed.inject(HttpTestingController);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:test-only') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });
  afterEach(() => {
    try { http.verify(); }
    finally { vi.restoreAllMocks(); TestBed.resetTestingModule(); }
  });

  function setup(items: Track[] = [track], page = 1, pages = 2) {
    const fixture = TestBed.createComponent(TracksPageComponent);
    const req = http.expectOne('/api/tracks?page=1&limit=5');
    expect(req.request.method).toBe('GET');
    req.flush({ items, page, pages, total: items.length, limit: 5 });
    return fixture;
  }

  it('chaque page déclenche GET page/limit ; les bornes ne déclenchent rien', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    component.go(0);
    http.expectNone('/api/tracks?page=0&limit=5');
    component.go(2);
    const req = http.expectOne('/api/tracks?page=2&limit=5');
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], page: 2, pages: 2, total: 5, limit: 5 });
    expect(component.page()).toBe(2);
    expect(component.tracks()).toEqual([]);
    component.go(3);
    http.expectNone('/api/tracks?page=3&limit=5');
    fixture.destroy();
  });

  it('upload sans fichier ne fait pas HTTP ; multipart exact, double clic bloqué, reset et page 1', () => {
    const fixture = setup([], 2, 2);
    const component = fixture.componentInstance;
    component.upload();
    http.expectNone(req => req.method === 'POST');
    expect(component.uploadError()).toContain('Choisissez');
    component.file = new File(['fixture'], 'test.mp3', { type: 'audio/mpeg' });
    component.title.setValue('Blues');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    component.upload(); // Double soumission pendant le premier POST réel de formulaire.
    const req = http.expectOne('/api/tracks');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(Array.from(body.keys()).sort()).toEqual(['audio', 'title']);
    expect(body.get('title')).toBe('Blues');
    expect((body.get('audio') as File).name).toBe('test.mp3');
    req.flush(track, { status: 201, statusText: 'Created' });
    http.expectOne('/api/tracks?page=1&limit=5').flush({ items: [track], page: 1, pages: 1, total: 1, limit: 5 });
    expect(component.uploading()).toBe(false);
    expect(component.file).toBeUndefined();
    expect(component.title.value).toBe('');
    expect(component.page()).toBe(1);
    expect(component.uploadSuccess()).toContain('envoyée');
    fixture.destroy();
  });

  it('erreur HTTP liste visible dans le template sans rester en chargement', () => {
    const fixture = TestBed.createComponent(TracksPageComponent);
    http.expectOne('/api/tracks?page=1&limit=5').flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Chargement');
    fixture.destroy();
  });

  it('lecture Blob : annule une piste obsolète, révoque au remplacement et à destruction', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    component.play(track);
    const pending = http.expectOne('/api/tracks/test-track/audio');
    expect(pending.request.responseType).toBe('blob');
    component.play({ ...track, id: 'second' });
    expect(pending.cancelled).toBe(true);
    http.expectOne('/api/tracks/second/audio').flush(new Blob(['audio'], { type: 'audio/mpeg' }));
    expect(component.audioUrl()).toBe('blob:test-only');
    component.play(track);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-only');
    http.expectOne('/api/tracks/test-track/audio').flush(new Blob(['audio']));
    fixture.destroy();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(component.audioUrl()).toBe('');
  });

  it('suppression annulée sans DELETE ; confirmation → DELETE unique, SnackBar, arrêt audio et correction page vide', () => {
    const fixture = setup([track], 2, 2);
    const component = fixture.componentInstance;
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.remove(track);
    http.expectNone(req => req.method === 'DELETE');
    confirm.mockReturnValue(true);
    component.play(track);
    http.expectOne('/api/tracks/test-track/audio').flush(new Blob(['audio']));
    component.remove(track); component.remove(track);
    const req = http.expectOne('/api/tracks/test-track');
    expect(req.request.method).toBe('DELETE');
    expect(component.deletingId()).toBe(track.id);
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(component.deletingId()).toBeNull();
    expect(component.currentTrack()).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-only');
    expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalledWith('Piste supprimée.', 'Fermer', { duration: 5000 });
    http.expectOne('/api/tracks?page=2&limit=5').flush({ items: [], page: 2, pages: 1, total: 0, limit: 5 });
    http.expectOne('/api/tracks?page=1&limit=5').flush({ items: [], page: 1, pages: 1, total: 0, limit: 5 });
    expect(component.page()).toBe(1);
    expect(component.loading()).toBe(false);
    fixture.destroy();
  });

  it.each([403, 404, 500])('suppression HTTP %i : SnackBar erreur, aucun faux succès et relecture serveur', status => {
    const fixture = setup();
    const component = fixture.componentInstance;
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.remove(track);
    http.expectOne('/api/tracks/test-track').flush({}, { status, statusText: 'Error' });
    expect(component.deletingId()).toBeNull();
    const open = TestBed.inject(MatSnackBar).open;
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalledWith('Piste supprimée.', expect.anything(), expect.anything());
    http.expectOne('/api/tracks?page=1&limit=5').flush({ items: [], page: 1, pages: 1, total: 0, limit: 5 });
    expect(component.tracks()).toEqual([]);
    fixture.destroy();
  });

  it('upload multi-événements : pourcentage, total absent, attente réponse finale, erreur et retry', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    expect(component.uploadState()).toBe('idle');
    component.file = new File(['fixture'], 'test.mp3', { type: 'audio/mpeg' });
    component.upload();
    const req = http.expectOne('/api/tracks');
    expect(req.request.reportProgress).toBe(true);
    req.event({ type: HttpEventType.UploadProgress, loaded: 25, total: 100 });
    expect(component.uploadProgress()).toBe(25);
    expect(component.uploadState()).toBe('uploading');
    req.event({ type: HttpEventType.UploadProgress, loaded: 50 });
    expect(component.uploadProgress()).toBeNull();
    req.event({ type: HttpEventType.UploadProgress, loaded: 100, total: 100 });
    expect(component.uploading()).toBe(true);
    expect(component.uploadSuccess()).toBe('');
    req.flush({}, { status: 400, statusText: 'Bad Request' });
    expect(component.uploadState()).toBe('error');
    expect(component.uploading()).toBe(false);
    expect(component.uploadError()).toContain('Données refusées');
    expect(component.file).toBeDefined();
    component.upload();
    http.expectOne('/api/tracks').flush(track, { status: 201, statusText: 'Created' });
    http.expectOne('/api/tracks?page=1&limit=5').flush({ items: [track], page: 1, pages: 1, total: 1, limit: 5 });
    expect(component.uploadState()).toBe('success');
    expect(component.uploadProgress()).toBe(100);
    expect(component.file).toBeUndefined();
    fixture.destroy();
  });
});
