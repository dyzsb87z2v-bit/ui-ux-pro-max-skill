/**
 * MiLAEDiA — bag (cart) state.
 *
 * Client-side, persisted in localStorage. The server-side order is created at
 * checkout through the isolated payment integration point in
 * `src/lib/payment.ts` — nothing here ever claims a payment succeeded.
 *
 * one_of_one reservation is enforced at the DATABASE, not here
 * (see RESERVATION_INDEX_SQL in inventory.ts). This module holds intent.
 */
export interface BagLine {
  productId: string;
  slug: string;
  title: string;
  priceMinor: number;
  currency: string;
  qty: number;
  /** one_of_one lines can never exceed 1. */
  maxQty: number;
  image: string;
  /** Canonical product URL, so the bag can link back. */
  href?: string;
}

const KEY = 'milaedia:bag:v1';
const EVT = 'milaedia:bag';

function read(): BagLine[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(lines: BagLine[]) {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent(EVT, { detail: lines }));
}

export const getBag = read;

export function bagCount(lines = read()) {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function subtotal(lines = read()) {
  return lines.reduce((n, l) => n + l.priceMinor * l.qty, 0);
}

export function addToBag(line: Omit<BagLine, 'qty'>, qty = 1) {
  const lines = read();
  const found = lines.find((l) => l.productId === line.productId);
  if (found) {
    found.qty = Math.min(found.maxQty, found.qty + qty);
  } else {
    lines.push({ ...line, qty: Math.min(line.maxQty, qty) });
  }
  write(lines);
  return lines;
}

export function setQty(productId: string, qty: number) {
  const lines = read();
  const l = lines.find((x) => x.productId === productId);
  if (!l) return lines;
  l.qty = Math.max(0, Math.min(l.maxQty, qty));
  const next = lines.filter((x) => x.qty > 0);
  write(next);
  return next;
}

export function removeLine(productId: string) {
  write(read().filter((l) => l.productId !== productId));
}

export function clearBag() { write([]); }

export function onBagChange(fn: (lines: BagLine[]) => void) {
  const handler = (e: Event) => fn((e as CustomEvent).detail ?? read());
  window.addEventListener(EVT, handler);
  window.addEventListener('storage', () => fn(read()));
  return () => window.removeEventListener(EVT, handler);
}

/**
 * Shipping. DEMO VALUES — the real model is a launch input (§C).
 * High-value freight is quoted per destination in practice.
 */
export const SHIPPING_FLAT_MINOR = 0;   // 0 = "quoted after checkout"
export const shippingLabel = 'Quoted after checkout';

/** VAT. DEMO — real handling is a launch input; most PSPs compute it. */
export const VAT_NOTE = 'Prices include VAT where applicable.';
