import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { Libelle } from 'src/domain/entities';
import { CreateLibelleDto, UpdateLibelleDto } from '../dtos';

@Injectable()
export class LibelleFactory {
  /**
   * Round to 2 decimal places (standard rounding for unit prices)
   */
  private roundToTwo(num: number): number {
    return Math.round(num * 100) / 100;
  }

  /**
   * Round UP to 2 decimal places for final amounts (supérieur)
   */
  private roundUpToTwo(num: number): number {
    return Math.ceil(num * 100) / 100;
  }

  /**
   * Calculate final prices for a libelle based on unit price, quantity, discount, and tax
   * Handles both prixHT and prixTTC inputs
   */
  private calculatePrices(
    prixHT: string | undefined,
    prixTTC: string | undefined,
    qte: number,
    amount_discount: number = 0,
    percentage_discount: number = 0,
    discountType: string | undefined,
    taxprice: number = 0 // Tax percentage (e.g., 19 for 19%)
  ): { finalprixHT: string; finalprixTTC: string; prixHT: string; prixTTC: string } {
    let unitPriceHT = 0;
    let unitPriceTTC = 0;

    // Determine which price was provided and calculate the other
    const hasHT = prixHT && parseFloat(prixHT) > 0;
    const hasTTC = prixTTC && parseFloat(prixTTC) > 0;

    if (hasHT && !hasTTC) {
      // User provided prixHT, calculate prixTTC (standard rounding)
      unitPriceHT = parseFloat(prixHT);
      unitPriceTTC = this.roundToTwo(unitPriceHT * (1 + taxprice / 100));
    } else if (hasTTC && !hasHT) {
      // User provided prixTTC, calculate prixHT (standard rounding)
      unitPriceTTC = parseFloat(prixTTC);
      unitPriceHT = this.roundToTwo(unitPriceTTC / (1 + taxprice / 100));
    } else if (hasHT && hasTTC) {
      // User provided both, keep them as is
      unitPriceHT = parseFloat(prixHT);
      unitPriceTTC = parseFloat(prixTTC);
    } else {
      // Both are 0 or undefined, return zeros
      return {
        finalprixHT: '0.00',
        finalprixTTC: '0.00',
        prixHT: '0.00',
        prixTTC: '0.00'
      };
    }
    
    // Calculate total HT before discount (use precise value)
    const totalHT = unitPriceHT * qte;
    
    // Apply discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (totalHT * (percentage_discount || 0)) / 100;
    } else if (discountType === 'amount') {
      discountAmount = amount_discount || 0;
    }
    
    // Final HT after discount
    const finalprixHT = totalHT - discountAmount;
    
    // Calculate TTC: add tax to final HT
    const taxAmount = (finalprixHT * taxprice) / 100;
    const finalprixTTC = finalprixHT + taxAmount;
    
    // Round final values UP (supérieur) but unit prices with standard rounding
    return {
      finalprixHT: this.roundUpToTwo(finalprixHT).toFixed(2),
      finalprixTTC: this.roundUpToTwo(finalprixTTC).toFixed(2),
      prixHT: unitPriceHT.toFixed(2),
      prixTTC: unitPriceTTC.toFixed(2)
    };
  }

  createLibelle(createLibelleDto: CreateLibelleDto, taxprice: number = 0): Libelle {
    const newLibelle = new Libelle();
    
    newLibelle.name = createLibelleDto.name;
    if (createLibelleDto.description) newLibelle.description = createLibelleDto.description;
    newLibelle.qte = createLibelleDto.qte;
    newLibelle.productType = createLibelleDto.productType;
    newLibelle.unity = createLibelleDto.unity;
    
    // Calculate prices based on what user provided
    const calculated = this.calculatePrices(
      createLibelleDto.prixHT,
      createLibelleDto.prixTTC,
      createLibelleDto.qte,
      createLibelleDto.amount_discount || 0,
      createLibelleDto.percentage_discount || 0,
      createLibelleDto.discountType,
      taxprice
    );
    
    newLibelle.prixHT = calculated.prixHT;
    newLibelle.prixTTC = calculated.prixTTC;
    newLibelle.finalprixHT = calculated.finalprixHT;
    newLibelle.finalprixTTC = calculated.finalprixTTC;
    
    if (createLibelleDto.amount_discount) newLibelle.amount_discount = createLibelleDto.amount_discount;
    if (createLibelleDto.percentage_discount) newLibelle.percentage_discount = createLibelleDto.percentage_discount;
    if (createLibelleDto.discountType) newLibelle.discountType = createLibelleDto.discountType;
    
    if (createLibelleDto.TexSettingsId) {
      newLibelle.TaxSettingsId = new Types.ObjectId(createLibelleDto.TexSettingsId);
    }
    
    newLibelle.createdAt = new Date();
    newLibelle.updatedAt = new Date();
    
    return newLibelle;
  }

  updateLibelle(updateLibelleDto: UpdateLibelleDto, taxprice: number = 0): Libelle {
    const updatedLibelle = new Libelle();
    
    if (updateLibelleDto.name) updatedLibelle.name = updateLibelleDto.name;
    if (updateLibelleDto.description) updatedLibelle.description = updateLibelleDto.description;
    if (updateLibelleDto.qte !== undefined) updatedLibelle.qte = updateLibelleDto.qte;
    if (updateLibelleDto.productType) updatedLibelle.productType = updateLibelleDto.productType;
    if (updateLibelleDto.unity) updatedLibelle.unity = updateLibelleDto.unity;
    
    // Recalculate if price or quantity changes
    const hasHT = updateLibelleDto.prixHT && parseFloat(updateLibelleDto.prixHT) > 0;
    const hasTTC = updateLibelleDto.prixTTC && parseFloat(updateLibelleDto.prixTTC) > 0;
    
    if (hasHT || hasTTC) {
      const qte = updateLibelleDto.qte || 1;
      const calculated = this.calculatePrices(
        updateLibelleDto.prixHT,
        updateLibelleDto.prixTTC,
        qte,
        updateLibelleDto.amount_discount || 0,
        updateLibelleDto.percentage_discount || 0,
        updateLibelleDto.discountType,
        taxprice
      );
      
      updatedLibelle.prixHT = calculated.prixHT;
      updatedLibelle.prixTTC = calculated.prixTTC;
      updatedLibelle.finalprixHT = calculated.finalprixHT;
      updatedLibelle.finalprixTTC = calculated.finalprixTTC;
    }
    
    if (updateLibelleDto.amount_discount !== undefined) updatedLibelle.amount_discount = updateLibelleDto.amount_discount;
    if (updateLibelleDto.percentage_discount !== undefined) updatedLibelle.percentage_discount = updateLibelleDto.percentage_discount;
    if (updateLibelleDto.discountType) updatedLibelle.discountType = updateLibelleDto.discountType;
    
    if (updateLibelleDto.TexSettingsId) {
      updatedLibelle.TaxSettingsId = new Types.ObjectId(updateLibelleDto.TexSettingsId);
    }
    
    updatedLibelle.updatedAt = new Date();
    
    return updatedLibelle;
  }
}
