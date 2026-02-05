export type CreateLibellePayload = {
  name: string;
  description?: string;
  qte: number;
  productType: 'product' | 'service' | 'donation';
  unity: 'kg' | 'm' | 'hours' | 'day' | 'article' | 'month' | 'year';
  prixHT?: string;
  prixTTC?: string;
  amount_discount?: number;
  percentage_discount?: number;
  discountType?: 'amount' | 'percentage';
  TexSettingsId: string;
};

export type Libelle = {
  _id: string;
  name: string;
  qte: number;
  prixHT: string;
  prixTTC: string;
  finalprixHT: string;
  finalprixTTC: string;
};
