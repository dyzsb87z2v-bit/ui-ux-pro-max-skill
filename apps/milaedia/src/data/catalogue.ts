/**
 * MiLAEDiA — demo catalogue.
 *
 * ============================================================
 * THIS IS DEMO DATA. Every record here is clearly replaceable.
 * Replace this file (or swap it for a D1 query / CMS fetch) with the real
 * catalogue. The shape is the production shape — see src/lib/inventory.ts
 * for the availability rules these fields drive.
 *
 * Prices are in MINOR UNITS (cents). Currency is per-record so multi-market
 * pricing can be added later without a schema change.
 * ============================================================
 */
import type { InventoryMode } from './site';

export interface Product {
  id: string;
  slug: string;
  title: string;
  collection: string;              // collection slug
  /** Minor units. */
  priceMinor: number;
  currency: 'EUR';
  inventoryMode: InventoryMode;
  stockQty: number | null;
  reservedQty: number;
  soldAt: string | null;
  leadTimeDays: number | null;
  lowThreshold: number | null;

  origin: string;
  material: string;
  weave: string;
  knotDensity: string;
  dimensionsCm: [number, number];
  ageNote: string | null;

  summary: string;
  description: string;
  care: string;

  /** Asset key into src/assets/collections — DEMO: every product currently
   *  reuses its collection's verified texture. Replace with real product
   *  photography (texture crop for rugs, full scene for tapestries). */
  image: string;
  /** Path to a GLB/GLTF model. null => the viewer uses its fallback mode. */
  model: string | null;
}

const eur = (n: number) => Math.round(n * 100);

/**
 * The catalogue is DATA, not code, so the admin can rewrite it safely.
 * Editing it is a commit to catalogue.json; the types below still apply and
 * the build still fails if a record does not satisfy them.
 */
import catalogue from './catalogue.json';

export const products: Product[] = catalogue as Product[];

export const bySlug = (slug: string) => products.find((p) => p.slug === slug);
export const byCollection = (c: string) => products.filter((p) => p.collection === c);

export function formatPrice(minor: number, currency: string, locale = 'en-DE') {
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(minor / 100);
}

/** Collection editorial copy. Neutral and editable — no historical claims. */
export const collectionCopy: Record<string, string> = {
  'antique-rugs':
    'Pieces carrying a century or more of use. Each is singular: what has faded, and how, is part of what is being bought.',
  'handwoven-silk-rugs':
    'Silk knotted at the density the fibre allows. These pieces read as two colourways depending on where you stand.',
  'luxury-rugs':
    'Contemporary weaving from named workshops, in kork wool and silk. Made now, to the standards of the archive.',
  'antique-silk-tapestries':
    'Pictorial silk intended for the wall. Knot counts high enough to carry modelling a floor weave cannot hold.',
  'luxury-silk-tapestries':
    'Contemporary pictorial silk. Composition drawn first, palette held deliberately narrow.',
};
