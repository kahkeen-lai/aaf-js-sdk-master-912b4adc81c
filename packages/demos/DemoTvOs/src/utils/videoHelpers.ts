export function toHttps(url?: string): string {
  return url ? url.replace('http://', 'https://') : '';
}
