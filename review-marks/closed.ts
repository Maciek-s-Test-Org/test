// Review-mark validation fixture: closed.ts

export const extra0 = 0;
export const extra1 = 1;
export const extra2 = 2;

export function first(input: number): number {
  const offset = 10;
  const doubled = input * 2;
  const shifted = doubled + offset;
  return shifted;
}

export function second(input: number): number {
  const offset = 2;
  const doubled = input * 2;
  const shifted = doubled + offset;
  return shifted;
}

export function third(input: number): number {
  const offset = 3;
  const doubled = input * 2;
  const shifted = doubled + offset;
  return shifted;
}
