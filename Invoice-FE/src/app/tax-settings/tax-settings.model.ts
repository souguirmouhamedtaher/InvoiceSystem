export type TaxSetting = {
  _id: string;
  name: string;
  taxType: 'TVA' | 'RE';
  taxprice: number;
  isactive: boolean;
  notes?: string;
};
