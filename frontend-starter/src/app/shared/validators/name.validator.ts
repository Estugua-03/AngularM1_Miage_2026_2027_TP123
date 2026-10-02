import { ValidatorFn } from '@angular/forms';

/** Mongoose exige au moins deux caractères après trim(), même pour PUT /users/me. */
export const nameValidator: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim().length >= 2
    ? null : { name: true };
