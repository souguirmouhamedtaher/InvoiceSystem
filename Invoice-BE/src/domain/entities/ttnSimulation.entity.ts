import { Base } from './base.entity';

export type TtnSimulationStatus = 'ACCEPTED' | 'REJECTED';

export class TtnSimulation extends Base {
    invoiceId: any;
    companyId: any;
    userId: any;
    requestXml: string;
    responseXml?: string;
    status: TtnSimulationStatus;
    reference?: string;
    errors?: string[];
    source?: string;
    submittedAt?: Date;
    processedAt?: Date;
    durationMs?: number;
}
