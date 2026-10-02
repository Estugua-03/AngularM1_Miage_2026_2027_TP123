import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { httpErrorMessage } from '../../shared/utils/http-error-message';
import { nameValidator } from '../../shared/validators/name.validator';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePageComponent {
  readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [nameValidator] }),
  });

  constructor() {
    // Même après rechargement, le profil vient du serveur et non d'un cache local.
    this.load();
  }

  load(): void {
    if (this.loading() || this.saving()) return;
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    this.auth.profile().pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (user) => this.form.setValue({ name: user.name }),
      error: (error: unknown) => this.error.set(httpErrorMessage(error, 'Chargement du profil impossible.')),
    });
  }

  save(): void {
    if (this.saving() || this.loading()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.auth.update(this.form.getRawValue().name.trim()).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)),
    ).subscribe({
      next: (user) => {
        this.form.setValue({ name: user.name });
        this.success.set('Profil enregistré.');
      },
      error: (error: unknown) => this.error.set(httpErrorMessage(error, 'Enregistrement du profil impossible.')),
    });
  }
}
