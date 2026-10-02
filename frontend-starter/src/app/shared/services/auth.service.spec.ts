import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { authGuard } from '../guards/auth.guard';

describe('Authentification — HTTP simulé, sans API ni MongoDB', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  const user = { id: 'user-test', name: 'Test', email: 'test@example.test', createdAt: '2026-10-02' };
  // Valeurs factices : aucun vrai mot de passe ni jeton n'est utilisé par ces tests.
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([]),
    ] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); vi.restoreAllMocks(); });

  function authenticate(): void {
    auth.login(user.email, 'test-only-password').subscribe();
    http.expectOne('/api/auth/login').flush({ user, token: 'test-only-token' });
  }

  it('login POST JSON public puis stocke la session et actualise currentUser', () => {
    auth.login(user.email, 'test-only-password').subscribe();
    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: user.email, password: 'test-only-password' });
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ user, token: 'test-only-token' });
    expect(auth.currentUser()).toEqual(user);
    expect(localStorage.getItem('gpc_token')).toBe('test-only-token');
  });

  it('register POST respecte le corps du contrat et accepte 201', () => {
    auth.register(user.name, user.email, 'test-only-password').subscribe();
    const req = http.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: user.name, email: user.email, password: 'test-only-password' });
    req.flush({ user, token: 'test-only-token' }, { status: 201, statusText: 'Created' });
    expect(auth.currentUser()).toEqual(user);
  });

  it('profil GET puis PUT avec Bearer et mise à jour du Signal', () => {
    authenticate();
    auth.profile().subscribe();
    const get = http.expectOne('/api/users/me');
    expect(get.request.method).toBe('GET');
    expect(get.request.headers.get('Authorization')).toBe('Bearer test-only-token');
    get.flush(user);
    auth.update('Nouveau nom').subscribe();
    const put = http.expectOne('/api/users/me');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ name: 'Nouveau nom' });
    put.flush({ ...user, name: 'Nouveau nom' });
    expect(auth.currentUser()?.name).toBe('Nouveau nom');
  });

  it('un 401 protégé nettoie la session et redirige, même pour une réponse Blob', () => {
    authenticate();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    let status = 0;
    TestBed.inject(HttpClient).get('/api/tracks/test/audio', { responseType: 'blob' }).subscribe({ error: e => status = e.status });
    const req = http.expectOne('/api/tracks/test/audio');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-only-token');
    req.flush(new Blob(), { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(auth.currentUser()).toBeNull();
    expect(auth.token()).toBeNull();
    expect(localStorage.getItem('gpc_token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('un login refusé reste une erreur de formulaire et ne ferme pas une autre session', () => {
    authenticate();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    auth.login(user.email, 'test-only-wrong-password').subscribe({ error: () => {} });
    const req = http.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.token()).toBe('test-only-token');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ne transmet jamais le Bearer à une URL extérieure', () => {
    authenticate();
    TestBed.inject(HttpClient).get('https://example.test/api/tracks').subscribe();
    const req = http.expectOne('https://example.test/api/tracks');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('guard sans token produit une UrlTree /login ; logout nettoie les deux états', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    expect(TestBed.inject(Router).serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/login');
    authenticate();
    expect(TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot))).toBe(true);
    auth.logout();
    expect(auth.currentUser()).toBeNull();
    expect(localStorage.getItem('gpc_token')).toBeNull();
  });
});
