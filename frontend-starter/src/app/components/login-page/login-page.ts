import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { httpErrorMessage } from '../../shared/utils/http-error-message';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly error = signal('');
  readonly submitting = signal(false);
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', {
      nonNullable: true, validators: [Validators.required],
    }),
  });

  submit(): void {
    if (this.submitting()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.error.set('');
    this.submitting.set(true);
    const values = this.form.getRawValue();
    this.auth.login(values.email.trim(), values.password).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false)),
    ).subscribe({
      next: () => {
        this.form.controls.password.reset();
        void this.router.navigateByUrl('/tracks');
      },
      error: (error: unknown) => this.error.set(httpErrorMessage(error, 'Connexion impossible.')),
    });
  }
}
