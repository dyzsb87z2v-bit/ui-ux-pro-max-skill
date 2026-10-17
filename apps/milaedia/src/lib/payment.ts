/**
 * MiLAEDiA — payment integration point.
 *
 * ============================================================
 * THIS IS THE ONLY PLACE A PAYMENT PROVIDER IS TOUCHED.
 *
 * No provider credentials exist yet, so `createPaymentSession` throws
 * `PaymentNotConfigured`. The checkout UI catches it and shows an honest
 * "payment not yet connected" state — it NEVER reports a successful payment.
 *
 * To connect a provider:
 *   1. add its SDK and keys as environment variables
 *   2. implement createPaymentSession() below
 *   3. delete the throw
 * Nothing else in the application changes.
 * ============================================================
 */
import type { BagLine } from './bag';

export class PaymentNotConfigured extends Error {
  constructor() {
    super('No payment provider is configured for this deployment.');
    this.name = 'PaymentNotConfigured';
  }
}

export interface CheckoutContact {
  email: string; name: string; address1: string; address2?: string;
  postcode: string; city: string; country: string; notes?: string;
}

export interface PaymentSession { url: string; reference: string; }

export const PAYMENT_PROVIDER: string | null = null;   // e.g. 'stripe'

export async function createPaymentSession(
  _lines: BagLine[], _contact: CheckoutContact, _currency: string,
): Promise<PaymentSession> {
  if (!PAYMENT_PROVIDER) throw new PaymentNotConfigured();
  throw new PaymentNotConfigured();
}

/** Order reference. Real orders are created server-side once a provider exists. */
export function draftReference() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `ML-${stamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
