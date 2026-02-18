import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { Employee } from 'src/domain/entities';
import { CreateEmployeeDto, ImportEmployeeCsvDto, UpdateEmployeeDto } from '../dtos';
import { Types } from 'mongoose';
import { CompanyRole } from 'src/domain/enums/companyRole.enums';
import { Role } from 'src/domain/enums/role.enums';

type RequestUser = {
    _id: string;
    roles?: string[];
};

@Injectable()
export class EmployeeUseCases {
    constructor(private dataService: IDataServices) {}

    async getAllEmployees(
        user: RequestUser,
        page: number = 1,
        limit: number = 20,
        search?: { [key: string]: any }
    ): Promise<{ employees: Employee[]; totalEmployees: number }> {
        const query: any = { deletedAt: null };
        const orQueries: any[] = [];
        let companyIdFilter: string | undefined;

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
                    companyIdFilter = value;
                    query[key] = new Types.ObjectId(value);
                } else {
                    query[key] = value;
                }
            }
        }

        if (!this.isAdmin(user.roles)) {
            if (!companyIdFilter) {
                throw new ForbiddenException('companyId is required.');
            }
            await this.assertCompanyMembership(user._id, companyIdFilter, [CompanyRole.OWNER, CompanyRole.MANAGER]);
        }

        const finalQuery = orQueries.length > 0 ? { $and: [query, { $or: orQueries }] } : query;
        const employees = await this.dataService.employee.findAllByAttributeWithFilter(
            finalQuery,
            page,
            limit,
            { createdAt: -1 }
        );
        const totalEmployees = await this.dataService.employee.count(finalQuery);

        return { employees: employees || [], totalEmployees };
    }

    async getEmployeeById(user: RequestUser, id: string): Promise<Employee> {
        const employee = await this.dataService.employee.get(id);
        if (!employee) throw new NotFoundException('Employee not found.');

        if (!this.isAdmin(user.roles)) {
            const companyId = this.getEmployeeCompanyId(employee);
            if (!companyId) {
                throw new ForbiddenException('Access denied');
            }
            await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.MANAGER]);
        }

        return employee;
    }

    async createEmployee(user: RequestUser, payload: CreateEmployeeDto): Promise<Employee> {
        const company = await this.dataService.company.get(payload.companyId);
        if (!company) throw new NotFoundException('Company not found.');

        if (!this.isAdmin(user.roles)) {
            await this.assertCompanyMembership(user._id, payload.companyId, [CompanyRole.OWNER, CompanyRole.MANAGER]);
        }

        const employee = {
            ...payload,
            companyId: new Types.ObjectId(payload.companyId),
            userId: new Types.ObjectId(user._id),
            monthlyNetSalary: Number(payload.monthlyNetSalary || 0),
            cnssRatePercent: payload.cnssApplicable ? Number(payload.cnssRatePercent || 0) : 0,
        } as Employee;

        return await this.dataService.employee.create(employee);
    }

    async updateEmployee(user: RequestUser, id: string, payload: UpdateEmployeeDto): Promise<Employee> {
        const existing = await this.dataService.employee.get(id);
        if (!existing) throw new NotFoundException('Employee not found.');

        if (!this.isAdmin(user.roles)) {
            const companyId = this.getEmployeeCompanyId(existing);
            if (!companyId) {
                throw new ForbiddenException('You do not have permission to update this employee.');
            }
            await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.MANAGER]);
        }

        if (payload.companyId) {
            const company = await this.dataService.company.get(payload.companyId);
            if (!company) throw new NotFoundException('Company not found.');

            if (!this.isAdmin(user.roles)) {
                await this.assertCompanyMembership(user._id, payload.companyId, [CompanyRole.OWNER, CompanyRole.MANAGER]);
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

        if (payload.companyId) {
            (payload as any).companyId = new Types.ObjectId(payload.companyId);
        }

        return await this.dataService.employee.update(id, payload as any);
    }

    async getMonthlyPayrollSummary(user: RequestUser, month?: string, companyId?: string) {
        // Use current month if not provided
        const currentDate = new Date();
        const finalMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        if (!/^\d{4}-\d{2}$/.test(finalMonth)) {
            throw new BadRequestException('Invalid month format. Use YYYY-MM.');
        }

        const isAdmin = this.isAdmin(user.roles);
        let employeeIds: Types.ObjectId[] = [];
        let companyEmployees: Employee[] = [];

        if (companyId) {
            const company = await this.dataService.company.get(companyId);
            if (!company) throw new NotFoundException('Company not found.');

            if (!isAdmin) {
                await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.MANAGER]);
            }

            companyEmployees = await this.dataService.employee.findAllByAttributeWithFilter(
                { deletedAt: null, companyId: new Types.ObjectId(companyId) },
                1,
                100000
            ) || [];
            employeeIds = companyEmployees.map(emp => emp._id);
        } else if (!isAdmin) {
            throw new ForbiddenException('companyId is required.');
        }

        const salaryQuery: any = { deletedAt: null, month: finalMonth };
        const cnssQuery: any = { deletedAt: null, month: finalMonth };

        if (companyId && employeeIds.length > 0) {
            salaryQuery.employeeId = { $in: employeeIds };
            cnssQuery.employeeId = { $in: employeeIds };
        }

        // Get all salaries for the month
        const salaries = await this.dataService.salary.findAllByAttributeWithFilter(salaryQuery, 1, 10000);
        const totalSalaryAmount = salaries?.reduce((sum, s) => sum + (Number(s.netAmount) || 0), 0) || 0;

        // Get all CNSS payments for the month
        const cnssPayments = await this.dataService.cnssPayment.findAllByAttributeWithFilter(cnssQuery, 1, 10000);
        const totalCnssAmount = cnssPayments?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;

        // Prévisionnel: sum from employees when no payroll generated yet (for selected company)
        let expectedSalaryAmount = 0;
        let expectedCnssAmount = 0;
        if (companyEmployees.length > 0) {
            for (const emp of companyEmployees) {
                const net = Number(emp.monthlyNetSalary || 0);
                expectedSalaryAmount += net;
                if (emp.cnssApplicable && Number(emp.cnssRatePercent || 0) > 0) {
                    expectedCnssAmount += this.roundToTwo((net * Number(emp.cnssRatePercent || 0)) / 100);
                }
            }
            expectedSalaryAmount = this.roundToTwo(expectedSalaryAmount);
        }

        return {
            month: finalMonth,
            totalSalaryAmount,
            totalCnssAmount,
            salaryCount: salaries?.length || 0,
            cnssCount: cnssPayments?.length || 0,
            employeeCount: companyEmployees.length,
            expectedSalaryAmount,
            expectedCnssAmount,
        };
    }

    async generateMonthlyPayroll(user: RequestUser, month: string, companyId?: string) {
        if (!/^\d{4}-\d{2}$/.test(month)) {
            throw new BadRequestException('Invalid month format. Use YYYY-MM.');
        }

        const isAdmin = this.isAdmin(user.roles);
        if (!isAdmin) {
            if (!companyId) {
                throw new ForbiddenException('companyId is required.');
            }
            await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.MANAGER]);
        }

        const query: any = { deletedAt: null };
        if (companyId) {
            query.companyId = new Types.ObjectId(companyId);
        }

        const employees = await this.dataService.employee.findAllByAttributeWithFilter(query, 1, 100000);
        const payrollDate = this.getLastDayOfMonth(month);
        const userObjectId = new Types.ObjectId(user._id);

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
                    userId: userObjectId,
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
                userId: userObjectId,
                employeeId: employee._id,
                month,
                amount: cnssAmount,
                paymentDate: payrollDate,
                notes: 'Auto-generated',
            } as any);
            createdCnss++;
        }

        // Calculate total amounts from ALL salaries and CNSS for this month
        const salaryQuery: any = { deletedAt: null, month };
        const cnssQuery: any = { deletedAt: null, month };
        
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

    async importEmployeesFromCsv(
        user: RequestUser,
        payload: ImportEmployeeCsvDto
    ): Promise<{ created: number; skipped: number; errors: Array<{ row: number; data: Record<string, string>; errors: string[] }>; totalRows: number }> {
        const company = await this.dataService.company.get(payload.companyId);
        if (!company) throw new NotFoundException('Company not found.');

        if (!this.isAdmin(user.roles)) {
            await this.assertCompanyMembership(user._id, payload.companyId, [CompanyRole.OWNER, CompanyRole.MANAGER]);
        }

        const rows = this.parseCsvRows(payload.csv);
        if (rows.length === 0) {
            throw new BadRequestException('CSV is empty.');
        }

        const headers = rows[0].map((header) => header.trim());
        const dataRows = rows.slice(1);

        let created = 0;
        let skipped = 0;
        const errors: Array<{ row: number; data: Record<string, string>; errors: string[] }> = [];

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const rowNumber = i + 2; // +2 because: +1 for header row, +1 for 1-based indexing
            const record: Record<string, string> = {};
            headers.forEach((header, index) => {
                record[header] = (row[index] || '').trim();
            });

            const rowErrors: string[] = [];
            const firstName = record.firstName || record.firstname || '';
            const lastName = record.lastName || record.lastname || '';

            if (!firstName) {
                rowErrors.push('First name is required');
            }
            if (!lastName) {
                rowErrors.push('Last name is required');
            }

            const cnssApplicableValue = (record.cnssApplicable || '').toLowerCase();
            const cnssApplicable = ['true', '1', 'yes', 'oui'].includes(cnssApplicableValue);
            const monthlyNetSalary = Number(record.monthlyNetSalary || 0);
            const cnssRatePercent = cnssApplicable ? Number(record.cnssRatePercent || 0) : 0;

            if (record.monthlyNetSalary && Number.isNaN(monthlyNetSalary)) {
                rowErrors.push('Monthly net salary must be a valid number');
            }
            if (cnssApplicable && record.cnssRatePercent && Number.isNaN(cnssRatePercent)) {
                rowErrors.push('CNSS rate percent must be a valid number');
            }
            if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
                rowErrors.push('Email format is invalid');
            }

            if (rowErrors.length > 0) {
                skipped++;
                errors.push({ row: rowNumber, data: record, errors: rowErrors });
                continue;
            }

            try {
                const employee: Employee = {
                    companyId: new Types.ObjectId(payload.companyId),
                    userId: new Types.ObjectId(user._id),
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: record.email || undefined,
                    phone: record.phone || undefined,
                    cnssApplicable,
                    monthlyNetSalary: Number.isNaN(monthlyNetSalary) ? 0 : monthlyNetSalary,
                    cnssRatePercent: Number.isNaN(cnssRatePercent) ? 0 : cnssRatePercent,
                    notes: record.notes || undefined,
                } as Employee;

                await this.dataService.employee.create(employee);
                created++;
            } catch (error) {
                skipped++;
                errors.push({ row: rowNumber, data: record, errors: [error.message || 'Failed to create employee'] });
            }
        }

        await this.dataService.auditLog.create({
            userId: user._id,
            companyId: payload.companyId,
            action: 'EMPLOYEE_CSV_IMPORT',
            entityType: 'employee',
            metadata: {
                created,
                skipped,
                totalRows: dataRows.length,
                errorCount: errors.length,
            },
        } as any);

        return { created, skipped, errors, totalRows: dataRows.length };
    }

    async exportEmployeesCsv(user: RequestUser, companyId: string): Promise<string> {
        if (!companyId || typeof companyId !== 'string' || !Types.ObjectId.isValid(companyId)) {
            throw new BadRequestException('Valid companyId is required.');
        }
        const company = await this.dataService.company.get(companyId);
        if (!company) throw new NotFoundException('Company not found.');

        if (!this.isAdmin(user.roles)) {
            await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.MANAGER]);
        }

        const employees = await this.dataService.employee.findAllByAttributeWithFilter(
            { deletedAt: null, companyId: new Types.ObjectId(companyId) },
            1,
            100000
        );

        const headers = [
            'companyId',
            'firstName',
            'lastName',
            'email',
            'phone',
            'cnssApplicable',
            'monthlyNetSalary',
            'cnssRatePercent',
            'notes',
        ];

        const rows = (employees || []).map((employee) => [
            companyId,
            employee.firstName || '',
            employee.lastName || '',
            employee.email || '',
            employee.phone || '',
            employee.cnssApplicable ? 'true' : 'false',
            String(employee.monthlyNetSalary ?? ''),
            String(employee.cnssRatePercent ?? ''),
            employee.notes || '',
        ]);

        const csv = [headers, ...rows]
            .map((row) => row.map((value) => this.toCsvValue(value)).join(','))
            .join('\n');

        try {
            await this.dataService.auditLog.create({
                userId: new Types.ObjectId(user._id),
                companyId: new Types.ObjectId(companyId),
                action: 'EMPLOYEE_CSV_EXPORT',
                entityType: 'employee',
                metadata: {
                    count: rows.length,
                },
            } as any);
        } catch {
            // Don't fail export if audit log fails
        }

        return csv;
    }

    private isAdmin(roles?: string[]): boolean {
        return roles?.includes(Role.SUPERADMIN) ?? false;
    }

    /** Get company ID string from employee (handles populated companyId object or raw ObjectId). */
    private getEmployeeCompanyId(employee: Employee): string | undefined {
        const c = (employee as any).companyId;
        if (c == null) return undefined;
        const id = (typeof c === 'object' && c !== null && '_id' in c) ? (c._id ?? c) : c;
        return id?.toString?.() ?? undefined;
    }

    private async assertCompanyMembership(
        userId: string,
        companyId: string,
        allowedRoles: CompanyRole[]
    ): Promise<void> {
        const allowOwner = allowedRoles.includes(CompanyRole.OWNER);
        if (allowOwner) {
            const owned = await this.dataService.company.findAllByAttributeWithFilter(
                { _id: new Types.ObjectId(companyId), userId: new Types.ObjectId(userId) },
                1,
                1
            );
            if (owned?.length) return;
        }

        const membership = await this.dataService.companyMembership.findAllByAttributeWithFilter(
            {
                deletedAt: null,
                userId: new Types.ObjectId(userId),
                companyId: new Types.ObjectId(companyId),
            },
            1,
            1
        );

        if (!membership || membership.length === 0) {
            throw new ForbiddenException('Access denied');
        }

        const role = (membership[0].role as string)?.toLowerCase?.() ?? membership[0].role;
        const rolesToCheck = allowedRoles.filter((r) => r !== CompanyRole.OWNER) as string[];
        if (rolesToCheck.length && !rolesToCheck.includes(role)) {
            throw new ForbiddenException('Insufficient role for this action.');
        }
    }

    private parseCsvRows(csv: string): string[][] {
        const rows: string[][] = [];
        let current = '';
        let row: string[] = [];
        let inQuotes = false;

        for (let i = 0; i < csv.length; i++) {
            const char = csv[i];
            const next = csv[i + 1];

            if (char === '"') {
                if (inQuotes && next === '"') {
                    current += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (char === ',' && !inQuotes) {
                row.push(current);
                current = '';
                continue;
            }

            if ((char === '\n' || char === '\r') && !inQuotes) {
                if (char === '\r' && next === '\n') {
                    i += 1;
                }
                row.push(current);
                if (row.some((value) => value.trim().length > 0)) {
                    rows.push(row);
                }
                row = [];
                current = '';
                continue;
            }

            current += char;
        }

        row.push(current);
        if (row.some((value) => value.trim().length > 0)) {
            rows.push(row);
        }

        return rows;
    }

    private toCsvValue(value: string | number | undefined | null): string {
        const stringValue = value != null && value !== '' ? String(value) : '';
        if (stringValue.includes('"')) {
            const escaped = stringValue.replace(/"/g, '""');
            return `"${escaped}"`;
        }
        if (/[\n,]/.test(stringValue)) {
            return `"${stringValue}"`;
        }
        return stringValue;
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

    async deleteEmployee(user: RequestUser, id: string): Promise<boolean> {
        const existing = await this.dataService.employee.get(id);
        if (!existing) throw new NotFoundException('Employee not found.');

        if (!this.isAdmin(user.roles)) {
            const companyId = this.getEmployeeCompanyId(existing);
            if (!companyId) {
                throw new ForbiddenException('You do not have permission to delete this employee.');
            }
            await this.assertCompanyMembership(user._id, companyId, [CompanyRole.OWNER, CompanyRole.MANAGER]);
        }

        return await this.dataService.employee.delete(id);
    }

    /**
    * My companies + invited memberships. Single source of truth from DB.
    * 1. companies collection: userId = current user → OWNER
    * 2. company_memberships collection: userId = current user → MANAGER/ACCOUNTANT
    * Every item has companyId: { _id: string, companyname: string }, role: string.
     */
    async getUserMemberships(userId: string): Promise<{ memberships: any[] }> {
        const uid = (userId != null && userId !== '') ? String(userId).trim() : '';
        console.log('[my-memberships] UseCase: userId param=', userId, 'uid=', uid);
        if (!uid || uid === 'undefined') {
            console.log('[my-memberships] UseCase: returning empty (invalid uid)');
            return { memberships: [] };
        }

        let objectId: Types.ObjectId;
        try {
            objectId = new Types.ObjectId(uid);
        } catch (e) {
            console.log('[my-memberships] UseCase: ObjectId(uid) failed', e);
            return { memberships: [] };
        }

        const list: any[] = [];

        // 1. Owned: from "companies" collection (userId = me, type mycompany)
        let ownedRaw = await this.dataService.company.findAllByAttributeWithFilter(
            { userId: objectId },
            1,
            500
        );
        if (!ownedRaw?.length) {
            ownedRaw = await this.dataService.company.findAllByAttributeWithFilter(
                { userId: uid },
                1,
                500
            ) || [];
            if (ownedRaw.length) console.log('[my-memberships] UseCase: found owned with userId as string');
        }
        const owned = ownedRaw || [];
        console.log('[my-memberships] UseCase: owned raw count=', ownedRaw?.length ?? 0, 'userId=', uid);
        if (owned.length) {
            console.log('[my-memberships] UseCase: first owned _id=', owned[0]?._id?.toString?.(), 'companyname=', owned[0]?.companyname);
        }
        for (const c of owned) {
            const cid = c._id?.toString?.();
            if (!cid) continue;
            list.push({
                _id: `owner-${cid}`,
                userId: uid,
                companyId: {
                    _id: cid,
                    companyname: c.companyname ?? '',
                },
                role: 'OWNER',
            });
        }

        // 2. Invited: from "company_memberships" collection
        const invited = await this.dataService.companyMembership.findAllByAttributeWithFilter(
            { deletedAt: null, userId: objectId },
            1,
            500
        );
        console.log('[my-memberships] UseCase: invited memberships count=', invited?.length ?? 0);
        const seenIds = new Set(list.map((x) => x.companyId._id));
        for (const m of invited || []) {
            const doc = (m as any)?.toObject?.() ?? m;
            const cid = doc.companyId?._id?.toString?.() ?? doc.companyId?.toString?.();
            if (!cid || seenIds.has(cid)) continue;
            seenIds.add(cid);
            const role = (doc.role?.toUpperCase?.() || doc.role) ?? 'MANAGER';
            list.push({
                _id: doc._id?.toString?.() ?? `invited-${cid}`,
                userId: uid,
                companyId: {
                    _id: cid,
                    companyname: doc.companyId?.companyname ?? '',
                },
                role,
            });
        }

        console.log('[my-memberships] UseCase: returning total memberships=', list.length);
        return { memberships: list };
    }
}
