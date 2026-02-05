import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BrowserQRCodeReader } from '@zxing/browser';

@Component({
  selector: 'app-invoice-scan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-scan.component.html',
  styleUrl: './invoice-scan.component.scss',
})
export class InvoiceScanComponent {
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly infoMessage = signal<string | null>(null);
  protected readonly scanning = signal(false);

  constructor(private router: Router) {
    if (typeof window === 'undefined') {
      return;
    }
  }

  async handleFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    this.errorMessage.set(null);
    this.scanning.set(true);

    try {
      const dataUrl = await this.readFileAsDataUrl(file);
      const image = await this.loadImage(dataUrl);
      const reader = new BrowserQRCodeReader();
      const result = await reader.decodeFromImageElement(image);
      if (!result?.getText()) {
        this.errorMessage.set('Aucun QR code detecte.');
        return;
      }

      this.navigateFromQr(result.getText());
    } catch (error) {
      console.error('QR scan error', error);
      this.errorMessage.set('Impossible de lire le QR code.');
    } finally {
      this.scanning.set(false);
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(file);
    });
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Image load failed'));
      image.src = src;
    });
  }

  private navigateFromQr(rawValue: string): void {
    const trimmed = rawValue.trim();
    try {
      const payload = JSON.parse(trimmed);
      if (payload?.id) {
        this.router.navigate(['/invoices', payload.id]);
        return;
      }
    } catch {
      // ignore parsing errors, try direct navigation
    }

    if (/^[a-f0-9]{24}$/i.test(trimmed)) {
      this.router.navigate(['/invoices', trimmed]);
      return;
    }

    this.errorMessage.set('QR code invalide ou facture introuvable.');
  }
}
