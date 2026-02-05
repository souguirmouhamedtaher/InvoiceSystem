import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  private route = inject(ActivatedRoute);
  private token = this.route.snapshot.queryParamMap.get('token') || '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  submit(): void {
    this.errorMessage.set(null);

    if (!this.token) {
      this.errorMessage.set('Lien invalide ou expire.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const newPassword = this.form.value.newPassword || '';

    this.loading.set(true);
    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Impossible de reinitialiser le mot de passe.';
        this.errorMessage.set(message);
      },
    });
  }
}
