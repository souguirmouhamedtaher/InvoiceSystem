import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployeeService } from './employee.service';
import { Employee } from './employee.model';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee-detail.component.html',
  styleUrl: './employee-detail.component.scss',
})
export class EmployeeDetailComponent {
  protected readonly employee = signal<Employee | null>(null);
  protected readonly employeeId = signal<string>('');
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private router: Router
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeId.set(id);
      this.employeeService.getEmployeeById(id).subscribe({
        next: (data) => this.employee.set(data),
        error: (err) => {
          const message = err?.error?.message || 'Impossible de charger l\'employe.';
          this.errorMessage.set(message);
        },
      });
    } else {
      this.errorMessage.set('Employe introuvable.');
    }
  }

  deleteEmployee(): void {
    const id = this.employeeId();
    if (!id) {
      this.errorMessage.set('Employe introuvable.');
      return;
    }

    if (!confirm('Supprimer cet employe ?')) {
      return;
    }

    this.employeeService.deleteEmployee(id).subscribe({
      next: () => this.router.navigate(['/employees']),
      error: (err) => {
        const message = err?.error?.message || 'Impossible de supprimer l\'employe.';
        this.errorMessage.set(message);
      },
    });
  }
}
