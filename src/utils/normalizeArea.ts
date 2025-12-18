export function normalizeArea(input?: string): string {
  if (!input) return '';
  try {
    // Normalize unicode, remove diacritics, lowercase, trim and collapse whitespace
    const nfd = input.normalize ? input.normalize('NFD') : input;
    // Remove diacritic marks using Unicode property escape
    const stripped = nfd.replace(/\p{Diacritic}/gu, '');
    return stripped.trim().toLowerCase().replace(/\s+/g, ' ');
  } catch (e) {
    return (input || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }
}
