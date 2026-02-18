import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IDataServices } from 'src/domain/abstracts';
import { Supplier } from 'src/domain/entities';
import { CreateSupplierDto, UpdateSupplierDto } from '../dtos';
import { Types } from 'mongoose';
import { Role } from 'src/domain/enums/role.enums';
import { CompanyRole } from 'src/domain/enums/companyRole.enums';

type RequestUser = {
  _id: string | Types.ObjectId;
  roles?: string[];
};

@Injectable()
export class SupplierUseCases {
  constructor(private dataService: IDataServices) {}

  private isAdmin(roles?: string[]): boolean {
    return Boolean(
      roles?.some((role) => {
        const lowered = role.toLowerCase();
        return lowered === Role.SUPERADMIN || lowered === 'superadmin';
      })
    );
  }

  private async assertCompanyAccess(user: RequestUser, companyId: string): Promise<void> {
    if (this.isAdmin(user.roles)) return;

    const owned = await this.dataService.company.findAllByAttributeWithFilter(
      { _id: new Types.ObjectId(companyId), userId: new Types.ObjectId(user._id) },
      1,
      1
    );

    if (owned?.length) return;

    const memberships = await this.dataService.companyMembership.findAllByAttributeWithFilter(
      {
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
        userId: new Types.ObjectId(user._id),
        companyId: new Types.ObjectId(companyId),
        role: { $in: [CompanyRole.OWNER, CompanyRole.MANAGER] },
      },
      1,
      1
    );

    if (!memberships?.length) {
      throw new ForbiddenException('Access denied.');
    }
  }

  async getAllSuppliers(
    user: RequestUser,
    companyId: string,
    page: number = 1,
    limit: number = 20,
    search?: { [key: string]: any }
  ): Promise<{ suppliers: Supplier[]; totalSuppliers: number }> {
    if (!companyId) throw new BadRequestException('companyId is required.');
    await this.assertCompanyAccess(user, companyId);

    const query: any = { deletedAt: null, companyId: new Types.ObjectId(companyId) };
    const orQueries: any[] = [];

    if (search) {
      for (const [key, value] of Object.entries(search)) {
        if (['name', 'email', 'address', 'phone'].includes(key) && typeof value === 'string') {
          orQueries.push({ [key]: { $regex: value, $options: 'i' } });
        } else if (key === 'search' && typeof value === 'string') {
          const searchRegex = { $regex: value, $options: 'i' };
          orQueries.push({ name: searchRegex });
          orQueries.push({ email: searchRegex });
          orQueries.push({ address: searchRegex });
        } else {
          query[key] = value;
        }
      }
    }

    const finalQuery = orQueries.length > 0 ? { $and: [query, { $or: orQueries }] } : query;
    const suppliers = await this.dataService.supplier.findAllByAttributeWithFilter(finalQuery, page, limit);
    const totalSuppliers = await this.dataService.supplier.count(finalQuery);

    return { suppliers: suppliers || [], totalSuppliers };
  }

  async getSupplierById(user: RequestUser, id: string): Promise<Supplier> {
    const supplier = await this.dataService.supplier.get(id);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    const companyId = (supplier as any).companyId?._id ?? (supplier as any).companyId;
    if (companyId) await this.assertCompanyAccess(user, companyId.toString());
    return supplier;
  }

  async createSupplier(user: RequestUser, payload: CreateSupplierDto): Promise<Supplier> {
    await this.assertCompanyAccess(user, payload.companyId);

    const existing = await this.dataService.supplier.findByAttribute('email', payload.email.toLowerCase());
    if (existing && !existing.deletedAt) {
      throw new ConflictException('Supplier with this email already exists.');
    }

    const supplier = {
      ...payload,
      companyId: new Types.ObjectId(payload.companyId),
      email: payload.email.toLowerCase(),
    } as any;

    return await this.dataService.supplier.create(supplier);
  }

  async updateSupplier(user: RequestUser, id: string, payload: UpdateSupplierDto): Promise<Supplier> {
    const existing = await this.dataService.supplier.get(id);
    if (!existing) throw new NotFoundException('Supplier not found.');

    const companyId = (existing as any).companyId?._id ?? (existing as any).companyId;
    if (companyId) await this.assertCompanyAccess(user, companyId.toString());

    const nextPayload: any = { ...payload };
    if (payload.email) nextPayload.email = payload.email.toLowerCase();
    if (payload.companyId) nextPayload.companyId = new Types.ObjectId(payload.companyId);

    return await this.dataService.supplier.update(id, nextPayload);
  }

  async deleteSupplier(user: RequestUser, id: string): Promise<boolean> {
    const existing = await this.dataService.supplier.get(id);
    if (!existing) throw new NotFoundException('Supplier not found.');

    const companyId = (existing as any).companyId?._id ?? (existing as any).companyId;
    if (companyId) await this.assertCompanyAccess(user, companyId.toString());

    return await this.dataService.supplier.delete(id);
  }
}
