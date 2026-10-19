// The rel of a link that opens a new tab; any other link has none.
export const relVan = (target: string | undefined) => (target === "_blank" ? "noopener" : undefined);
