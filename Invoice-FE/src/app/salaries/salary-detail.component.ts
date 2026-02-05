import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SalaryService } from './salary.service';
import { Salary } from './salary.model';

@Component({
  selector: 'app-salary-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './salary-detail.component.html',
  styleUrl: './salary-detail.component.scss',
})
export class SalaryDetailComponent {
  protected readonly salary = signal<Salary | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private salaryService: SalaryService,
    private router: Router
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.salaryService.getSalaryById(id).subscribe({
        next: (data) => this.salary.set(data),
        error: (err) => {
          const message = err?.error?.message || 'Impossible de charger le salaire.';
          this.errorMessage.set(message);
        },
      });
    } else {
      this.errorMessage.set('Salaire introuvable.');
    }
  }

  deleteSalary(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Salaire introuvable.');
      return;
    }

    if (!confirm('Supprimer ce salaire ?')) {
      return;
    }

    this.salaryService.deleteSalary(id).subscribe({
      next: () => this.router.navigate(['/salaries']),
      error: (err) => {
        const message = err?.error?.message || 'Impossible de supprimer le salaire.';
        this.errorMessage.set(message);
      },
    });
  }
}
