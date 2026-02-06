import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { Employee } from 'src/domain/entities';
import { companyType } from 'src/domain/enums/company.enums';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dtos';
import { Types } from 'mongoose';

@Injectable()
export class EmployeeUseCases {
    constructor(private dataService: IDataServices) {}

    async getAllEmployees(
        userId: string | Types.ObjectId,
        page: number = 1,
        limit: number = 20,
        search?: { [key: string]: any }
    ): Promise<{ employees: Employee[]; totalEmployees: number }> {
        const query: any = { deletedAt: null, userId: new Types.ObjectId(userId) };
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
                } else if (key === 'companyId' && typeof value === 'string') {
                    query[key] = new Types.ObjectId(value);
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

    async getEmployeeById(userId: string | Types.ObjectId, id: string): Promise<Employee> {
        const employee = await this.dataService.employee.get(id);
        if (!employee) throw new NotFoundException('Employee not found.');
        if (employee.userId.toString() !== new Types.ObjectId(userId).toString()) {
            throw new ForbiddenException('Access denied');
        }
        return employee;
    }

    async createEmployee(userId: string | Types.ObjectId, payload: CreateEmployeeDto): Promise<Employee> {
        const company = await this.dataService.company.get(payload.companyId);
        if (!company) throw new NotFoundException('Company not found.');
        if (company.userId.toString() !== new Types.ObjectId(userId).toString()) {
            throw new ForbiddenException('Access denied');
        }
        if (company.companyType !== companyType.mycompany) {
            throw new BadRequestException('Employee must belong to a mycompany.');
        }

        const employee = {
            ...payload,
            userId: new Types.ObjectId(userId),
            monthlyNetSalary: Number(payload.monthlyNetSalary || 0),
            cnssRatePercent: payload.cnssApplicable ? Number(payload.cnssRatePercent || 0) : 0,
        } as Employee;

        return await this.dataService.employee.create(employee);
    }

    async updateEmployee(userId: string, id: string, payload: UpdateEmployeeDto): Promise<Employee> {
        const existing = await this.dataService.employee.get(id);
        if (!existing) throw new NotFoundException('Employee not found.');
        if (existing.userId.toString() !== userId) {
            throw new ForbiddenException('You do not have permission to update this employee.');
        }

        if (payload.companyId) {
            const company = await this.dataService.company.get(payload.companyId);
            if (!company) throw new NotFoundException('Company not found.');
            if (company.userId.toString() !== userId) {
                throw new ForbiddenException('You do not have permission to use this company.');
            }
            if (company.companyType !== companyType.mycompany) {
                throw new BadRequestException('Employee must belong to a mycompany.');
            }
        }

        if (payload.monthlyNetSalary !== undefined) {
            (payload as any).monthlyNetSalary = Number(payload.monthlyNetSalary || 0);
        }

        if (payload.cnssApplicable === false) {
            (payload as any).cnssRatePercent = 0;
        } else if (payload.cnssRatePercent !== undefined) {
            (payload as any).cnssRatePercent = Number(payload.cnssRatePercent || 0);
        }

        return await this.dataService.employee.update(id, payload as any);
    }

    async getMonthlyPayrollSummary(userId: string, month?: string, companyId?: string) {
        // Use current month if not provided
        const currentDate = new Date();
        const finalMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        if (!/^\d{4}-\d{2}$/.test(finalMonth)) {
            throw new BadRequestException('Invalid month format. Use YYYY-MM.');
        }

        const userObjectId = new Types.ObjectId(userId);
        const salaryQuery: any = { deletedAt: null, month: finalMonth, userId: userObjectId };
        const cnssQuery: any = { deletedAt: null, month: finalMonth, userId: userObjectId };

        if (companyId) {
            const company = await this.dataService.company.get(companyId);
            if (!company) throw new NotFoundException('Company not found.');
            if (company.userId.toString() !== userId) {
                throw new ForbiddenException('You do not have permission to access this company.');
            }
        }

        // Get all salaries for the month
        const salaries = await this.dataService.salary.findAllByAttributeWithFilter(salaryQuery, 1, 1000);
        const totalSalaryAmount = salaries?.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0) || 0;

        // Get all CNSS payments for the month
        const cnssPayments = await this.dataService.cnssPayment.findAllByAttributeWithFilter(cnssQuery, 1, 1000);
        const totalCnssAmount = cnssPayments?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;

        return {
            month: finalMonth,
            totalSalaryAmount,
            totalCnssAmount,
            salaryCount: salaries?.length || 0,
            cnssCount: cnssPayments?.length || 0
        };
    }

