import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      email: this.form.value.email?.trim() ?? '',
      password: this.form.value.password ?? '',
    };

    this.loading.set(true);
    this.authService.login(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/company-selector']);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err?.error?.message || 'Connexion impossible. Verifiez vos identifiants.';
        this.errorMessage.set(message);
      },
    });
  }
}
