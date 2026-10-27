// Business API stays at the server root. Authentication uses the application's base.
export const NOTES_API_PATH = '/api';

export function isNotesApiRequest(requestUrl: string, baseURI: string): boolean {
  const base = new URL(baseURI);
  const url = new URL(requestUrl, base);
  return url.origin === base.origin &&
    (url.pathname === NOTES_API_PATH || url.pathname.startsWith(NOTES_API_PATH + '/'));
}
