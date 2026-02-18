import { Base } from './base.entity';
import { discountType, productType, unity } from '../enums/libelle.enums';

export class Libelle extends Base {
    companyId: any;
    name: string;
    description: string;
    qte: number;
    productType: productType;
    unity: unity;
    TaxSettingsId: any;
    prixTTC: string;
    prixHT: string;
    finalprixHT: string;
    finalprixTTC: string;
    amount_discount: number;
    percentage_discount: number;
    discountType: discountType;
}
