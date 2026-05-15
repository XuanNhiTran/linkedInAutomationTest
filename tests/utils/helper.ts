export function generateRandomArray(length: number): string[] {
  return Array.from({ length }, () => String(Math.floor(Math.random() * 99) + 1));
}
