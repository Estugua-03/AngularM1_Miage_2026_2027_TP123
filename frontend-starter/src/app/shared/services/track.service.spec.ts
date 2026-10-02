import { TestBed } from '@angular/core/testing';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TrackService } from './track.service';

describe('TrackService — contrat HTTP isolé', () => {
  let service: TrackService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TrackService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('list transmet vraiment page et limit et restitue les métadonnées serveur', () => {
    const response = { items: [], page: 3, limit: 7, pages: 4, total: 25 };
    let received: unknown;
    service.list(3, 7).subscribe(result => received = result);
    const req = http.expectOne('/api/tracks?page=3&limit=7');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('3');
    expect(req.request.params.get('limit')).toBe('7');
    req.flush(response);
    expect(received).toEqual(response);
  });

  it('upload conserve audio/title, laisse la boundary au navigateur et émet progression puis réponse', () => {
    const events: HttpEventType[] = [];
    const file = new File(['fixture'], 'test.mp3', { type: 'audio/mpeg' });
    service.upload(file, 'Blues').subscribe(event => events.push(event.type));
    const req = http.expectOne('/api/tracks');
    expect(req.request.method).toBe('POST');
    expect(req.request.reportProgress).toBe(true);
    expect(req.request.headers.has('Content-Type')).toBe(false);
    expect(Array.from((req.request.body as FormData).keys()).sort()).toEqual(['audio', 'title']);
    req.event({ type: HttpEventType.UploadProgress, loaded: 5, total: 10 });
    req.flush({ id: 'test-only-track' }, { status: 201, statusText: 'Created' });
    expect(events).toContain(HttpEventType.UploadProgress);
    expect(events.at(-1)).toBe(HttpEventType.Response);
  });

  it('audio GET Blob et suppression DELETE attendent les endpoints documentés', () => {
    let blob: Blob | undefined;
    service.audio('test-only-track').subscribe(result => blob = result);
    const audio = http.expectOne('/api/tracks/test-only-track/audio');
    expect(audio.request.method).toBe('GET');
    expect(audio.request.responseType).toBe('blob');
    const response = new Blob(['fixture'], { type: 'audio/mpeg' });
    audio.flush(response);
    expect(blob).toBe(response);
    let deleted = false;
    service.delete('test-only-track').subscribe(() => deleted = true);
    const deletion = http.expectOne('/api/tracks/test-only-track');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush(null, { status: 204, statusText: 'No Content' });
    expect(deleted).toBe(true);
  });
});
