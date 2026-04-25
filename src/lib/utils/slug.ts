export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD') // Decompose combined characters (e.g., 'é' -> 'e' + '´')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
