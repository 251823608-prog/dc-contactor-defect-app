export interface BarcodeData {
  productModel: string;
  workOrderNumber: string;
  recordDate: string;
}

export function parseBarcode(raw: string): BarcodeData | null {
  const parts = raw.split(';').map((s) => s.trim());
  if (parts.length < 3) return null;
  return {
    productModel: parts[0] || '',
    workOrderNumber: parts[1] || '',
    recordDate: parts[2] || '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BarcodeDetectorNative = any;

export function supportsBarcodeDetector(): boolean {
  return 'BarcodeDetector' in globalThis;
}

export function createBarcodeDetector(): BarcodeDetectorNative | null {
  if (!supportsBarcodeDetector()) return null;
  try {
    const Ctor = (globalThis as Record<string, unknown>).BarcodeDetector as new (opts: { formats: string[] }) => { detect: (el: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
    return new Ctor({
      formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39'],
    });
  } catch {
    return null;
  }
}