    async generateMonthlyPayroll(userId: string, month: string, companyId?: string) {
        if (!/^\d{4}-\d{2}$/.test(month)) {
            throw new BadRequestException('Invalid month format. Use YYYY-MM.');
        }

        const query: any = { deletedAt: null, userId };
        if (companyId) {
            const company = await this.dataService.company.get(companyId);
            if (!company) throw new NotFoundException('Company not found.');
            if (company.userId.toString() !== userId) {
                throw new ForbiddenException('You do not have permission to access this company.');
            }
            query.companyId = companyId;
        }

        const employees = await this.dataService.employee.findAllByAttributeWithFilter(query, 1, 100000);
        const payrollDate = this.getLastDayOfMonth(month);

        let createdSalaries = 0;
        let skippedSalaries = 0;
        let createdCnss = 0;
        let skippedCnss = 0;

        for (const employee of employees || []) {
            const salaryExists = await this.dataService.salary.findAllByAttributeWithFilter(
                { deletedAt: null, employeeId: employee._id, month },
                1,
                1
            );

            if (salaryExists && salaryExists.length > 0) {
                skippedSalaries++;
            } else {
                const salaryAmount = Number(employee.monthlyNetSalary || 0);
                await this.dataService.salary.create({
                    userId,
                    employeeId: employee._id,
                    month,
                    netAmount: salaryAmount,
                    isPaid: true,
                    paidDate: payrollDate,
                    notes: 'Auto-generated',
                } as any);
                createdSalaries++;
            }

            if (!employee.cnssApplicable || Number(employee.cnssRatePercent || 0) <= 0) {
                continue;
            }

            const cnssExists = await this.dataService.cnssPayment.findAllByAttributeWithFilter(
                { deletedAt: null, employeeId: employee._id, month },
                1,
                1
            );

            if (cnssExists && cnssExists.length > 0) {
                skippedCnss++;
                continue;
            }

            const cnssAmount = this.roundToTwo(
                (Number(employee.monthlyNetSalary || 0) * Number(employee.cnssRatePercent || 0)) / 100
            );

            await this.dataService.cnssPayment.create({
                userId,
                employeeId: employee._id,
                month,
                amount: cnssAmount,
                paymentDate: payrollDate,
                notes: 'Auto-generated',
            } as any);
            createdCnss++;
        }

        // Calculate total amounts from ALL salaries and CNSS for this month
        const salaryQuery: any = { deletedAt: null, month, userId };
        const cnssQuery: any = { deletedAt: null, month, userId };
        
        if (companyId) {
            const employeeIds = employees.map(emp => emp._id);
            salaryQuery.employeeId = { $in: employeeIds };
            cnssQuery.employeeId = { $in: employeeIds };
        }

        const allSalaries = await this.dataService.salary.findAllByAttributeWithFilter(salaryQuery, 1, 100000);
        const allCnss = await this.dataService.cnssPayment.findAllByAttributeWithFilter(cnssQuery, 1, 100000);

        const totalSalaryAmount = (allSalaries || []).reduce((sum, salary) => sum + Number(salary.netAmount || 0), 0);
        const totalCnssAmount = (allCnss || []).reduce((sum, cnss) => sum + Number(cnss.amount || 0), 0);

        return {
            month,
            companyId: companyId || null,
            payrollDate,
            createdSalaries,
            skippedSalaries,
            createdCnss,
            skippedCnss,
            totalSalaryAmount: this.roundToTwo(totalSalaryAmount),
            totalCnssAmount: this.roundToTwo(totalCnssAmount),
        };
    }

    private getLastDayOfMonth(month: string): string {
        const [yearStr, monthStr] = month.split('-');
        const year = Number(yearStr);
        const monthIndex = Number(monthStr);
        const date = new Date(year, monthIndex, 0);
        const day = String(date.getDate()).padStart(2, '0');
        const mm = String(monthIndex).padStart(2, '0');
        return `${yearStr}-${mm}-${day}`;
    }

    private roundToTwo(value: number): number {
        return Math.round(value * 100) / 100;
    }

    async deleteEmployee(userId: string, id: string): Promise<boolean> {
        const existing = await this.dataService.employee.get(id);
        if (!existing) throw new NotFoundException('Employee not found.');
        if (existing.userId.toString() !== userId) {
            throw new ForbiddenException('You do not have permission to delete this employee.');
        }

        return await this.dataService.employee.delete(id);
    }
}
