/**
 * MiLAEDiA — hybrid inventory model.
 *
 * Three modes: one_of_one / stocked / made_to_order. (Spec §13)
 *
 * Availability is DERIVED at read time and never stored. Storing it
 * guarantees drift between sold_at, reserved_until and what the page says.
 */

import type { Availability, InventoryMode } from '../data/site';

export interface ProductInventory {
  mode: InventoryMode;
  /** 1 for one_of_one; 0..n for stocked; null for made_to_order. */
  stockQty: number | null;
  /** 0..n; always 0 for made_to_order. */
  reservedQty: number;
  /** one_of_one only. Non-null means permanently sold. */
  soldAt: Date | null;
  /** one_of_one only. A hold by some cart. */
  reservedUntil: Date | null;
  /** made_to_order only. Must be shown before add-to-bag. */
  leadTimeDays: number | null;
  /** stocked only. Value is a business input — see launchInputs. */
  lowThreshold: number | null;
}

export interface AvailabilityResult {
  availability: Availability;
  purchasable: boolean;
  /** Copy is caller-supplied; this is the semantic slot only. */
  leadTimeDays?: number;
  reservedUntil?: Date;
}

const DEFAULT_LOW_THRESHOLD = 3; // PLACEHOLDER — configurable, see §13 class B

export function deriveAvailability(
  inv: ProductInventory,
  now: Date = new Date(),
): AvailabilityResult {
  switch (inv.mode) {
    case 'one_of_one': {
      // Permanent. The page stays published as archive — for a one-of-one
      // gallery the sold archive is provenance. (Spec §13)
      if (inv.soldAt) return { availability: 'SoldOut', purchasable: false };
      if (inv.reservedUntil && inv.reservedUntil > now) {
        return {
          availability: 'Reserved',
          purchasable: false,
          reservedUntil: inv.reservedUntil,
        };
      }
      return { availability: 'InStock', purchasable: true };
    }

    case 'stocked': {
      const available = (inv.stockQty ?? 0) - inv.reservedQty;
      if (available <= 0) return { availability: 'OutOfStock', purchasable: false };
      const low = inv.lowThreshold ?? DEFAULT_LOW_THRESHOLD;
      if (available <= low) {
        return { availability: 'LimitedAvailability', purchasable: true };
      }
      return { availability: 'InStock', purchasable: true };
    }

    case 'made_to_order': {
      // Never sold out. Lead time must be shown before add-to-bag.
      return {
        availability: 'PreOrder',
        purchasable: true,
        leadTimeDays: inv.leadTimeDays ?? undefined,
      };
    }
  }
}

/**
 * schema.org ItemAvailability mapping. Sold pages stay in the sitemap.
 * (Spec §22)
 */
export function schemaAvailability(a: Availability): string {
  const base = 'https://schema.org/';
  switch (a) {
    case 'InStock':             return base + 'InStock';
    case 'LimitedAvailability': return base + 'LimitedAvailability';
    case 'Reserved':            return base + 'InStock'; // held, not sold
    case 'OutOfStock':          return base + 'OutOfStock';
    case 'SoldOut':             return base + 'SoldOut';
    case 'PreOrder':            return base + 'PreOrder';
  }
}

/**
 * Visual state, expressed in the system's own language.
 *
 * The references contain NO badge, pill, ribbon or overlay, and no shadows.
 * So inventory state is carried by colour temperature and type, not by
 * borrowed ecommerce chrome:
 *   gold   = interactive / available
 *   silver = neutral / not purchasable
 * (Spec §13, Forensics §07)
 */
export function stateTone(a: Availability): 'gold' | 'silver' {
  return a === 'SoldOut' || a === 'OutOfStock' || a === 'Reserved'
    ? 'silver'
    : 'gold';
}

/**
 * Reservation exclusivity for one_of_one is enforced at the DATABASE, not
 * here. Application-level checks lose the race, and for a unique piece
 * losing the race means selling the same rug twice.
 *
 *   CREATE UNIQUE INDEX one_of_one_hold
 *     ON cart_item (product_id)
 *     WHERE reserved_until > CURRENT_TIMESTAMP;
 *
 * A concurrent add must fail on the constraint and be surfaced as
 * "Reserved", never silently oversell.
 */
export const RESERVATION_INDEX_SQL = `
CREATE UNIQUE INDEX IF NOT EXISTS one_of_one_hold
  ON cart_item (product_id)
  WHERE reserved_until > CURRENT_TIMESTAMP;
`.trim();
