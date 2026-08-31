/** Structured data helpers. */
import type { Product } from '../data/catalogue';
import { deriveAvailability, schemaAvailability } from './inventory';

export const ORG = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MiLAEDiA',
  description: 'Persian Heritage. European Vision. Worldwide.',
  areaServed: ['DE', 'IR', 'HU'],
};

export function productSchema(p: Product, site: string) {
  const a = deriveAvailability({
    mode: p.inventoryMode, stockQty: p.stockQty, reservedQty: p.reservedQty,
    soldAt: p.soldAt ? new Date(p.soldAt) : null, reservedUntil: null,
    leadTimeDays: p.leadTimeDays, lowThreshold: p.lowThreshold,
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: p.summary,
    material: p.material,
    width: { '@type': 'QuantitativeValue', value: p.dimensionsCm[1], unitCode: 'CMT' },
    height: { '@type': 'QuantitativeValue', value: p.dimensionsCm[0], unitCode: 'CMT' },
    brand: { '@type': 'Brand', name: 'MiLAEDiA' },
    offers: {
      '@type': 'Offer',
      price: (p.priceMinor / 100).toFixed(2),
      priceCurrency: p.currency,
      availability: schemaAvailability(a.availability),
      url: `${site}/collections/${p.collection}/${p.slug}`,
    },
  };
}
