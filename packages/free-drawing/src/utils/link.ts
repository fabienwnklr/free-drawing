/** Protocols of links of shapes: web pages and emails (no `javascript:`, `data:`...) */
export const linkProtocols = ['http:', 'https:', 'mailto:'];

/** Longest link of a shape, in characters */
export const maxLinkLength = 2048;

/**
 * Link of a shape from a typed address or from a `link` attribute (files, links and changes of collaborators come from
 * anyone): web page or email address
 * @param value typed address (`https://` added without protocol, `mailto:` for an email address) or attribute
 * @returns normalized url, null when empty, too long, invalid or of another protocol
 */
export function parseLink(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const text = value.trim();

  if (!text || text.length > maxLinkLength) return null;

  // protocol given (`https://`, `mailto:`), else email address or web page
  const hasProtocol = /^([a-z][a-z\d+.-]*:\/\/|mailto:)/i.test(text);
  const isEmail = /^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/.test(text);
  const address = hasProtocol ? text : isEmail ? `mailto:${text}` : `https://${text}`;

  try {
    const url = new URL(address);

    // web page with a host
    if (!linkProtocols.includes(url.protocol) || (url.protocol !== 'mailto:' && !url.hostname)) return null;

    return url.href;
  } catch {
    return null;
  }
}
