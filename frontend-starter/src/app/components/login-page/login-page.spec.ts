import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LoginPageComponent } from './login-page';

describe('LoginPageComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
  ] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('formulaire invalide : aucune requête ; échec HTTP : erreur visible et nouvelle tentative possible', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    component.submit();
    http.expectNone('/api/auth/login');
    component.form.setValue({ email: 'test@example.test', password: 'test-only-password' });
    component.submit();
    component.submit(); // Un second clic ne crée pas une seconde requête.
    const req = http.expectOne('/api/auth/login');
    expect(component.submitting()).toBe(true);
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(component.submitting()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Authentification refusée');
  });
});
