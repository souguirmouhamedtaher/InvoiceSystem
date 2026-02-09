import { Base } from './base.entity';

export class AuditLog extends Base {
    userId: any;
    companyId?: any;
    action: string;
    entityType: string;
    entityId?: any;
    metadata?: Record<string, any>;
}
