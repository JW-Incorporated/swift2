// Paths the side-b static server answers with the reader page (the web serves them as real routes). Anything else
// without a file is a 404, so a typo or a missing asset still fails the parity run loudly.
export const SPA_ROUTES = ['/settings', '/settings/notifications', '/privacy', '/terms', '/support'];
export const isSpaRoute = (pathname) => SPA_ROUTES.includes(pathname);
