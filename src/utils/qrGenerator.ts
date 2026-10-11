/**
 * Simple, robust QR Code generator for URL/Text in SVG format.
 * Uses standard Google Chart / QuickChart API with SVG fallback for crisp sticker printing.
 */

export function getQrCodeImageUrl(text: string, size = 200): string {
  // QuickChart is fast, free, and returns crisp high-res QR codes
  const encoded = encodeURIComponent(text);
  return `https://quickchart.io/qr?text=${encoded}&size=${size}&margin=1&format=svg`;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function generateNextAssetCode(existingCodes: string[], prefix = 'VMI', category = 'LPT'): string {
  // Pattern: 001-VMI-LPT
  const regex = new RegExp(`^(\\d{3,4})-${prefix}-${category}$`, 'i');
  let maxSeq = 0;

  existingCodes.forEach(code => {
    const match = code.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });

  const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
  return `${nextSeq}-${prefix}-${category}`;
}

export function generateBastNumber(seq: number): string {
  const romawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const now = new Date();
  const monthRomawi = romawi[now.getMonth()];
  const year = now.getFullYear();
  const paddedSeq = seq.toString().padStart(3, '0');
  return `${paddedSeq}/BAST-IT/VMI/${monthRomawi}/${year}`;
}
