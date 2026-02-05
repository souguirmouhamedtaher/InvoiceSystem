import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from './auth.service';
import { RouterLink } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  protected readonly loading = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(private authService: AuthService) {}

  submit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = (this.form.value.email || '').trim();
    const resetPassLink = this.getResetLink();

    this.loading.set(true);
    this.authService.forgotPassword(email, resetPassLink).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Un email de reinitialisation a ete envoye.');
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Impossible d\'envoyer le lien. Veuillez reessayer.';
        this.errorMessage.set(message);
      },
    });
  }

  private getResetLink(): string {
    if (isPlatformBrowser(this.platformId)) {
      return `${window.location.origin}/reset-password`;
    }

    return 'http://localhost:4200/reset-password';
  }
}
