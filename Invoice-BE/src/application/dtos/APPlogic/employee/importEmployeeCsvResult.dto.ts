export class ImportEmployeeCsvResultDto {
  created: number;
  skipped: number;
  errors: Array<{
    row: number;
    data: Record<string, string>;
    errors: string[];
  }>;
  totalRows: number;
}
