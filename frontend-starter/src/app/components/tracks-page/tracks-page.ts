import { Component, DestroyRef, inject, OnDestroy, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize, of, Subscription, switchMap } from 'rxjs';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';
import { httpErrorMessage } from '../../shared/utils/http-error-message';
import { audioFileError } from '../../shared/validators/audio-file.validator';

@Component({
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, MatSnackBarModule],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent implements OnDestroy {
  private readonly service = inject(TrackService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private listRequest?: Subscription;
  private audioRequest?: Subscription;
  private fileInput?: HTMLInputElement;

  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly uploading = signal(false);
  readonly uploadState = signal<'idle' | 'uploading' | 'success' | 'error'>('idle');
  readonly uploadProgress = signal<number | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly uploadError = signal('');
  readonly uploadSuccess = signal('');
  readonly audioUrl = signal('');
  readonly audioLoading = signal(false);
  readonly audioError = signal('');
  readonly currentTrack = signal<Track | null>(null);
  readonly title = new FormControl('', { nonNullable: true });
  readonly uploadForm = new FormGroup({ title: this.title });
  file?: File;

  constructor() { this.load(); }

  choose(event: Event): void {
    if (this.uploading()) return;
    this.fileInput = event.target as HTMLInputElement;
    this.file = this.fileInput.files?.[0];
    this.uploadSuccess.set('');
    this.uploadState.set('idle');
    this.uploadProgress.set(null);
    const message = audioFileError(this.file);
    this.uploadError.set(message);
    if (message) {
      this.uploadState.set('error');
      this.file = undefined;
      this.fileInput.value = '';
    }
  }

  load(requestedPage = this.page()): void {
    // Annuler la requête précédente empêche une réponse tardive d'écraser une page récente.
    this.listRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.listRequest = this.service.list(requestedPage, 5).pipe(
      // Après suppression de la dernière piste, le serveur peut annoncer moins de pages.
      // La correction demande à nouveau la page serveur valide ; aucun découpage local.
      switchMap(response => response.page > response.pages
        ? this.service.list(response.pages, 5) : of(response)),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (response) => {
        this.tracks.set(response.items);
        this.page.set(response.page);
        this.pages.set(response.pages);
      },
      error: (error: unknown) => this.error.set(httpErrorMessage(error, 'Chargement de la bibliothèque impossible.')),
    });
  }

  go(page: number): void {
    if (this.loading() || page < 1 || page > this.pages()) return;
    this.load(page); // Chaque clic demande une page serveur, aucun slice() local.
  }

  upload(): void {
    if (this.uploading()) return;
    this.uploadError.set(audioFileError(this.file));
    this.uploadSuccess.set('');
    if (this.uploadError() || !this.file) {
      this.uploadState.set('error');
      return;
    }
    this.uploading.set(true);
    this.uploadState.set('uploading');
    this.uploadProgress.set(0);
    this.service.upload(this.file, this.title.value.trim() || this.file.name).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.uploading.set(false)),
    ).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress.set(event.total && event.total > 0
            ? Math.min(100, Math.round(100 * event.loaded / event.total)) : null);
          return;
        }
        // 100 % signifie que les octets sont envoyés, pas que MongoDB a accepté la piste.
        if (event.type !== HttpEventType.Response) return;
        this.uploadState.set('success');
        this.uploadProgress.set(100);
        this.uploadSuccess.set('Piste envoyée.');
        this.notify('Piste envoyée.');
        this.title.reset();
        this.file = undefined;
        if (this.fileInput) this.fileInput.value = '';
        this.load(1);
      },
      error: (error: unknown) => {
        this.uploadState.set('error');
        this.uploadProgress.set(null);
        const message = httpErrorMessage(error, 'Envoi impossible. Réessayez.');
        this.uploadError.set(message);
        this.notify(message);
      },
    });
  }

  play(track: Track): void {
    this.stopAudio();
    this.audioError.set('');
    this.currentTrack.set(track);
    this.audioLoading.set(true);
    this.audioRequest = this.service.audio(track.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.audioLoading.set(false)),
    ).subscribe({
      next: (blob) => {
        // Le Blob arrive après téléchargement complet ; src blob: ne contient aucun JWT.
        this.audioUrl.set(URL.createObjectURL(blob));
      },
      error: (error: unknown) => {
        this.currentTrack.set(null);
        this.audioError.set(httpErrorMessage(error, 'Lecture impossible. Réessayez.'));
      },
    });
  }

  audioFailed(): void {
    this.stopAudio();
    this.audioError.set('Le navigateur ne peut pas décoder ce fichier audio.');
  }

  stopAudio(): void {
    this.audioRequest?.unsubscribe();
    const previousUrl = this.audioUrl();
    this.audioUrl.set('');
    this.currentTrack.set(null);
    if (previousUrl) URL.revokeObjectURL(previousUrl);
  }

  remove(track: Track): void {
    if (this.deletingId() || this.loading()) return;
    if (!window.confirm(`Supprimer « ${track.title} » ? Cette action est définitive.`)) return;
    this.deletingId.set(track.id);
    this.error.set('');
    this.service.delete(track.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.deletingId.set(null)),
    ).subscribe({
      next: () => {
        if (this.currentTrack()?.id === track.id) this.stopAudio();
        this.notify('Piste supprimée.');
        this.load();
      },
      error: (error: unknown) => {
        const message = httpErrorMessage(error, 'Suppression impossible. Réessayez.');
        this.notify(message);
        // Le backend peut masquer un autre propriétaire par 404, ou supprimer les
        // métadonnées avant un échec disque (500) : relire plutôt que garder une card périmée.
        if (error instanceof HttpErrorResponse && [403, 404, 500].includes(error.status)) {
          if (this.currentTrack()?.id === track.id) this.stopAudio();
          this.load();
        } else {
          this.error.set(message);
        }
      },
    });
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 5000 });
  }

  ngOnDestroy(): void {
    // Révoquer aussi l'ultime URL, même si l'utilisateur quitte sans lire une autre piste.
    this.stopAudio();
  }
}
