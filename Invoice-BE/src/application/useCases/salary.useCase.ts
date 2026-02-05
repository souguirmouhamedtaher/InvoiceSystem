import { Injectable, NotFoundException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { Salary } from 'src/domain/entities';
import { CreateSalaryDto, UpdateSalaryDto } from '../dtos';

@Injectable()
export class SalaryUseCases {
    constructor(private dataService: IDataServices) {}

    async getAllSalaries(
        page: number = 1,
        limit: number = 20,
        search?: { [key: string]: any }
    ): Promise<{ salaries: Salary[]; totalSalaries: number }> {
        const query: any = { deletedAt: null };

        if (search) {
            if (search.employeeId) {
                query.employeeId = search.employeeId;
            }
            if (search.month) {
                query.month = search.month;
            }
        }

        const salaries = await this.dataService.salary.findAllByAttributeWithFilter(query, page, limit, { createdAt: -1 });
        const totalSalaries = await this.dataService.salary.count(query);

        return { salaries: salaries || [], totalSalaries };
    }

    async getSalaryById(id: string): Promise<Salary> {
        const salary = await this.dataService.salary.get(id);
        if (!salary) throw new NotFoundException('Salary not found.');
        return salary;
    }

    async createSalary(payload: CreateSalaryDto): Promise<Salary> {
        const isPaid = payload.paidDate ? true : Boolean(payload.isPaid);
        const salary = {
            ...payload,
            isPaid,
        } as any;

        return await this.dataService.salary.create(salary);
    }

    async updateSalary(id: string, payload: UpdateSalaryDto): Promise<Salary> {
        const existing = await this.dataService.salary.get(id);
        if (!existing) throw new NotFoundException('Salary not found.');

        const nextPayload: any = { ...payload };
        if (payload.paidDate) {
            nextPayload.isPaid = true;
        }

        return await this.dataService.salary.update(id, nextPayload);
    }

    async deleteSalary(id: string): Promise<boolean> {
        const existing = await this.dataService.salary.get(id);
        if (!existing) throw new NotFoundException('Salary not found.');

        return await this.dataService.salary.delete(id);
    }
}
