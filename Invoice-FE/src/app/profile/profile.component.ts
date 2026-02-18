import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, UserProfile } from '../auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  protected readonly loadingProfile = signal(false);
  protected readonly loadingPassword = signal(false);
  protected readonly profileSuccess = signal<string | null>(null);
  protected readonly passwordSuccess = signal<string | null>(null);
  protected readonly profileError = signal<string | null>(null);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly currentUser = signal<UserProfile | null>(null);

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  protected readonly profileForm = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^[+\d\s().-]+$/)]],
  });

  protected readonly passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    this.loadProfile();
  }

  submitProfile(): void {
    this.profileError.set(null);
    this.profileSuccess.set(null);

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const phone = (this.profileForm.value.phone || '').trim();
    this.loadingProfile.set(true);
    this.authService.updateProfile({ phone }).subscribe({
      next: (profile) => {
        this.loadingProfile.set(false);
        this.currentUser.set(profile);
        this.profileSuccess.set('Numero de telephone mis a jour.');
      },
      error: (err) => {
        this.loadingProfile.set(false);
        const message = err?.error?.message || 'Impossible de mettre a jour le profil.';
        this.profileError.set(message);
      },
    });
  }

  submitPassword(): void {
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const currentPassword = this.passwordForm.value.currentPassword || '';
    const newPassword = this.passwordForm.value.newPassword || '';
    const confirmPassword = this.passwordForm.value.confirmPassword || '';

    if (newPassword !== confirmPassword) {
      this.passwordError.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.loadingPassword.set(true);
    this.authService.updatePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.loadingPassword.set(false);
        this.passwordSuccess.set('Mot de passe mis a jour.');
        this.passwordForm.reset();
      },
      error: (err) => {
        this.loadingPassword.set(false);
        const message = err?.error?.message || 'Impossible de changer le mot de passe.';
        this.passwordError.set(message);
      },
    });
  }

  private loadProfile(): void {
    this.authService.loadMe().subscribe({
      next: (profile) => {
        this.currentUser.set(profile);
        this.profileForm.patchValue({
          phone: profile?.phoneNumber || '',
        });
      },
    });
  }
}
