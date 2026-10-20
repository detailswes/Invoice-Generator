/** Pragmatic single-address check (no display names, lists or quoted locals). */
export function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@,;<>"()]+@[^\s@,;<>"()]+\.[^\s@,;<>"()]{2,}$/.test(value);
}
