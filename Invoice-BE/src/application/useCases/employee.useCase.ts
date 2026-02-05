import { Injectable, NotFoundException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { Employee } from 'src/domain/entities';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dtos';

@Injectable()
export class EmployeeUseCases {
    constructor(private dataService: IDataServices) {}

    async getAllEmployees(
        page: number = 1,
        limit: number = 20,
        search?: { [key: string]: any }
    ): Promise<{ employees: Employee[]; totalEmployees: number }> {
        const query: any = { deletedAt: null };
        const orQueries: any[] = [];

        if (search) {
            for (const [key, value] of Object.entries(search)) {
                if (['firstName', 'lastName', 'email', 'phone'].includes(key) && typeof value === 'string') {
                    orQueries.push({ [key]: { $regex: value, $options: 'i' } });
                } else if (key === 'search' && typeof value === 'string') {
                    const searchRegex = { $regex: value, $options: 'i' };
                    orQueries.push({ firstName: searchRegex });
                    orQueries.push({ lastName: searchRegex });
                    orQueries.push({ email: searchRegex });
                } else {
                    query[key] = value;
                }
            }
        }

        const finalQuery = orQueries.length > 0 ? { $and: [query, { $or: orQueries }] } : query;
        const employees = await this.dataService.employee.findAllByAttributeWithFilter(finalQuery, page, limit);
        const totalEmployees = await this.dataService.employee.count(finalQuery);

        return { employees: employees || [], totalEmployees };
    }

    async getEmployeeById(id: string): Promise<Employee> {
        const employee = await this.dataService.employee.get(id);
        if (!employee) throw new NotFoundException('Employee not found.');
        return employee;
    }

    async createEmployee(payload: CreateEmployeeDto): Promise<Employee> {
        const employee = {
            ...payload,
        } as Employee;

        return await this.dataService.employee.create(employee);
    }

    async updateEmployee(id: string, payload: UpdateEmployeeDto): Promise<Employee> {
        const existing = await this.dataService.employee.get(id);
        if (!existing) throw new NotFoundException('Employee not found.');

        return await this.dataService.employee.update(id, payload as any);
    }

    async deleteEmployee(id: string): Promise<boolean> {
        const existing = await this.dataService.employee.get(id);
        if (!existing) throw new NotFoundException('Employee not found.');

        return await this.dataService.employee.delete(id);
    }
}
