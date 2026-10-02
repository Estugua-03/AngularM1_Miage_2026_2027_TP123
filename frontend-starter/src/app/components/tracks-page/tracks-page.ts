import { Component, DestroyRef, inject, OnDestroy, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';
import { httpErrorMessage } from '../../shared/utils/http-error-message';
import { audioFileError } from '../../shared/validators/audio-file.validator';

@Component({
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent implements OnDestroy {
  private readonly service = inject(TrackService);
  private readonly destroyRef = inject(DestroyRef);
  private listRequest?: Subscription;
  private audioRequest?: Subscription;
  private fileInput?: HTMLInputElement;

  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly uploading = signal(false);
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
    const message = audioFileError(this.file);
    this.uploadError.set(message);
    if (message) {
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
    if (this.uploadError() || !this.file) return;
    this.uploading.set(true);
    this.service.upload(this.file, this.title.value.trim() || this.file.name).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.uploading.set(false)),
    ).subscribe({
      next: () => {
        this.uploadSuccess.set('Piste envoyée.');
        this.title.reset();
        this.file = undefined;
        if (this.fileInput) this.fileInput.value = '';
        this.load(1);
      },
      error: (error: unknown) => this.uploadError.set(httpErrorMessage(error, 'Envoi impossible. Réessayez.')),
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

  ngOnDestroy(): void {
    // Révoquer aussi l'ultime URL, même si l'utilisateur quitte sans lire une autre piste.
    this.stopAudio();
  }
}
