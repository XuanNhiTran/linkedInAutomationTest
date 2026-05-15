export function logInfo(message: string): void {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
}

export function logWarn(message: string): void {
  console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
}

export function logError(message: string, error?: unknown): void {
  if (error) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
    return;
  }
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
}
